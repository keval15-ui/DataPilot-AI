-- 1. Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the schema_embeddings table
CREATE TABLE IF NOT EXISTS schema_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(dataset_id) ON DELETE CASCADE,
    column_name TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384), -- Matches the 384-dimension local embedding provider
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add index on dataset_id for rapid tenant-specific filtering
CREATE INDEX IF NOT EXISTS idx_schema_embeddings_dataset_id ON schema_embeddings(dataset_id);

-- 4. Add HNSW cosine similarity index for pgvector search
-- Using Cosine distance (vector_cosine_ops) matching 1 - cosine_similarity retrieval logic
CREATE INDEX IF NOT EXISTS idx_schema_embeddings_vector ON schema_embeddings USING hnsw (embedding vector_cosine_ops);
