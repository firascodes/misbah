-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create hadiths table
CREATE TABLE IF NOT EXISTS hadiths (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hadith_id TEXT NOT NULL,
  source TEXT NOT NULL,
  chapter_no INTEGER,
  hadith_no INTEGER,
  chapter TEXT,
  chain_indx TEXT,
  text_ar TEXT NOT NULL,
  text_en TEXT NOT NULL,
  embedding VECTOR(1536)
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search on hadiths embeddings
-- Using ivfflat with cosine distance, suitable for <=> operator
-- The number of lists (100 here) might need tuning based on table size for optimal performance.
-- Common recommendations are sqrt(N) or N/1000 where N is the number of rows.
CREATE INDEX IF NOT EXISTS hadiths_embedding_idx
ON hadiths
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
