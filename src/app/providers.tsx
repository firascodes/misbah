"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types"; // Ensure this path is correct
import { HistoryPaneProvider } from "@/context/HistoryPaneContext"; // Import the new provider
import { ThemeProvider } from "@/components/ui/theme-provider"; // Existing ThemeProvider

interface SupabaseContextType {
  supabase: SupabaseClient<Database>;
  session: Session | null;
}

export const SupabaseContext = createContext<SupabaseContextType>({
  supabase: createClientComponentClient<Database>(), // Default client
  session: null,
});

export default function Providers({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient<Database>());
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session); // Update session state on auth change
    });

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
       <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          {/* Wrap with HistoryPaneProvider */}
          <HistoryPaneProvider>
            {children}
          </HistoryPaneProvider>
      </ThemeProvider>
    </SupabaseContext.Provider>
  );
}
