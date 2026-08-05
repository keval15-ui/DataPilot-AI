from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.file_service import (
    save_uploaded_file,
    read_dataset,
)

from app.schemas.upload import UploadResponse
from app.services.dataset_service import create_dataset

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)


@router.post("", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)):

    print("✅ Endpoint reached")

    try:
        # Save uploaded file
        file_path, stored_filename = save_uploaded_file(file)

        # Read dataset
        dataset = read_dataset(file_path)

        # Register dataset
        metadata = {
            "path": file_path,
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "rows": dataset["rows"],
            "columns": dataset["columns"],
            "column_names": dataset["column_names"],
            "column_info": dataset["column_info"],
        }

        dataset_id = create_dataset(metadata)

        # Add extra fields to response
        dataset["dataset_id"] = dataset_id
        dataset["original_filename"] = file.filename
        dataset["stored_filename"] = stored_filename

        return dataset

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )