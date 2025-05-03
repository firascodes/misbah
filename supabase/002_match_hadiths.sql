-- Create search function for vector similarity
CREATE OR REPLACE FUNCTION match_hadiths(
  _query vector(1536),
  _limit int,
  _offset int DEFAULT 0 -- Add offset parameter with default value
)
RETURNS TABLE (
  id bigint,
  hadith_id text,
  source text,
  chapter_no integer,
  hadith_no integer,
  chapter text,
  chain_indx text,
  text_ar text,
  text_en text,
  embedding vector(1536)
) AS $$
  SELECT id, hadith_id, source, chapter_no, hadith_no, chapter, chain_indx, text_ar, text_en, embedding
  FROM hadiths
  ORDER BY embedding <=> _query
  LIMIT _limit
  OFFSET _offset; -- Add OFFSET clause
$$ LANGUAGE SQL STABLE;
