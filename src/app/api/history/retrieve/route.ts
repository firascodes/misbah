import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// The request object is not used in this GET handler, so it's omitted.
export async function GET() {
  const supabase = createClient(await cookies());

  // Get the current user (verified with the Auth server, unlike getSession())
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // Only logged-in users have history
    return NextResponse.json({ error: 'User not logged in' }, { status: 401 });
  }

  const userId = user.id;

  // Retrieve search history for the user, ordered by most recent first
  const { data: history, error: retrieveError } = await supabase
    .from('search_history')
    .select('id, query_text, timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(50); // Limit the number of history items retrieved

  if (retrieveError) {
    console.error('Error retrieving search history:', retrieveError);
    return NextResponse.json({ error: 'Failed to retrieve search history' }, { status: 500 });
  }

  return NextResponse.json(history || [], { status: 200 });
}
