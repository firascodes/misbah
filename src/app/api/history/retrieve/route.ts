import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// TODO: Ensure '@/lib/database.types' is generated correctly via `npx supabase gen types typescript --project-id <your-project-id> --schema public > lib/database.types.ts`
import { Database } from '@/lib/database.types';

// The request object is not used in this GET handler, so it's omitted.
export async function GET() {
  // The Database type parameter ensures type safety with Supabase client calls
  // Pass the cookies function directly as required by the helper in Route Handlers.
  const supabase = createRouteHandlerClient<Database>({ cookies });

  // Get the current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Error getting session:', sessionError);
    return NextResponse.json({ error: 'Failed to get user session' }, { status: 500 });
  }

  if (!session) {
    // Only logged-in users have history
    return NextResponse.json({ error: 'User not logged in' }, { status: 401 });
  }

  const userId = session.user.id;

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
