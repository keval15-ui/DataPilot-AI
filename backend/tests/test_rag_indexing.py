import sys
import os
import unittest
from unittest.mock import MagicMock, patch
from typing import List

# Ensure the backend directory is in the python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.rag.schema_builder import build_schema_documents
from app.services.rag_service import (
    EmbeddingProvider,
    get_embedding_provider, 
    generate_embedding, 
    index_dataset_schema, 
    delete_dataset_schema_embeddings
)

# Deterministic Mock Embedding Provider for offline tests
class MockEmbeddingProvider(EmbeddingProvider):
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def generate_embedding(self, text: str) -> List[float]:
        import hashlib
        import numpy as np
        # Deterministic generation using SHA-256 hash of the text
        hash_object = hashlib.sha256(text.encode("utf-8"))
        hex_dig = hash_object.hexdigest()
        seed = int(hex_dig[:8], 16)
        rng = np.random.default_rng(seed)
        vector = rng.standard_normal(self.dimension)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return [float(x) for x in vector]

    def get_dimension(self) -> int:
        return self.dimension


class TestRAGIndexing(unittest.TestCase):
    def setUp(self):
        # Patch the embedding provider globally for all test methods
        self.patcher = patch("app.services.rag_service.get_embedding_provider")
        self.mock_get_provider = self.patcher.start()
        
        self.mock_provider = MockEmbeddingProvider(dimension=384)
        self.mock_get_provider.return_value = self.mock_provider

        # Configure environment variables
        os.environ["EMBEDDING_PROVIDER"] = "local"
        os.environ["EMBEDDING_MODEL"] = "sentence-transformers/all-MiniLM-L6-v2"
        os.environ["EMBEDDING_DIMENSION"] = "384"
        
        # Mock dataset with standard columns
        self.mock_dataset_a = {
            "dataset_id": "dataset-a-uuid",
            "original_filename": "sales.xlsx",
            "column_info": [
                {"name": "Region", "datatype": "object", "unique_count": 4, "unique_values": ["North", "South", "East", "West"]},
                {"name": "Sales", "datatype": "float64", "unique_count": 1000, "missing_count": 0}, # High cardinality
                {"name": "Profit", "datatype": "float64", "unique_count": 950, "missing_count": 5}, # High cardinality
                {"name": "Order_Status", "datatype": "object", "unique_count": 3, "unique_values": ["Pending", "Shipped", "Cancelled"]}
            ]
        }

        self.mock_dataset_b = {
            "dataset_id": "dataset-b-uuid",
            "original_filename": "hr_data.csv",
            "column_info": [
                {"name": "Department", "datatype": "object", "unique_count": 5, "unique_values": ["HR", "Engineering", "Sales", "Marketing", "Finance"]},
                {"name": "Salary", "datatype": "int64", "unique_count": 200, "missing_count": 0}
            ]
        }

    def tearDown(self):
        self.patcher.stop()

    # 1. Schema documents are generated.
    def test_schema_documents_generation(self):
        docs = build_schema_documents(self.mock_dataset_a)
        self.assertEqual(len(docs), 4) # One per column
        for doc in docs:
            self.assertIn("content", doc)
            self.assertIn("metadata", doc)
            self.assertIn("dataset_id", doc)

    # 2. Every document contains dataset_id.
    def test_every_document_contains_dataset_id(self):
        docs = build_schema_documents(self.mock_dataset_a)
        for doc in docs:
            self.assertEqual(doc["dataset_id"], "dataset-a-uuid")
            self.assertEqual(doc["metadata"]["dataset_id"], "dataset-a-uuid")

    # 3. Every document contains column metadata.
    def test_every_document_contains_column_metadata(self):
        docs = build_schema_documents(self.mock_dataset_a)
        columns_found = [doc["metadata"]["column"] for doc in docs]
        self.assertIn("Region", columns_found)
        self.assertIn("Sales", columns_found)
        self.assertIn("Profit", columns_found)
        self.assertIn("Order_Status", columns_found)

    # 4. High-cardinality columns do not contain huge value lists.
    def test_high_cardinality_omits_observed_values(self):
        docs = build_schema_documents(self.mock_dataset_a)
        sales_doc = next(d for d in docs if d["metadata"]["column"] == "Sales")
        
        # Since unique_count is 1000 (>50), unique_values should not be embedded
        self.assertNotIn("Observed values", sales_doc["content"])
        self.assertNotIn("unique_values", sales_doc["metadata"])
        
        # Verify text fields with metadata do contain observed values
        region_doc = next(d for d in docs if d["metadata"]["column"] == "Region")
        self.assertIn("Observed values", region_doc["content"])
        self.assertIn("unique_values", region_doc["metadata"])

    # 5. Embedding output matches the configured dimension.
    def test_embedding_dimension(self):
        provider = get_embedding_provider()
        self.assertEqual(provider.get_dimension(), 384)
        
        vector = generate_embedding("Sample text")
        self.assertEqual(len(vector), 384)
        
        # Assert unit-length normalized vector
        self.assertAlmostEqual(sum(x*x for x in vector), 1.0, places=4)

    # 6. One schema embedding is created per column.
    @patch("app.services.rag_service.supabase")
    def test_one_embedding_per_column_inserted(self, mock_supabase):
        mock_insert = MagicMock()
        mock_supabase.table.return_value.insert = mock_insert
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute = MagicMock()
        
        index_dataset_schema(self.mock_dataset_a)
        
        # Verify insert is called
        mock_insert.assert_called_once()
        inserted_rows = mock_insert.call_args[0][0]
        
        # Check count of rows equals count of columns
        self.assertEqual(len(inserted_rows), 4)
        for row in inserted_rows:
            self.assertEqual(row["dataset_id"], "dataset-a-uuid")
            self.assertEqual(len(row["embedding"]), 384)

    # 7. Re-indexing the same dataset does not create duplicates (idempotency check).
    @patch("app.services.rag_service.supabase")
    def test_idempotent_clears_old_index_first(self, mock_supabase):
        mock_delete = MagicMock()
        mock_eq = MagicMock()
        mock_supabase.table.return_value.delete = mock_delete
        mock_delete.return_value.eq = mock_eq
        mock_eq.return_value.execute = MagicMock()
        mock_supabase.table.return_value.insert.return_value.execute = MagicMock()
        
        index_dataset_schema(self.mock_dataset_a)
        
        # Verify delete was triggered for dataset_id first
        mock_delete.assert_called_once()
        mock_eq.assert_called_with("dataset_id", "dataset-a-uuid")

    # 8. Dataset A and Dataset B remain isolated.
    @patch("app.services.rag_service.supabase")
    def test_dataset_isolation_during_indexing(self, mock_supabase):
        mock_insert = MagicMock()
        mock_supabase.table.return_value.insert = mock_insert
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute = MagicMock()
        
        # Index Dataset A
        index_dataset_schema(self.mock_dataset_a)
        rows_a = mock_insert.call_args_list[0][0][0]
        for r in rows_a:
            self.assertEqual(r["dataset_id"], "dataset-a-uuid")
            
        # Index Dataset B
        index_dataset_schema(self.mock_dataset_b)
        rows_b = mock_insert.call_args_list[1][0][0]
        for r in rows_b:
            self.assertEqual(r["dataset_id"], "dataset-b-uuid")

    # 9. Deleting Dataset A does not affect Dataset B.
    @patch("app.services.rag_service.supabase")
    def test_delete_only_removes_targeted_dataset(self, mock_supabase):
        mock_delete = MagicMock()
        mock_eq = MagicMock()
        mock_supabase.table.return_value.delete = mock_delete
        mock_delete.return_value.eq = mock_eq
        mock_eq.return_value.execute = MagicMock()
        
        delete_dataset_schema_embeddings("dataset-a-uuid")
        
        mock_delete.assert_called_once()
        mock_eq.assert_called_with("dataset_id", "dataset-a-uuid")
        # Ensure it didn't call delete with dataset-b-uuid
        self.assertNotIn("dataset-b-uuid", mock_eq.call_args[0])

    # 10. Raw dataset rows are NOT embedded/stored.
    @patch("app.services.rag_service.supabase")
    def test_no_raw_dataset_rows_inserted(self, mock_supabase):
        mock_insert = MagicMock()
        mock_supabase.table.return_value.insert = mock_insert
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute = MagicMock()
        
        index_dataset_schema(self.mock_dataset_a)
        
        inserted_rows = mock_insert.call_args[0][0]
        for row in inserted_rows:
            # Document content must represent schema/column information, not data row list
            self.assertIn("Column:", row["content"])
            self.assertIn("Data type:", row["content"])
            # Ensure it is not a row dict
            self.assertNotIn("RegionValue", row["content"])

    # 11. Healthcare-specific terminology is NOT hardcoded.
    def test_no_healthcare_hardcoding_in_documents(self):
        docs = build_schema_documents(self.mock_dataset_a)
        for doc in docs:
            content = doc["content"]
            # Verify no medical concepts are accidentally included
            self.assertNotIn("BP", content)
            self.assertNotIn("Diabetes", content)
            self.assertNotIn("Health_Problems", content)

    # 12. Generic dataset indexing works.
    @patch("app.services.rag_service.supabase")
    def test_generic_dataset_indexing(self, mock_supabase):
        mock_insert = MagicMock()
        mock_supabase.table.return_value.insert = mock_insert
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute = MagicMock()
        
        # This will execute with our generic columns dataset setup in setUp
        index_dataset_schema(self.mock_dataset_a)
        mock_insert.assert_called_once()

if __name__ == "__main__":
    unittest.main()
