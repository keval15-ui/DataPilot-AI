from pydantic import BaseModel
from typing import List, Dict, Any


class ChatRequest(BaseModel):
    dataset_id: str
    question: str


class ChatResponse(BaseModel):
    sql: str
    result: List[Dict[str, Any]]