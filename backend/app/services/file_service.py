import os
import uuid
import shutil
import pandas as pd

from fastapi import UploadFile

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


# ==========================================
# Validate Uploaded File
# ==========================================

def validate_file(file: UploadFile) -> str:
    """
    Validate uploaded file extension.
    """

    if not file.filename:
        raise ValueError("Invalid filename.")

    extension = file.filename.split(".")[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Only CSV and Excel files are supported."
        )

    return extension


# ==========================================
# Save Uploaded File
# ==========================================

def save_uploaded_file(file: UploadFile):
    """
    Save uploaded file to disk.
    """

    extension = validate_file(file)

    contents = file.file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise ValueError(
            "Maximum allowed file size is 50 MB."
        )

    # Reset file pointer
    file.file.seek(0)

    if extension == "csv":
        folder = os.path.join(UPLOAD_DIR, "csv")
    else:
        folder = os.path.join(UPLOAD_DIR, "excel")

    os.makedirs(folder, exist_ok=True)

    unique_filename = f"{uuid.uuid4()}.{extension}"

    file_path = os.path.abspath(
    os.path.join(folder, unique_filename)
)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path, unique_filename


# ==========================================
# Read Dataset
# ==========================================

def read_dataset(file_path: str):
    """
    Read CSV/Excel dataset and return metadata.
    """

    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    # Replace NaN values
    df = df.fillna("")

    # Column information
    column_info = [
        {
            "name": column,
            "datatype": str(df[column].dtype),
        }
        for column in df.columns
    ]

    # Preview (first 10 rows)
    preview = df.head(10).to_dict(orient="records")

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "column_info": column_info,
        "preview": preview,
    }


# ==========================================
# Delete Uploaded File
# ==========================================

def delete_uploaded_file(file_path: str) -> bool:
    """
    Delete a file from disk.
    """

    if os.path.exists(file_path):
        os.remove(file_path)
        return True

    return False