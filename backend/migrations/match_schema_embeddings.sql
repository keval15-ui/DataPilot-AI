-- Create the stored procedure for pgvector matching with strict dataset_id filtering
CREATE OR REPLACE FUNCTION match_schema_embeddings(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    filter_dataset_id uuid
)
RETURNS TABLE (
    id uuid,
    column_name text,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        schema_embeddings.id,
        schema_embeddings.column_name,
        schema_embeddings.content,
        schema_embeddings.metadata,
        1 - (schema_embeddings.embedding <=> query_embedding) AS similarity
    FROM schema_embeddings
    WHERE schema_embeddings.dataset_id = filter_dataset_id
      AND 1 - (schema_embeddings.embedding <=> query_embedding) >= match_threshold
    ORDER BY schema_embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
