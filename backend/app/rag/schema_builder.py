from typing import Any, Dict, List


def build_schema_documents(
    dataset: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Convert dataset metadata into schema documents that can
    later be embedded and stored in a vector database.

    Each column becomes one schema document.
    """

    dataset_id = dataset.get("dataset_id")
    filename = dataset.get("original_filename")
    column_info = dataset.get("column_info", [])

    if not dataset_id:
        raise ValueError("Dataset ID is required.")

    if not column_info:
        raise ValueError("Dataset schema is empty.")

    documents = []

    for column in column_info:
        column_name = column.get("name")
        datatype = column.get("datatype")

        if not column_name:
            continue

        content = (
            f"Dataset: {filename}\n"
            f"Table: dataset\n"
            f"Column: {column_name}\n"
            f"Data type: {datatype}\n"
        )

        documents.append(
            {
                "dataset_id": dataset_id,
                "content": content,
                "metadata": {
                    "dataset_id": dataset_id,
                    "filename": filename,
                    "table": "dataset",
                    "column": column_name,
                    "datatype": datatype,
                },
            }
        )

    return documents