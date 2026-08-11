from fastapi import APIRouter, HTTPException

from app.services.dataset_service import get_dataset
from app.services.quality_service import scan_dataset


router = APIRouter(
    prefix="/quality",
    tags=["Data Quality"],
)


@router.post("/scan")
def scan_dataset_quality(dataset_id: str):
    """
    Scan an already uploaded dataset for data quality issues.
    This endpoint does NOT modify the dataset.
    """

    try:
        # ------------------------------------------
        # Get dataset metadata
        # ------------------------------------------

        dataset = get_dataset(dataset_id)

        if not dataset:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found.",
            )

        # ------------------------------------------
        # Get stored file path
        # ------------------------------------------

        file_path = dataset.get("path")

        if not file_path:
            raise HTTPException(
                status_code=404,
                detail="Dataset file path not found.",
            )

        # ------------------------------------------
        # Scan dataset
        # ------------------------------------------

        report = scan_dataset(
            file_path=file_path,
            dataset_id=dataset_id,
            original_filename=dataset.get(
                "original_filename"
            ),
        )

        return report

    except HTTPException:
        raise

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Data quality scan failed: {str(e)}",
        )