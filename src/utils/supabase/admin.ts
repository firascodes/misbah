import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Server-only client with the secret key: bypasses RLS, so never import this from client components.
export const createAdminClient = () => {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) return null;

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
