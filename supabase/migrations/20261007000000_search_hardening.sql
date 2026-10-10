-- Search hardening:
--   1. match_hadiths returns a similarity score instead of the raw embedding, and can drop weak matches
--   2. least-privilege grants on public tables
--   3. RLS policies scoped to signed-in users, with auth.uid() evaluated once per query
--   4. rate limiting for the paid embedding call in /api/search

-- 1. Search function ---------------------------------------------------------

drop function if exists public.match_hadiths(extensions.vector, integer, integer);

create function public.match_hadiths(
  _query extensions.vector(1536),
  _limit int,
  _offset int default 0,
  _min_similarity float default 0
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
  similarity float
)
-- No "set search_path" on purpose: a SET clause stops Postgres from inlining this SQL function,
-- and the non-inlined plan skips the HNSW index (full scan -> statement timeout).
-- Every name below is schema-qualified, so the caller's search_path can't change what it resolves to.
language sql stable
as $$
  select id, hadith_id, trim(source), chapter_no, hadith_no, chapter, chain_indx, text_ar, text_en,
         1 - distance as similarity
  from (
    -- Nearest neighbours first (uses the HNSW index), then drop weak matches
    select h.*, h.embedding operator(extensions.<=>) _query as distance
    from public.hadiths h
    order by h.embedding operator(extensions.<=>) _query
    limit _limit
    offset _offset
  ) nearest
  where 1 - distance >= _min_similarity
  order by distance;
$$;

grant execute on function public.match_hadiths(extensions.vector, integer, integer, float) to anon, authenticated;

-- 2. Grants ------------------------------------------------------------------
-- Supabase grants ALL on new public tables to anon/authenticated by default; RLS was the
-- only thing stopping writes. Keep RLS, but also grant only what the app uses.

revoke all on public.hadiths from anon, authenticated;
grant select on public.hadiths to anon, authenticated;

revoke all on public.search_history from anon, authenticated;
grant select, insert on public.search_history to authenticated;

-- 3. RLS policies ------------------------------------------------------------

drop policy "Select own history" on public.search_history;
drop policy "Insert own history" on public.search_history;

create policy "Select own history" on public.search_history
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Insert own history" on public.search_history
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- History is always read per user, newest first
create index if not exists search_history_user_id_timestamp_idx
  on public.search_history (user_id, "timestamp" desc);

-- 4. Rate limiting -----------------------------------------------------------
-- Fixed-window counters. The table lives in a schema the Data API doesn't expose,
-- and only the server (secret key / service_role) may call the function.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (key, window_start)
);

create function public.consume_rate_limit(_key text, _max_hits int, _window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  _window timestamptz := to_timestamp(floor(extract(epoch from now()) / _window_seconds) * _window_seconds);
  _hits int;
begin
  insert into private.rate_limits as r (key, window_start)
  values (_key, _window)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into _hits;

  -- Occasionally prune expired windows so the table stays small
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '2 days';
  end if;

  return _hits <= _max_hits;
end;
$$;

revoke execute on function public.consume_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, int, int) to service_role;
