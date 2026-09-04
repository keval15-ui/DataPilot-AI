import sys
import os
import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from typing import List, Any

# Ensure the backend directory is in the python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.llm.prompt_builder import build_sql_prompt, build_sql_regeneration_prompt
from app.services.rag_service import EmbeddingProvider, retrieve_schema_context
from app.schemas.chat import ChatRequest, ChatResponse

# Mock Embedding Provider for offline tests
class MockEmbeddingProvider(EmbeddingProvider):
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def generate_embedding(self, text: str) -> List[float]:
        return [0.1] * self.dimension

    def get_dimension(self) -> int:
        return self.dimension


class TestRAGRetrieval(unittest.TestCase):
    def setUp(self):
        # Patch the embedding provider globally for all test methods
        self.patcher = patch("app.services.rag_service.get_embedding_provider")
        self.mock_get_provider = self.patcher.start()
        
        self.mock_provider = MockEmbeddingProvider(dimension=384)
        self.mock_get_provider.return_value = self.mock_provider

        # Setup standard mock columns matching the generic test scenario
        self.mock_columns = [
            {"name": "Region", "datatype": "object", "unique_count": 4, "unique_values": ["North", "South", "East", "West"]},
            {"name": "Sales", "datatype": "float64", "unique_count": 1000, "missing_count": 0}, # High cardinality
            {"name": "Profit", "datatype": "float64", "unique_count": 950, "missing_count": 5}, # High cardinality
            {"name": "Order_Status", "datatype": "object", "unique_count": 3, "unique_values": ["Pending", "Shipped", "Cancelled"]}
        ]

    def tearDown(self):
        self.patcher.stop()

    # 1. Query embedding generation.
    def test_query_embedding_generation(self):
        # Generates a vector using our mock provider
        from app.services.rag_service import generate_embedding
        vector = generate_embedding("Which region has the highest total sales?")
        self.assertEqual(len(vector), 384)

    # 2. Correct semantic retrieval result formatting.
    @patch("app.services.rag_service.supabase")
    def test_semantic_retrieval_formatting(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = [
            {
                "column_name": "Region",
                "content": "Column: Region\nData type: object\nObserved values: North, South, East, West",
                "similarity": 0.85
            }
        ]
        context = retrieve_schema_context("Which region has the highest sales?", "dataset-a-uuid")
        self.assertIn("RETRIEVED SCHEMA CONTEXT", context)
        self.assertIn("Column: Region (Similarity: 0.85)", context)
        self.assertIn("Observed values: North, South, East, West", context)

    # 3. Results ordered by similarity.
    @patch("app.services.rag_service.supabase")
    def test_retrieval_order(self, mock_supabase):
        # RPC naturally returns items sorted by similarity (we mock this order)
        mock_supabase.rpc.return_value.execute.return_value.data = [
            {"column_name": "Sales", "content": "Column: Sales", "similarity": 0.92},
            {"column_name": "Region", "content": "Column: Region", "similarity": 0.78}
        ]
        context = retrieve_schema_context("Which region has highest sales?", "dataset-a-uuid")
        
        # Verify both are included, and Sales appears before Region
        self.assertIn("Column: Sales", context)
        self.assertIn("Column: Region", context)
        self.assertTrue(context.find("Column: Sales") < context.find("Column: Region"))

    # 4. dataset_id passed to retrieval.
    @patch("app.services.rag_service.supabase")
    def test_dataset_id_passed_to_rpc(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = []
        retrieve_schema_context("Which region has highest sales?", "dataset-a-uuid")
        
        # Verify the RPC parameter received dataset_id
        mock_supabase.rpc.assert_called_once()
        rpc_args = mock_supabase.rpc.call_args[0]
        rpc_kwargs = mock_supabase.rpc.call_args[1]
        
        # Checks if dataset_id resides inside kwargs
        params = rpc_kwargs.get("params") or rpc_args[1]
        self.assertEqual(params["filter_dataset_id"], "dataset-a-uuid")

    # 5. Dataset A cannot retrieve Dataset B (ensured by database filtering).
    @patch("app.services.rag_service.supabase")
    def test_dataset_isolation_enforced(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = []
        
        retrieve_schema_context("Which region has highest sales?", "dataset-a-uuid")
        params_a = mock_supabase.rpc.call_args[1].get("params") or mock_supabase.rpc.call_args[0][1]
        self.assertEqual(params_a["filter_dataset_id"], "dataset-a-uuid")
        
        retrieve_schema_context("Which region has highest sales?", "dataset-b-uuid")
        params_b = mock_supabase.rpc.call_args[1].get("params") or mock_supabase.rpc.call_args[0][1]
        self.assertEqual(params_b["filter_dataset_id"], "dataset-b-uuid")

    # 6. TOP-K is respected.
    @patch("app.services.rag_service.supabase")
    def test_top_k_respected(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = []
        
        retrieve_schema_context("Which region has highest sales?", "dataset-a-uuid", limit=3)
        params = mock_supabase.rpc.call_args[1].get("params") or mock_supabase.rpc.call_args[0][1]
        self.assertEqual(params["match_count"], 3)

    # 7. Similarity threshold is respected.
    @patch("app.services.rag_service.supabase")
    def test_similarity_threshold_respected(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = []
        
        retrieve_schema_context("Which region?", "dataset-a-uuid", similarity_threshold=0.65)
        params = mock_supabase.rpc.call_args[1].get("params") or mock_supabase.rpc.call_args[0][1]
        self.assertEqual(params["match_threshold"], 0.65)

    # 8. Empty retrieval returns empty context safely.
    @patch("app.services.rag_service.supabase")
    def test_empty_retrieval_returns_empty_string(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = []
        context = retrieve_schema_context("Which region?", "dataset-a-uuid")
        self.assertEqual(context, "")

    # 9. Embedding failure falls back safely.
    @patch("app.services.rag_service.generate_embedding")
    def test_embedding_failure_fallback(self, mock_generate):
        mock_generate.side_effect = Exception("API Key Missing")
        context = retrieve_schema_context("Which region?", "dataset-a-uuid")
        self.assertEqual(context, "") # Falls back to empty context string safely

    # 10. Supabase RPC failure falls back safely.
    @patch("app.services.rag_service.supabase")
    def test_supabase_rpc_failure_fallback(self, mock_supabase):
        mock_supabase.rpc.side_effect = Exception("Connection Timeout")
        context = retrieve_schema_context("Which region?", "dataset-a-uuid")
        self.assertEqual(context, "") # Falls back to empty context string safely

    # 11. High-cardinality values remain bounded.
    def test_high_cardinality_metadata_remains_bounded(self):
        # Checked via build_schema_documents during chunk creation (Step 4 tests)
        # Verify that even when building prompts, columns with >50 unique values do not include values lists
        prompt = build_sql_prompt("Show sales", self.mock_columns)
        self.assertNotIn("Observed values: [", prompt)

    # 12. Raw dataset rows are never returned.
    @patch("app.services.rag_service.supabase")
    def test_raw_rows_are_never_returned_in_context(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = [
            {"column_name": "Region", "content": "Column: Region\nData type: object", "similarity": 0.85}
        ]
        context = retrieve_schema_context("Region check?", "dataset-a-uuid")
        self.assertNotIn("RegionValue", context)
        self.assertIn("Column: Region", context)

    # 13. Generic dataset retrieval works.
    @patch("app.services.rag_service.supabase")
    def test_generic_dataset_retrieval(self, mock_supabase):
        mock_supabase.rpc.return_value.execute.return_value.data = [
            {"column_name": "Profit", "content": "Column: Profit\nData type: float64", "similarity": 0.77}
        ]
        context = retrieve_schema_context("Which region has high profits?", "dataset-a-uuid")
        self.assertIn("Column: Profit", context)

    # 14. Prompt builder correctly receives retrieved context.
    def test_prompt_builder_includes_retrieved_context(self):
        schema_context = "\nRETRIEVED SCHEMA CONTEXT\n\nColumn: Region\nColumn: Sales\n"
        prompt = build_sql_prompt(
            question="Which region has highest sales?",
            columns=self.mock_columns,
            schema_context=schema_context
        )
        self.assertIn("RETRIEVED SCHEMA CONTEXT", prompt)
        self.assertIn("Column: Region", prompt)
        self.assertIn("Column: Sales", prompt)

    # 15. Regeneration preserves retrieved context.
    def test_regeneration_prompt_preserves_retrieved_context(self):
        schema_context = "\nRETRIEVED SCHEMA CONTEXT\n\nColumn: Region\n"
        prompt = build_sql_regeneration_prompt(
            question="Which region has highest sales?",
            columns=self.mock_columns,
            previous_sql="SELECT Region, Sales FROM dataset;",
            errors=["no such column: Region"],
            schema_context=schema_context
        )
        self.assertIn("RETRIEVED SCHEMA CONTEXT", prompt)
        self.assertIn("Column: Region", prompt)
        self.assertIn("PREVIOUS ATTEMPT AND VALIDATION ERRORS", prompt)

    # 16. Retrieval failure does not break the existing chat flow (Chat route fallback).
    @patch("app.api.chat.retrieve_schema_context")
    @patch("app.api.chat.generate_sql")
    @patch("app.api.chat.validate_sql")
    @patch("app.api.chat.execute_query")
    @patch("app.api.chat.generate_analytics_and_chart")
    @patch("app.api.chat.get_dataset")
    def test_chat_retrieval_failure_fallback(
        self, mock_get_dataset, mock_gen_analytics, mock_exec_query, mock_val_sql, mock_gen_sql, mock_retrieve
    ):
        # Force retrieve_schema_context to fail / return empty
        mock_retrieve.return_value = ""
        mock_get_dataset.return_value = {"column_info": self.mock_columns, "path": "mock.db"}
        mock_gen_sql.return_value = "SELECT * FROM dataset;"
        mock_val_sql.return_value = {"valid": True, "errors": []}
        mock_exec_query.return_value = [{"col": "val"}]
        mock_gen_analytics.return_value = {"explanation": "Ok", "chart_type": "none"}

        # Simulate route POST request
        request = ChatRequest(dataset_id="dataset-a-uuid", question="Which region?")
        from app.api.chat import chat
        import asyncio
        response = asyncio.run(chat(request))

        # Assert generation and validation were called successfully despite retrieval empty result
        mock_retrieve.assert_called_once_with(question="Which region?", dataset_id="dataset-a-uuid")
        mock_gen_sql.assert_called_once_with(question="Which region?", columns=self.mock_columns, schema_context="")
        self.assertEqual(response.sql, "SELECT * FROM dataset;")

if __name__ == "__main__":
    unittest.main()
