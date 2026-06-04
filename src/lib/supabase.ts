import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin?: SupabaseClient<any>;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getSupabaseAdmin() {
  if (!globalForSupabase.supabaseAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalForSupabase.supabaseAdmin = createClient<any>(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
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
