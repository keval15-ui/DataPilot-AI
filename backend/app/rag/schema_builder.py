from typing import Any, Dict, List


def build_schema_documents(
    dataset: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Convert dataset metadata into schema documents.

    Each column becomes one schema document.

    The function is dataset-agnostic and can optionally
    include actual categorical values when they are available
    in the dataset metadata.
    """

    dataset_id = dataset.get("dataset_id")
    filename = dataset.get("original_filename")

    column_info = dataset.get(
        "column_info",
        [],
    )

    if not dataset_id:
        raise ValueError(
            "Dataset ID is required."
        )

    if not column_info:
        raise ValueError(
            "Dataset schema is empty."
        )

    documents: List[Dict[str, Any]] = []

    for column in column_info:

        column_name = column.get(
            "name"
        )

        datatype = column.get(
            "datatype"
        )

        if not column_name:
            continue

        # ----------------------------------------------------
        # Optional metadata
        # ----------------------------------------------------

        unique_count = column.get(
            "unique_count"
        )

        missing_count = column.get(
            "missing_count"
        )

        # Support different possible metadata names.
        unique_values = (
            column.get("unique_values")
            or column.get("values")
            or column.get("categories")
            or []
        )

        # Make sure it is actually a list.
        if not isinstance(
            unique_values,
            list,
        ):
            unique_values = []

        # Prevent extremely large prompts/documents.
        unique_values = unique_values[:50]

        # ----------------------------------------------------
        # Build document content
        # ----------------------------------------------------

        content_parts = [
            f"Dataset: {filename}",
            "Table: dataset",
            f"Column: {column_name}",
            f"Data type: {datatype}",
        ]

        if unique_count is not None:

            content_parts.append(
                f"Unique values count: {unique_count}"
            )

        if missing_count is not None:

            content_parts.append(
                f"Missing values: {missing_count}"
            )

        if unique_values:

            formatted_values = ", ".join(
                repr(str(value))
                for value in unique_values
            )

            content_parts.append(
                f"Observed values: {formatted_values}"
            )

        content = "\n".join(
            content_parts
        )

        # ----------------------------------------------------
        # Metadata
        # ----------------------------------------------------

        metadata = {
            "dataset_id": dataset_id,
            "filename": filename,
            "table": "dataset",
            "column": column_name,
            "datatype": datatype,
        }

        if unique_count is not None:

            metadata[
                "unique_count"
            ] = unique_count

        if missing_count is not None:

            metadata[
                "missing_count"
            ] = missing_count

        if unique_values:

            metadata[
                "unique_values"
            ] = unique_values

        documents.append(
            {
                "dataset_id": dataset_id,
                "content": content,
                "metadata": metadata,
            }
        )

    return documents