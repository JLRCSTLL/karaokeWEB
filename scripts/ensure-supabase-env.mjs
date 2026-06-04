import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const required = ["NEXT_PUBLIC_SUPABASE_URL"];
const missing = required.filter((key) => !process.env[key]?.trim());
const hasSupabaseKey = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
);

if (missing.length || !hasSupabaseKey) {
  const missingKeys = [...missing];
  if (!hasSupabaseKey) {
    missingKeys.push("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  console.error(`Missing Supabase environment variables: ${missingKeys.join(", ")}`);
  console.error("Add them to .env from Supabase Project Settings > API.");
  process.exit(1);
}
