from uuid import uuid4

from app.database.supabase import supabase

TABLE_NAME = "datasets"


def create_dataset(metadata: dict) -> str:
    dataset_id = str(uuid4())

    data = {
        "dataset_id": dataset_id,
        **metadata,
    }

    (
        supabase.table(TABLE_NAME)
        .insert(data)
        .execute()
    )

    return dataset_id


def get_dataset(dataset_id: str):
    response = (
        supabase.table(TABLE_NAME)
        .select("*")
        .eq("dataset_id", dataset_id)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]


def list_datasets():
    response = (
        supabase.table(TABLE_NAME)
        .select("*")
        .execute()
    )

    return response.data


def delete_dataset(dataset_id: str):
    (
        supabase.table(TABLE_NAME)
        .delete()
        .eq("dataset_id", dataset_id)
        .execute()
    )