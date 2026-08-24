from typing import Any

from pydantic import BaseModel, Field


class CleaningRequest(BaseModel):
    dataset_id: str = Field(
        ...,
        description="ID of the dataset to clean",
    )


class CleaningResponse(BaseModel):
    dataset_id: str | None = None
    cleaned_dataset_id: str | None = None

    original_filename: str | None = None

    cleaned_filename: str | None = None

    original_file_path: str | None = None

    cleaned_file_path: str | None = None

    status: str

    summary: dict[str, Any] = {}

    changes: dict[str, Any] = {}

    changes_by_column: dict[str, Any] = {}

    skipped: dict[str, Any] = {}

    verification: dict[str, Any] = {}