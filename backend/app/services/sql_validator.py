import os
import re
import sqlite3
from typing import Any, Dict, List, Tuple

def remove_sql_comments(sql: str) -> str:
    """
    Removes standard SQL single-line (--) and multi-line (/* ... */) comments,
    respecting string literals.
    """
    # 1. Remove multi-line comments
    sql_no_multiline = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)
    
    # 2. Remove single-line comments character by character to avoid messing up URLs/string literals
    lines = sql_no_multiline.splitlines()
    cleaned_lines = []
    for line in lines:
        in_s_quote = False
        in_d_quote = False
        comment_start = -1
        for idx, char in enumerate(line):
            if char == "'" and not in_d_quote:
                in_s_quote = not in_s_quote
            elif char == '"' and not in_s_quote:
                in_d_quote = not in_d_quote
            elif char == '-' and idx < len(line) - 1 and line[idx+1] == '-' and not in_s_quote and not in_d_quote:
                comment_start = idx
                break
        if comment_start != -1:
            line = line[:comment_start]
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)

def check_multiple_statements(sql: str) -> bool:
    """
    Returns True if the SQL string contains more than one statement.
    Splits on semicolons, ignoring those inside string literals or bracketed identifiers.
    """
    sql_clean = remove_sql_comments(sql).strip()
    in_single_quote = False
    in_double_quote = False
    in_square_bracket = False
    
    for i, char in enumerate(sql_clean):
        if char == "'" and not in_double_quote and not in_square_bracket:
            in_single_quote = not in_single_quote
        elif char == '"' and not in_single_quote and not in_square_bracket:
            in_double_quote = not in_double_quote
        elif char == '[' and not in_single_quote and not in_double_quote:
            in_square_bracket = True
        elif char == ']' and not in_single_quote and not in_double_quote:
            in_square_bracket = False
        elif char == ';' and not in_single_quote and not in_double_quote and not in_square_bracket:
            # Check if there is any non-whitespace command character after this semicolon
            remaining = sql_clean[i+1:].strip()
            if remaining:
                return True
    return False

def extract_string_literals(sql: str) -> List[str]:
    """
    Extracts all single-quoted string literals from the SQL string.
    Handles escaped single quotes ('').
    """
    literals = []
    in_quote = False
    current = []
    i = 0
    while i < len(sql):
        char = sql[i]
        if char == "'":
            if in_quote:
                # Check for escaped single quote
                if i + 1 < len(sql) and sql[i+1] == "'":
                    current.append("'")
                    i += 2
                    continue
                else:
                    literals.append("".join(current))
                    current = []
                    in_quote = False
            else:
                in_quote = True
        elif in_quote:
            current.append(char)
        i += 1
    return literals

def get_allowed_table_names(file_path: str) -> List[str]:
    """
    Determine table names allowed for queries.
    CSV/Excel files are strictly queried on "dataset".
    SQLite databases query tables present inside the database.
    """
    if not file_path:
        return ["dataset"]
        
    if file_path.endswith((".db", ".sqlite", ".sqlite3")):
        if not os.path.exists(file_path):
            return ["dataset"]
        conn = sqlite3.connect(file_path)
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            return tables if tables else ["dataset"]
        except Exception:
            return ["dataset"]
        finally:
            conn.close()
            
    return ["dataset"]

def check_categorical_values(sql: str, columns: List[Dict[str, Any]]) -> List[str]:
    """
    Inspects string literals compared against categorical columns.
    Generates a warning if the literal does not exist in the unique_values list.
    Only checks columns that explicitly include unique_values metadata.
    """
    warnings = []
    sql_clean = remove_sql_comments(sql)
    
    literals = extract_string_literals(sql_clean)
    if not literals:
        return warnings
        
    for col in columns:
        col_name = col.get("name")
        unique_vals = col.get("unique_values")
        
        # If unique_values list is present in metadata
        if col_name and unique_vals is not None:
            pattern = re.compile(rf"\b{re.escape(col_name)}\b", re.IGNORECASE)
            if pattern.search(sql_clean):
                # Check direct comparison patterns: col = 'val', col <> 'val', col != 'val', col LIKE 'val'
                comp_pattern = re.compile(
                    rf"\b{re.escape(col_name)}\b\s*(?:=|<>|!=|LIKE)\s*'([^']+)'",
                    re.IGNORECASE
                )
                matches = comp_pattern.findall(sql_clean)
                for val in matches:
                    clean_val = val.replace("''", "'")
                    if clean_val not in unique_vals:
                        warnings.append(
                            f"Categorical value '{clean_val}' is not in the observed unique values of column '{col_name}'."
                        )
                        
                # Check IN clauses: col IN ('val1', 'val2')
                in_pattern = re.compile(
                    rf"\b{re.escape(col_name)}\b\s+IN\s*\(([^)]+)\)",
                    re.IGNORECASE
                )
                in_matches = in_pattern.findall(sql_clean)
                for group in in_matches:
                    group_literals = extract_string_literals(group)
                    for val in group_literals:
                        clean_val = val.replace("''", "'")
                        if clean_val not in unique_vals:
                            warnings.append(
                                f"Categorical value '{clean_val}' is not in the observed unique values of column '{col_name}'."
                            )
    return warnings

