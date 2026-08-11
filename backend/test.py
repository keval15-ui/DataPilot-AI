from app.rag.schema_builder import build_schema_documents

dataset = {
    "dataset_id": "test-id",
    "original_filename": "bank.csv",
    "column_info": [
        {"name": "age", "datatype": "int64"},
        {"name": "job", "datatype": "object"},
        {"name": "balance", "datatype": "int64"},
        {"name": "loan", "datatype": "object"},
    ],
}

documents = build_schema_documents(dataset)

for document in documents:
    print(document)