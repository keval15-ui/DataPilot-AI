from fastapi import APIRouter, HTTPException

from app.services.dataset_service import (
    get_dataset,
    list_datasets,
)

router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


@router.get("")
def get_all_datasets():
    return list_datasets()


@router.get("/{dataset_id}")
def get_dataset_by_id(dataset_id: str):

    dataset = get_dataset(dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    return dataset