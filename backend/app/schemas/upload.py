from pydantic import BaseModel
from typing import List, Dict, Any


class ColumnInfo(BaseModel):
    name: str
    datatype: str


class UploadResponse(BaseModel):
    dataset_id: str  
    original_filename: str
    stored_filename: str
    rows: int
    columns: int
    column_names: List[str]
    column_info: List[ColumnInfo]
    preview: List[Dict[str, Any]]