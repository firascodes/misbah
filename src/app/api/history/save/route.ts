import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database.types'; // Assuming you have types generated

export async function POST(request: Request) {
  const { queryText } = await request.json();

  if (!queryText || typeof queryText !== 'string') {
    return NextResponse.json({ error: 'Query text is required' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  // Get the current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error getting session:', sessionError);
    return NextResponse.json({ error: 'Failed to get user session' }, { status: 500 });
  }

  if (!session) {
    // Only logged-in users can save history, but don't treat it as an error if not logged in.
    // The frontend should ideally prevent calling this if not logged in.
    return NextResponse.json({ message: 'User not logged in, history not saved' }, { status: 200 });
  }

  const userId = session.user.id;

  // Check for the most recent history entry for this user
  const { data: recentHistory, error: recentHistoryError } = await supabase
    .from('search_history')
    .select('query_text')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle to handle cases where there's no history yet

  if (recentHistoryError) {
    console.error('Error checking recent history:', recentHistoryError);
    // Decide if this should be a hard error or if we should proceed
    // For now, let's proceed but log the error
  }

  // If the most recent entry exists and has the same query text, don't save a duplicate
  if (recentHistory && recentHistory.query_text === queryText) {
    return NextResponse.json({ message: 'Duplicate search query, not saved' }, { status: 200 });
  }

  // Insert the new search history record
  const { error: insertError } = await supabase
    .from('search_history')
    .insert({ user_id: userId, query_text: queryText });

  if (insertError) {
    console.error('Error saving search history:', insertError);
    return NextResponse.json({ error: 'Failed to save search history' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Search history saved successfully' }, { status: 201 });
}
