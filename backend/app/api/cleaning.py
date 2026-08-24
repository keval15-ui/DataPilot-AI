from fastapi import APIRouter, HTTPException
import os

from app.schemas.cleaning import (
    CleaningRequest,
    CleaningResponse,
)
from app.services.cleaning_service import clean_dataset
from app.services.dataset_service import get_dataset, create_dataset
from app.services.file_service import read_dataset


router = APIRouter(
    prefix="/cleaning",
    tags=["Cleaning"],
)


@router.post(
    "/clean",
    response_model=CleaningResponse,
)
def clean_dataset_endpoint(
    request: CleaningRequest,
):
    """
    Clean an uploaded dataset without modifying
    the original file.

    The cleaned dataset is saved as a new file,
    then scanned again for verification.
    """

    # --------------------------------------------------------
    # 1. Find dataset metadata
    # --------------------------------------------------------

    dataset = get_dataset(
        request.dataset_id
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Dataset '{request.dataset_id}' "
                "was not found."
            ),
        )

    # --------------------------------------------------------
    # 2. Get the stored file path
    # --------------------------------------------------------

    file_path = (
        dataset.get("file_path")
        or dataset.get("filepath")
        or dataset.get("path")
    )

    if not file_path:
        raise HTTPException(
            status_code=404,
            detail=(
                "The dataset exists, but its "
                "file path could not be found."
            ),
        )

    # --------------------------------------------------------
    # 3. Run cleaning service
    # --------------------------------------------------------

    try:

        result = clean_dataset(
            file_path=file_path,
            dataset_id=request.dataset_id,
            original_filename=dataset.get(
                "filename"
            ),
        )

        # Register the cleaned dataset in Supabase and return the new cleaned_dataset_id
        cleaned_file_path = result.get("cleaned_file_path")
        cleaned_filename = result.get("cleaned_filename")
        if cleaned_file_path and os.path.exists(cleaned_file_path):
            cleaned_data = read_dataset(cleaned_file_path)
            metadata = {
                "path": cleaned_file_path,
                "original_filename": cleaned_filename,
                "stored_filename": cleaned_filename,
                "rows": cleaned_data["rows"],
                "columns": cleaned_data["columns"],
                "column_names": cleaned_data["column_names"],
                "column_info": cleaned_data["column_info"],
            }
            cleaned_dataset_id = create_dataset(metadata)
            result["cleaned_dataset_id"] = cleaned_dataset_id

    except FileNotFoundError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred "
                f"while cleaning the dataset: {exc}"
            ),
        ) from exc

    # --------------------------------------------------------
    # 4. Return cleaning + verification report
    # --------------------------------------------------------

    return result