def run_question_sanity_checks(question: str, sql: str) -> List[str]:
    """
    Run conservative structural sanity checks aligning user question with SQL structure.
    """
    warnings = []
    if not question:
        return warnings
        
    q_lower = question.lower()
    sql_upper = sql.upper()
    
    # 1. Average checking
    if any(w in q_lower for w in ["average", "avg", "mean"]):
        if not any(agg in sql_upper for agg in ["AVG(", "SUM(", "COUNT("]):
            warnings.append(
                "Question asks for an average/mean, but the SQL query does not contain AVG, SUM, or COUNT aggregates."
            )
            
    # 2. Count checking
    if any(w in q_lower for w in ["how many", "count", "number of", "total respondents", "total records"]):
        if not any(agg in sql_upper for agg in ["COUNT(", "SUM(", "GROUP BY"]):
            warnings.append(
                "Question asks for a count/total, but the SQL query does not contain COUNT, SUM, or GROUP BY aggregates."
            )
            
    # 3. Limit rules on single-value aggregations
    if "LIMIT " in sql_upper:
        has_aggregate = any(agg in sql_upper for agg in ["COUNT(", "AVG(", "SUM(", "MIN(", "MAX("])
        has_groupby = "GROUP BY" in sql_upper
        if has_aggregate and not has_groupby:
            # Only warn if the user didn't explicitly request a limit in the question
            if not any(w in q_lower for w in ["limit", "first", "top", "10", "5", "rows"]):
                warnings.append(
                    "SQL contains a LIMIT clause on a single-value aggregate query without a GROUP BY."
                )
                
    return warnings

def validate_sql(
    sql: str,
    columns: List[Dict[str, Any]],
    question: str = "",
    file_path: str = ""
) -> Dict[str, Any]:
    """
    Validates generated SQL query against dataset schema and safety rules.
    Excludes LLMs; runs entirely deterministically.
    """
    errors = []
    warnings = []
    
    # 1. Check for INSUFFICIENT_SCHEMA response
    stripped_sql = sql.strip().rstrip(";")
    if "INSUFFICIENT_SCHEMA" in stripped_sql.upper():
        return {
            "valid": True,
            "sql": "SELECT 'INSUFFICIENT_SCHEMA';",
            "errors": [],
            "warnings": [],
            "is_insufficient_schema": True
        }
        
    # 2. Read-only lexical checks
    disallowed_keywords = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", 
        "REPLACE", "TRUNCATE", "ATTACH", "DETACH", "PRAGMA"
    ]
    pattern = re.compile(
        rf"\b({'|'.join(disallowed_keywords)})\b",
        re.IGNORECASE
    )
    matches = pattern.findall(sql)
    if matches:
        for keyword in set(matches):
            errors.append(f"Disallowed write/modification keyword: '{keyword.upper()}'.")
            
    # 3. Check for multiple semicolon-separated statements
    if check_multiple_statements(sql):
        errors.append("Multiple SQL statements are not permitted.")
        
    # If we already have fatal lexical errors, skip DB compilation checks
    if errors:
        return {
            "valid": False,
            "sql": sql,
            "errors": errors,
            "warnings": warnings,
            "is_insufficient_schema": False
        }
        
    # 4. SQLite Schema & Syntax Compilation check via mock in-memory DB
    allowed_tables = get_allowed_table_names(file_path)
    
    # Connect to mock SQLite database in memory
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()
    try:
        # Create mock tables mirroring the actual dataset columns
        col_defs = []
        for col in columns:
            col_name = col.get("name")
            if not col_name:
                continue
            # Escaping column names for SQL safety
            escaped_col = col_name.replace('"', '""')
            col_defs.append(f'"{escaped_col}" TEXT')
            
        for tbl in allowed_tables:
            escaped_tbl = tbl.replace('"', '""')
            create_sql = f'CREATE TABLE "{escaped_tbl}" ({", ".join(col_defs)});'
            cursor.execute(create_sql)
            
        # Compile query using SQLite EXPLAIN (validates syntax, tables, and columns)
        # Semicolons are stripped to prevent SQLite compilation warnings
        cursor.execute(f"EXPLAIN {stripped_sql}")
    except sqlite3.Error as e:
        error_msg = str(e)
        # Simplify common SQLite errors
        if "no such table" in error_msg:
            errors.append(f"Invalid table reference. {error_msg.capitalize()}.")
        elif "no such column" in error_msg:
            errors.append(f"Invalid column reference. {error_msg.capitalize()}.")
        else:
            errors.append(f"SQL Syntax Error: {error_msg}")
    finally:
        conn.close()
        
    # 5. Categorical Value Validation
    cat_warnings = check_categorical_values(sql, columns)
    warnings.extend(cat_warnings)
    
    # 6. Intent & Limit Sanity Checks
    sanity_warnings = run_question_sanity_checks(question, sql)
    warnings.extend(sanity_warnings)
    
    return {
        "valid": len(errors) == 0,
        "sql": sql,
        "errors": errors,
        "warnings": warnings,
        "is_insufficient_schema": False
    }
