import os
import json
import math
import pandas as pd
from typing import Any, Dict, List
from app.services.dataset_service import get_dataset
from app.services.quality_service import scan_dataset
from app.llm.groq_client import client, MODEL_NAME

def sanitize_value(val: Any) -> Any:
    """
    Recursively sanitize values to ensure they are fully JSON-serializable.
    Handles NaN, inf, and numpy/pandas data types.
    """
    if val is None:
        return None
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
        return round(val, 2)
    if isinstance(val, dict):
        return {k: sanitize_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [sanitize_value(v) for v in val]
    if hasattr(val, "item"):
        try:
            return sanitize_value(val.item())
        except:
            pass
    if not isinstance(val, (str, int, bool)):
        return str(val)
    return val

def generate_executive_report(dataset_id: str) -> Dict[str, Any]:
    """
    Perform deterministic calculations on the complete dataset to build
    a grounded Executive Analytics Report summary.
    """
    # 1. Retrieve dataset details from registry
    dataset = get_dataset(dataset_id)
    if not dataset:
        raise FileNotFoundError("Dataset not found in database.")

    file_path = dataset.get("path") or dataset.get("file_path") or dataset.get("filepath")
    if not file_path or not os.path.exists(file_path):
        raise FileNotFoundError("Dataset physical file not found on backend storage.")

    original_filename = dataset.get("original_filename", "dataset.csv")

    # 2. Load the complete dataset
    if file_path.endswith(".csv"):
        try:
            df = pd.read_csv(file_path)
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding="latin1")
    elif file_path.endswith((".xlsx", ".xls")):
        df = pd.read_excel(file_path)
    elif file_path.endswith((".db", ".sqlite", ".sqlite3")):
        import sqlite3
        conn = sqlite3.connect(file_path)
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            if not tables:
                raise ValueError("No tables found in SQLite database.")
            # Query the first table
            df = pd.read_sql_query(f'SELECT * FROM "{tables[0]}"', conn)
        finally:
            conn.close()
    else:
        raise ValueError("Unsupported file format for executive report.")

    # Replace NaN values with None for helper safety, but preserve calculations
    total_rows = len(df)
    total_columns = len(df.columns)

    if total_rows == 0:
        raise ValueError("The dataset is empty.")

    # 3. Fetch Quality Report
    try:
        quality_report = scan_dataset(file_path, dataset_id, original_filename)
    except Exception as e:
        print(f"Warning: Quality scan failed during report building: {e}")
        quality_report = {}

    quality_score = quality_report.get("quality_score", 100)
    quality_status = quality_report.get("status", "clean")
    total_missing = quality_report.get("summary", {}).get("total_missing_values", 0)
    duplicate_rows = quality_report.get("summary", {}).get("duplicate_rows", 0)
    sql_issues_count = len(quality_report.get("sql_issues", []))

    # 4. Profile Columns
    numerical_cols = []
    categorical_cols = []
    date_cols = []
    cols_with_missing = []
    constant_cols = []

    for col in df.columns:
        series = df[col]
        missing_cnt = int(series.isna().sum())
        if missing_cnt > 0:
            cols_with_missing.append(str(col))
        
        # Check constant
        if series.nunique(dropna=True) <= 1:
            constant_cols.append(str(col))

        # Check types
        if pd.api.types.is_numeric_dtype(series):
            numerical_cols.append(str(col))
        elif pd.api.types.is_datetime64_any_dtype(series) or "date" in str(col).lower() or "time" in str(col).lower():
            date_cols.append(str(col))
        else:
            categorical_cols.append(str(col))

    # 5. Numerical Summaries
    numerical_stats = []
    for col in numerical_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        stats = {
            "column": col,
            "count": int(len(series)),
            "missing_count": int(df[col].isna().sum()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "min": float(series.min()),
            "max": float(series.max()),
            "std": float(series.std()) if len(series) > 1 else 0.0
        }
        numerical_stats.append(sanitize_value(stats))

    # 6. Categorical Summaries
    categorical_stats = []
    for col in categorical_cols:
        series = df[col]
        non_null = series.dropna()
        unique_cnt = int(non_null.nunique())
        
        if len(non_null) > 0:
            most_freq = non_null.mode()
            if not most_freq.empty:
                top_val = most_freq[0]
                freq = int((non_null == top_val).sum())
                pct = round((freq / total_rows) * 100, 1)
            else:
                top_val = None
                freq = 0
                pct = 0.0
        else:
            top_val = None
            freq = 0
            pct = 0.0

        stats = {
            "column": col,
            "unique_count": unique_cnt,
            "most_frequent_value": top_val,
            "frequency": freq,
            "percentage": pct,
            "missing_count": int(series.isna().sum())
        }
        categorical_stats.append(sanitize_value(stats))

    # 7. Categorical Distributions (cardinality 2-15)
    distributions = {}
    for col in categorical_cols:
        unique_vals_count = df[col].nunique(dropna=True)
        if 2 <= unique_vals_count <= 15:
            counts = df[col].value_counts(dropna=True)
            dist_list = []
            for val, count in counts.items():
                dist_list.append({
                    "category": str(val),
                    "count": int(count),
                    "percentage": round(float(count / total_rows) * 100, 1)
                })
            distributions[col] = dist_list
            if len(distributions) >= 4:
                break

    # 8. Generate Narrative Summaries (Anti-Hallucination Guarded Prompt)
    prompt = f"""
You are an expert executive data analyst. You are compiling an Executive Report based on deterministic summary statistics of a dataset.

Dataset Name: {original_filename}
Total Rows: {total_rows}
Total Columns: {total_columns}

--- Summary Statistics (Computed Deterministically on the Full Dataset) ---
Numerical Columns statistics:
{json.dumps(numerical_stats, indent=2)}

Categorical Columns statistics:
{json.dumps(categorical_stats, indent=2)}

Important Distributions:
{json.dumps(distributions, indent=2)}

--- Strict Prompt Rules ---
1. Key Findings: Write 3 to 5 clear, interesting executive findings (as a bulleted list). You MUST refer ONLY to the provided numbers. NEVER invent numbers or extrapolate beyond the provided statistics.
   Examples: "The average respondent age is 51.54 years." or "12 of 41 respondents have a recorded value in the health_problems column."
2. Patterns & Observations: Write a concise paragraph (2-4 sentences) describing patterns or associations in the data. Do NOT claim causation (e.g. do not say "X causes Y"). Use descriptive phrasing like "was associated with", "was more common than", or "appeared more frequently".
3. AI Recommendations: Generate 4 to 5 recommendations for further analysis. Recommendations must reference actual columns that exist in the dataset.
4. Suggested Questions: Generate 5 natural-language questions that the user can ask in the Chat interface to explore the dataset further. They must be directly related to the columns in the dataset.

Return ONLY a valid JSON object matching the following schema. Do not include any wrapping markdown.

Schema:
{{
  "findings": ["string finding 1", "string finding 2", ...],
  "patterns": "patterns and observations paragraph",
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "suggested_questions": ["question 1", "question 2", ...]
}}
"""

    fallback_content = {
        "findings": [
            f"The dataset contains {total_rows} rows and {total_columns} columns.",
            f"There are {len(numerical_cols)} numerical columns and {len(categorical_cols)} categorical columns.",
            f"A total of {total_missing} missing values were detected during profiling."
        ],
        "patterns": f"The dataset '{original_filename}' contains structured records with {total_columns} variables. Data quality score is {quality_score}/100, which has an overall status of '{quality_status}'.",
        "recommendations": [
            "Analyze relationships between numerical metrics.",
            "Compare categorical value counts to identify patterns.",
            "Address missing values in key columns."
        ],
        "suggested_questions": [
            "What are the main statistics for numerical columns?",
            "What is the most frequent value across categorical fields?",
            "Which columns contain the most missing values?"
        ]
    }

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        data = json.loads(content)
        
        findings = data.get("findings") or fallback_content["findings"]
        patterns = data.get("patterns") or fallback_content["patterns"]
        recommendations = data.get("recommendations") or fallback_content["recommendations"]
        suggested_questions = data.get("suggested_questions") or fallback_content["suggested_questions"]
    except Exception as e:
        print(f"Error calling Groq for executive report: {e}")
        findings = fallback_content["findings"]
        patterns = fallback_content["patterns"]
        recommendations = fallback_content["recommendations"]
        suggested_questions = fallback_content["suggested_questions"]

    # 9. Compile Full Report Payload
    report_payload = {
        "overview": {
            "filename": original_filename,
            "rows": total_rows,
            "columns": total_columns,
            "dataset_id": dataset_id,
            "timestamp": pd.Timestamp.now().isoformat()
        },
        "quality": {
            "score": quality_score,
            "status": quality_status,
            "total_missing": total_missing,
            "columns_with_missing_count": len(cols_with_missing),
            "constant_columns_count": len(constant_cols),
            "duplicate_rows": duplicate_rows,
            "schema_issues": sql_issues_count
        },
        "profile": {
            "numerical_columns_count": len(numerical_cols),
            "categorical_columns_count": len(categorical_cols),
            "date_columns_count": len(date_cols),
            "columns_with_missing_count": len(cols_with_missing),
            "constant_columns_count": len(constant_cols)
        },
        "numerical_summary": numerical_stats,
        "categorical_summary": categorical_stats,
        "distributions": distributions,
        "narrative": {
            "findings": findings,
            "patterns": patterns,
            "recommendations": recommendations,
            "suggested_questions": suggested_questions
        }
    }

    return sanitize_value(report_payload)
