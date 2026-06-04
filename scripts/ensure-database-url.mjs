import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL?.trim();
const placeholders = ["", "postgres://prisma.[PROJECT-REF]:[PRISMA-PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"];

if (!databaseUrl || placeholders.includes(databaseUrl)) {
  console.error("DATABASE_URL is not configured.");
  console.error("Paste your Supabase Supavisor Session pooler URL into .env before running database commands.");
  process.exit(1);
}
