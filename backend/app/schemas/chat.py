from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class ChartConfig(BaseModel):
    chart_type: str
    x_key: Optional[str] = ""
    y_keys: Optional[List[str]] = []


class ChatRequest(BaseModel):
    dataset_id: str
    question: str


class ChatResponse(BaseModel):
    sql: str
    result: List[Dict[str, Any]]
    explanation: Optional[str] = None
    chart_config: Optional[ChartConfig] = None