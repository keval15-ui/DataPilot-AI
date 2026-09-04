import os
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, List

from app.database.supabase import supabase
from app.rag.schema_builder import build_schema_documents

# Global variable to cache the local transformer model instance
_local_transformer_model = None

# ==========================================
# Embedding Provider Abstraction
# ==========================================

class EmbeddingProvider(ABC):
    @abstractmethod
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for a string of text.
        """
        pass

    @abstractmethod
    def get_dimension(self) -> int:
        """
        Return the expected dimension of the generated vector.
        """
        pass


# 1. Local SentenceTransformer Embedding Provider (Deterministic, offline, semantic)
class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2", dimension: int = 384):
        self.model_name = model_name
        self.dimension = dimension

    def generate_embedding(self, text: str) -> List[float]:
        global _local_transformer_model
        if _local_transformer_model is None:
            # Lazy import inside the call to prevent heavy load during server bootstrap
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError:
                raise ImportError(
                    "The 'sentence-transformers' package is required to use local embeddings. "
                    "Please install it using 'pip install sentence-transformers'."
                )
            # Load and cache the model globally
            _local_transformer_model = SentenceTransformer(self.model_name)
            
        try:
            # Generate local semantic embedding
            vector = _local_transformer_model.encode(text).tolist()
            if len(vector) != self.dimension:
                raise ValueError(
                    f"Local embedding dimension mismatch: expected {self.dimension}, got {len(vector)}"
                )
            return [float(x) for x in vector]
        except Exception as e:
            raise RuntimeError(f"Local sentence-transformers embedding generation failed: {e}")

    def get_dimension(self) -> int:
        return self.dimension


# 2. Gemini Embedding Provider (Hosted, free/rate-limited)
class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str = "models/text-embedding-004", dimension: int = 768):
        self.model_name = model_name
        self.dimension = dimension
        
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is missing.")
        genai.configure(api_key=api_key)

    def generate_embedding(self, text: str) -> List[float]:
        import google.generativeai as genai
        try:
            response = genai.embed_content(
                model=self.model_name,
                content=text,
                task_type="retrieval_document"
            )
            vector = response["embedding"]
            if len(vector) != self.dimension:
                raise ValueError(f"Gemini embedding dimension mismatch: expected {self.dimension}, got {len(vector)}")
            return [float(x) for x in vector]
        except Exception as e:
            raise RuntimeError(f"Gemini embedding generation failed: {e}")

    def get_dimension(self) -> int:
        return self.dimension


# 3. OpenAI Embedding Provider (Hosted, paid)
class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str = "text-embedding-3-small", dimension: int = 1536):
        self.model_name = model_name
        self.dimension = dimension
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is missing.")

    def generate_embedding(self, text: str) -> List[float]:
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError("The 'openai' package is required to use OpenAI embeddings. Install it via pip.")
            
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            client = OpenAI(api_key=api_key)
            response = client.embeddings.create(
                input=[text],
                model=self.model_name
            )
            vector = response.data[0].embedding
            if len(vector) != self.dimension:
                raise ValueError(f"OpenAI embedding dimension mismatch: expected {self.dimension}, got {len(vector)}")
            return [float(x) for x in vector]
        except Exception as e:
            raise RuntimeError(f"OpenAI embedding generation failed: {e}")

    def get_dimension(self) -> int:
        return self.dimension


# ==========================================
# Factory Method
# ==========================================

def get_embedding_provider() -> EmbeddingProvider:
    """
    Constructs and returns the configured EmbeddingProvider based on environment variables.
    """
    provider_name = os.getenv("EMBEDDING_PROVIDER", "local").lower()
    
    if provider_name == "openai":
        model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        dim = int(os.getenv("EMBEDDING_DIMENSION", "1536"))
        return OpenAIEmbeddingProvider(model_name=model, dimension=dim)
        
    elif provider_name == "gemini":
        model = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
        dim = int(os.getenv("EMBEDDING_DIMENSION", "768"))
        return GeminiEmbeddingProvider(model_name=model, dimension=dim)
        
    else:
        # Default to local mock provider
        model = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        dim = int(os.getenv("EMBEDDING_DIMENSION", "384"))
        return LocalEmbeddingProvider(model_name=model, dimension=dim)


# ==========================================
# Public Service Endpoints
# ==========================================

def generate_embedding(text: str) -> List[float]:
    """
    Generates embedding vector utilizing the configured provider.
    """
    provider = get_embedding_provider()
    return provider.generate_embedding(text)


def index_dataset_schema(dataset: Dict[str, Any]) -> None:
    """
    Converts dataset metadata into schema documents, calculates vector embeddings,
    and inserts records idempotently into the schema_embeddings database table.
    """
    # 1. Validate dataset payload structure
    dataset_id = dataset.get("dataset_id")
    if not dataset_id:
        raise ValueError("Cannot index dataset: missing 'dataset_id' in metadata.")
        
    column_info = dataset.get("column_info")
    if not column_info:
        raise ValueError("Cannot index dataset: missing or empty 'column_info' in metadata.")

    # 2. Build schema documents using schema_builder
    try:
        documents = build_schema_documents(dataset)
    except Exception as e:
        raise ValueError(f"Failed to compile schema documents: {e}")

    # 3. Clean existing embeddings for the dataset_id (idempotency rule)
    try:
        delete_dataset_schema_embeddings(dataset_id)
    except Exception as e:
        raise RuntimeError(f"Database error during clearing existing schema embeddings: {e}")

    # 4. Generate embeddings and prepare inserts
    provider = get_embedding_provider()
    expected_dim = provider.get_dimension()
    rows = []

    for doc in documents:
        content = doc.get("content", "")
        metadata = doc.get("metadata", {})
        col_name = metadata.get("column", "unknown")
        
        # Security: ensure no credentials leak into metadata
        for secret_key in ["key", "token", "secret", "password"]:
            metadata = {k: v for k, v in metadata.items() if secret_key not in k.lower()}

        vector = provider.generate_embedding(content)
        
        # Verify dimension constraint before DB insert
        if len(vector) != expected_dim:
            raise ValueError(
                f"Generated embedding dimension {len(vector)} does not match provider dimension {expected_dim}."
            )
            
        rows.append({
            "dataset_id": dataset_id,
            "column_name": col_name,
            "content": content,
            "embedding": vector,
            "metadata": metadata
        })

    # 5. Insert records into Supabase pgvector
    if rows:
        try:
            supabase.table("schema_embeddings").insert(rows).execute()
        except Exception as e:
            raise RuntimeError(f"Supabase error during inserting schema embeddings: {e}")


def delete_dataset_schema_embeddings(dataset_id: str) -> None:
    """
    Removes all schema embeddings associated with the given dataset_id.
    """
    if not dataset_id:
        raise ValueError("dataset_id is required for deletion.")
        
    try:
        supabase.table("schema_embeddings").delete().eq("dataset_id", dataset_id).execute()
    except Exception as e:
        raise RuntimeError(f"Failed to delete dataset schema embeddings from Supabase: {e}")


def retrieve_schema_context(
    question: str,
    dataset_id: str,
    limit: int | None = None,
    similarity_threshold: float | None = None,
) -> str:
    """
    Retrieves semantically relevant schema information for the user's question,
    filtered strictly by dataset_id, and formats it as a prompt-safe context block.
    """
    if not question:
        raise ValueError("question is required for retrieval.")
    if not dataset_id:
        raise ValueError("dataset_id is required for retrieval.")

    # 1. Load config defaults or env values
    if limit is None:
        try:
            limit = int(os.getenv("RAG_TOP_K", "5"))
        except Exception:
            limit = 5

    if similarity_threshold is None:
        try:
            similarity_threshold = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.50"))
        except Exception:
            similarity_threshold = 0.50

    try:
        # 2. Generate embedding for query question
        query_vector = generate_embedding(question)

        # 3. Query Supabase RPC
        res = supabase.rpc(
            "match_schema_embeddings",
            {
                "query_embedding": query_vector,
                "match_threshold": similarity_threshold,
                "match_count": limit,
                "filter_dataset_id": dataset_id,
            },
        ).execute()

        results = res.data or []

        if not results:
            return ""

        # 4. Format into prompt-safe context block
        context_parts = []
        for r in results:
            col_name = r.get("column_name", "unknown")
            content = r.get("content", "")
            sim = r.get("similarity", 0.0)

            # Neatly format each column's context block
            context_parts.append(
                f"Column: {col_name} (Similarity: {sim:.2f})\n{content}"
            )

        # Join with separator
        formatted_context = "\n\n".join(context_parts).strip()
        
        # Format the final block
        if formatted_context:
            return f"\nRETRIEVED SCHEMA CONTEXT\n\n{formatted_context}\n"
        return ""

    except Exception as e:
        # Fail-safe: log server-side diagnostic error and return empty context
        print(f"[RAG ERROR] Semantic retrieval failed: {e}")
        return ""
