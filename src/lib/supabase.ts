import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase-config";

const globalForSupabase = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin?: SupabaseClient<any>;
};

export function getSupabaseAdmin() {
  if (!globalForSupabase.supabaseAdmin) {
    const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || supabasePublishableKey;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalForSupabase.supabaseAdmin = createClient<any>(
      supabaseUrl,
      supabaseServerKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return globalForSupabase.supabaseAdmin;
}
