from uuid import uuid4
from typing import Dict, Any

# In-memory registry
datasets: Dict[str, Dict[str, Any]] = {}


def register_dataset(metadata: Dict[str, Any]) -> str:
    """
    Register a dataset and return its unique ID.
    """
    dataset_id = str(uuid4())
    datasets[dataset_id] = metadata
    return dataset_id


def get_dataset(dataset_id: str) -> Dict[str, Any] | None:
    """
    Retrieve dataset metadata by ID.
    """
    return datasets.get(dataset_id)


def list_datasets() -> Dict[str, Dict[str, Any]]:
    """
    Return all registered datasets.
    """
    return datasets


def delete_dataset(dataset_id: str) -> bool:
    """
    Remove a dataset from the registry.
    """
    if dataset_id in datasets:
        del datasets[dataset_id]
        return True
    return False