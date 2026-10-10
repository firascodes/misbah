import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../../../lib/supabaseClient';
import { createAdminClient } from '@/utils/supabase/admin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const RESULTS_PER_PAGE = 5;
const MAX_QUERY_LENGTH = 300;

// ada-002 similarities are compressed into ~0.67-0.87. Measured on sample queries, on-topic
// searches score >= 0.78 and unrelated text (gibberish, "kubernetes", "sourdough") <= 0.76.
const MIN_SIMILARITY = 0.77;

// Every search costs an OpenAI call, so cap how often one visitor (and everyone combined) can search.
const RATE_LIMITS = [
  { scope: 'ip', maxHits: 10, windowSeconds: 60 },
  { scope: 'ip', maxHits: 100, windowSeconds: 86_400 },
  { scope: 'global', maxHits: 5_000, windowSeconds: 86_400 },
] as const;

function clientKey(request: Request) {
  // On Vercel, x-forwarded-for is set by the platform, so the first entry is the real client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32); // don't store raw IPs
}

async function isRateLimited(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    console.warn('SUPABASE_SECRET_KEY is not set; search rate limiting is disabled.');
    return false;
  }

  const ipKey = clientKey(request);
  for (const { scope, maxHits, windowSeconds } of RATE_LIMITS) {
    const key = scope === 'ip' ? `search:ip:${ipKey}:${windowSeconds}` : `search:global:${windowSeconds}`;
    const { data: allowed, error } = await admin.rpc('consume_rate_limit', {
      _key: key,
      _max_hits: maxHits,
      _window_seconds: windowSeconds,
    });
    if (error) {
      // Fail open: a limiter outage shouldn't take search down with it
      console.error('Rate limit check failed:', error);
      return false;
    }
    if (!allowed) return true;
  }
  return false;
}

export async function POST(request: Request) {
  let body: { query?: unknown; page?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const { query, page = 1 } = body;

  if (typeof query !== 'string' || query.trim() === '') {
    return NextResponse.json({ error: 'Query parameter is required and must be a non-empty string.' }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `Query must be at most ${MAX_QUERY_LENGTH} characters.` }, { status: 400 });
  }
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: 'Page parameter must be a positive integer.' }, { status: 400 });
  }

  if (await isRateLimited(request)) {
    return NextResponse.json(
      { error: "You're searching too quickly. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let vector: number[];
  try {
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query.trim(),
    });
    vector = embeddingRes.data[0].embedding;
  } catch (err) {
    console.error('OpenAI embedding error:', err);
    // Quota, rate-limit and outage errors are on our side, not the user's
    return NextResponse.json(
      { error: 'Search is temporarily unavailable. Please try again in a moment.' },
      { status: 503 }
    );
  }

  const { data, error } = await supabase.rpc('match_hadiths', {
    _query: JSON.stringify(vector),
    _limit: RESULTS_PER_PAGE,
    _offset: (page - 1) * RESULTS_PER_PAGE,
    _min_similarity: MIN_SIMILARITY,
  });

  if (error) {
    console.error('Supabase RPC error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results.' }, { status: 500 });
  }

  return NextResponse.json(data);
}
