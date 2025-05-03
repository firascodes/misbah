import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../../../lib/supabaseClient';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const RESULTS_PER_PAGE = 5;

export async function POST(request: Request) {
  const { query, page = 1 } = await request.json(); // Get page, default to 1

  if (typeof query !== 'string' || query.trim() === '') {
    return NextResponse.json({ error: 'Query parameter is required and must be a non-empty string.' }, { status: 400 });
  }
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: 'Page parameter must be a positive integer.' }, { status: 400 });
  }

  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query.trim(), // Trim query
  });
  const vector = embeddingRes.data[0].embedding;

  const offset = (page - 1) * RESULTS_PER_PAGE; // Calculate offset

  // Call the updated RPC function with limit and offset
  const { data, error } = await supabase.rpc('match_hadiths', {
    _query: vector,
    _limit: RESULTS_PER_PAGE, // Use fixed limit
    _offset: offset // Pass calculated offset
  });

  if (error) {
    console.error('Supabase RPC error:', error); // Log the error for debugging
    return NextResponse.json({ error: 'Failed to fetch search results.' }, { status: 500 });
  }

  // Optionally, fetch total count for pagination info (can add later if needed)
  // const { count, error: countError } = await supabase
  //   .from('hadiths')
  //   .select('*', { count: 'exact', head: true })
  //   // Add a filter here if you want the count to be based on the search query,
  //   // which is more complex with vector similarity search.
  //   // For now, this gets the total count of all hadiths.

  // if (countError) {
  //   console.error('Supabase count error:', countError);
  //   // Decide how to handle count error, maybe return results without pagination info
  // }

  // Return data (and potentially pagination info like totalPages)
  return NextResponse.json(data);
}
