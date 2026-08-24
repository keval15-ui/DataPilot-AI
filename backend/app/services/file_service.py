import os
import uuid
import shutil
import sqlite3
from typing import Any

import pandas as pd
from fastapi import UploadFile


# ============================================================
# Configuration
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

UPLOAD_DIR = os.path.join(
    BASE_DIR,
    "uploads",
)

ALLOWED_EXTENSIONS = {
    "csv",
    "xlsx",
    "xls",
    "db",
    "sqlite",
    "sqlite3",
}

MAX_FILE_SIZE = 50 * 1024 * 1024

# Maximum number of unique categorical values that will
# be included in column metadata.
MAX_UNIQUE_VALUES_FOR_METADATA = 50


# ============================================================
# Validate Uploaded File
# ============================================================

def validate_file(
    file: UploadFile,
) -> str:
    """
    Validate uploaded file extension.
    """

    if not file.filename:
        raise ValueError(
            "Invalid filename."
        )

    extension = (
        file.filename
        .split(".")[-1]
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Only CSV, Excel, and SQLite files are supported."
        )

    return extension


# ============================================================
# Save Uploaded File
# ============================================================

def save_uploaded_file(
    file: UploadFile,
):
    """
    Save uploaded file to disk.
    """

    extension = validate_file(
        file
    )

    contents = file.file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise ValueError(
            "Maximum allowed file size is 50 MB."
        )

    # Reset file pointer.
    file.file.seek(0)

    if extension == "csv":

        folder = os.path.join(
            UPLOAD_DIR,
            "csv",
        )

    elif extension in {
        "xlsx",
        "xls",
    }:

        folder = os.path.join(
            UPLOAD_DIR,
            "excel",
        )

    else:

        folder = os.path.join(
            UPLOAD_DIR,
            "sqlite",
        )

    os.makedirs(
        folder,
        exist_ok=True,
    )

    unique_filename = (
        f"{uuid.uuid4()}.{extension}"
    )

    file_path = os.path.abspath(
        os.path.join(
            folder,
            unique_filename,
        )
    )

    with open(
        file_path,
        "wb",
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer,
        )

    return (
        file_path,
        unique_filename,
    )


# ============================================================
# JSON-Safe Value
# ============================================================

def _json_safe_value(
    value: Any,
) -> Any:
    """
    Convert Pandas/NumPy values into values that can safely
    be returned through FastAPI/Pydantic.
    """

    if value is None:
        return None

    try:

        if pd.isna(value):
            return None

    except (
        TypeError,
        ValueError,
    ):
        pass

    if isinstance(
        value,
        (
            pd.Timestamp,
        ),
    ):

        return value.isoformat()

    # NumPy scalar values.
    if hasattr(
        value,
        "item",
    ):

        try:
            return value.item()

        except (
            ValueError,
            TypeError,
        ):
            pass

    return value


# ============================================================
# Column Profiling
# ============================================================

def _build_column_info(
    df: pd.DataFrame,
) -> list[dict[str, Any]]:
    """
    Build generic metadata for EVERY column.

    This function is completely dataset-agnostic.

    It does not assume:
        healthcare
        banking
        e-commerce
        surveys
        sales
        etc.

    For low-cardinality columns, actual observed values are
    included so the SQL-generation layer can understand
    categorical semantics.
    """

    column_info = []

    total_rows = len(df)

    for column in df.columns:

        series = df[column]

        # -----------------------------------------------
        # Basic information
        # -----------------------------------------------

        missing_count = int(
            series.isna().sum()
        )

        non_null = series.dropna()

        unique_count = int(
            non_null.nunique(
                dropna=True
            )
        )

        info: dict[str, Any] = {
            "name": str(column),
            "datatype": str(
                series.dtype
            ),
            "total_values": total_rows,
            "missing_count": missing_count,
            "unique_count": unique_count,
        }

        # -----------------------------------------------
        # Include observed categorical values only when
        # cardinality is reasonably small.
        # -----------------------------------------------

        if (
            unique_count > 0
            and unique_count
            <= MAX_UNIQUE_VALUES_FOR_METADATA
        ):

            unique_values = (
                non_null
                .drop_duplicates()
                .tolist()
            )

            safe_values = []

            for value in unique_values:

                safe_value = (
                    _json_safe_value(
                        value
                    )
                )

                if safe_value is not None:

                    safe_values.append(
                        safe_value
                    )

            info[
                "unique_values"
            ] = safe_values

        column_info.append(
            info
        )

    return column_info


# ============================================================
# Build JSON-Safe Preview
# ============================================================

def _build_preview(
    df: pd.DataFrame,
    rows: int = 10,
) -> list[dict[str, Any]]:
    """
    Build a JSON-safe preview without modifying the
    underlying dataset.
    """

    preview_df = df.head(
        rows
    )

    preview_records = (
        preview_df
        .to_dict(
            orient="records"
        )
    )

    safe_records = []

    for record in preview_records:

        safe_record = {}

        for key, value in record.items():

            safe_record[str(key)] = (
                _json_safe_value(
                    value
                )
            )

        safe_records.append(
            safe_record
        )

    return safe_records


# ============================================================
# Read Dataset
# ============================================================

def read_dataset(
    file_path: str,
):
    """
    Read CSV/Excel/SQLite dataset and return metadata.

    The original data is NOT modified.

    Metadata contains generic information for every column:
        - name
        - datatype
        - total values
        - missing count
        - unique count
        - low-cardinality observed values
    """

    # ========================================================
    # CSV
    # ========================================================

    if file_path.endswith(
        ".csv"
    ):

        try:

            df = pd.read_csv(
                file_path
            )

        except UnicodeDecodeError:

            df = pd.read_csv(
                file_path,
                encoding="latin1",
            )

    # ========================================================
    # Excel
    # ========================================================

    elif file_path.endswith(
        (
            ".xlsx",
            ".xls",
        )
    ):

        df = pd.read_excel(
            file_path
        )

    # ========================================================
    # SQLite
    # ========================================================

    elif file_path.endswith(
        (
            ".db",
            ".sqlite",
            ".sqlite3",
        )
    ):

        conn = sqlite3.connect(
            file_path
        )

        try:

            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT name
                FROM sqlite_master
                WHERE type='table';
                """
            )

            tables = [
                row[0]
                for row in cursor.fetchall()
            ]

            if not tables:

                raise ValueError(
                    "No tables found in SQLite database."
                )

            # Use the first table, matching the existing
            # project behavior.
            table_name = tables[0]

            # Quote the table name safely for SQLite.
            escaped_table_name = (
                table_name.replace(
                    '"',
                    '""',
                )
            )

            df = pd.read_sql_query(
                f'SELECT * FROM "{escaped_table_name}"',
                conn,
            )

        finally:

            conn.close()

    # ========================================================
    # Unsupported
    # ========================================================

    else:

        raise ValueError(
            "Unsupported file format."
        )

    # ========================================================
    # Build metadata WITHOUT modifying df
    # ========================================================

    column_info = _build_column_info(
        df
    )

    preview = _build_preview(
        df,
        rows=10,
    )

    return {
        "rows": len(df),

        "columns": len(
            df.columns
        ),

        "column_names": [
            str(column)
            for column in df.columns
        ],

        "column_info": column_info,

        "preview": preview,
    }


# ============================================================
# Delete Uploaded File
# ============================================================

def delete_uploaded_file(
    file_path: str,
) -> bool:
    """
    Delete a file from disk.
    """

    if os.path.exists(
        file_path
    ):

        os.remove(
            file_path
        )

        return True

    return False