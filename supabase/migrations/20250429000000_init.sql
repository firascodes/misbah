-- Baseline schema, matching what ran in production (reconstructed from the 2025-07 backup).

create extension if not exists vector with schema extensions;

create table public.hadiths (
  id bigint generated always as identity primary key,
  hadith_id text not null,
  source text not null,
  chapter_no integer,
  hadith_no integer,
  chapter text,
  chain_indx text,
  text_ar text not null,
  text_en text not null,
  embedding extensions.vector(1536)
);

create table public.search_history (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id),
  query_text text not null,
  "timestamp" timestamptz default now()
);

-- HNSW: approximate nearest-neighbour index for cosine distance (<=>)
create index hadiths_embedding_hnsw_idx
  on public.hadiths
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.hadiths enable row level security;
alter table public.search_history enable row level security;

create policy "Public select on hadiths" on public.hadiths
  for select using (true);

create policy "Select own history" on public.search_history
  for select using (auth.uid() = user_id);

create policy "Insert own history" on public.search_history
  for insert with check (auth.uid() = user_id);

create or replace function public.match_hadiths(
  _query extensions.vector(1536),
  _limit int,
  _offset int default 0
)
returns table (
  id bigint,
  hadith_id text,
  source text,
  chapter_no integer,
  hadith_no integer,
  chapter text,
  chain_indx text,
  text_ar text,
  text_en text,
  embedding extensions.vector(1536)
)
language sql stable
as $$
  select id, hadith_id, source, chapter_no, hadith_no, chapter, chain_indx, text_ar, text_en, embedding
  from public.hadiths
  order by embedding <=> _query
  limit _limit
  offset _offset;
$$;
