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

function requiredSupabaseKey() {
  const value =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!value) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.",
    );
  }

  return value;
}

export function getSupabaseAdmin() {
  if (!globalForSupabase.supabaseAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalForSupabase.supabaseAdmin = createClient<any>(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredSupabaseKey(),
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
