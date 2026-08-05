import duckdb
import pandas as pd


def execute_query(
    file_path: str,
    sql: str,
):
    """
    Execute SQL on an uploaded CSV or Excel file.
    """

    # Load dataset
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)

    elif file_path.endswith((".xlsx", ".xls")):
        df = pd.read_excel(file_path)

    else:
        raise ValueError("Unsupported file format.")

    # Create in-memory DuckDB connection
    conn = duckdb.connect()

    # Register dataframe as table
    conn.register("dataset", df)

    # Execute SQL
    result = conn.execute(sql).fetchdf()

    # Close connection
    conn.close()

    # Return JSON
    return result.fillna("").to_dict(
        orient="records"
    )