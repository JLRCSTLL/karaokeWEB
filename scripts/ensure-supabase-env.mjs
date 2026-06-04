import "dotenv/config";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length) {
  console.error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  console.error("Add them to .env from Supabase Project Settings > API.");
  process.exit(1);
}
