import sqlite3
import pandas as pd


def execute_query(
    file_path: str,
    sql: str,
):
    """
    Execute SQL on an uploaded CSV, Excel, or SQLite file.

    CSV and Excel files are loaded into a Pandas DataFrame,
    then registered as an in-memory SQLite table named `dataset`.

    SQLite database files are queried directly.
    """

    # ==========================================
    # SQLite Database File
    # ==========================================

    if file_path.endswith((".db", ".sqlite", ".sqlite3")):
        conn = sqlite3.connect(file_path)

        try:
            result = pd.read_sql_query(sql, conn)
        finally:
            conn.close()

    # ==========================================
    # CSV / Excel
    # ==========================================

    else:
        # Load dataset
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)

        elif file_path.endswith((".xlsx", ".xls")):
            df = pd.read_excel(file_path)

        else:
            raise ValueError(
                "Unsupported file format."
            )

        # Create in-memory SQLite database
        conn = sqlite3.connect(":memory:")

        try:
            # Register DataFrame as SQLite table
            df.to_sql(
                "dataset",
                conn,
                index=False,
                if_exists="replace",
            )

            # Execute SQL
            result = pd.read_sql_query(
                sql,
                conn,
            )

        finally:
            conn.close()

    # Replace NaN values
    result = result.fillna("")

    # Return JSON-compatible records
    return result.to_dict(
        orient="records"
    )