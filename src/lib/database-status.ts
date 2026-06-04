export type DatabaseIssue = {
  title: string;
  message: string;
  commands: string[];
};

type PrismaLikeError = {
  code?: string;
  message?: string;
};

export function getDatabaseIssue(error: unknown): DatabaseIssue | null {
  const prismaError = error as PrismaLikeError;
  const message = prismaError?.message || "";

  if (
    message.includes("NEXT_PUBLIC_SUPABASE_URL is not configured") ||
    message.includes("SUPABASE_SERVICE_ROLE_KEY is not configured")
  ) {
    return {
      title: "Supabase is not configured",
      message:
        "The backend now uses Supabase directly. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.",
      commands: ["npm run supabase:check", "npm run dev"],
    };
  }

  if (
    prismaError?.code === "ECONNREFUSED" ||
    prismaError?.code === "ENOTFOUND" ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("getaddrinfo")
  ) {
    return {
      title: "Database is not connected",
      message:
        "Prisma cannot reach DATABASE_URL yet. For Supabase, paste the Supavisor Session pooler connection string into .env, then run migrations.",
      commands: ["npm run db:migrate", "npm run db:seed"],
    };
  }

  if (prismaError?.code === "P1001") {
    return {
      title: "Database is unreachable",
      message:
        "Prisma could not reach the database in DATABASE_URL. Check your Supabase pooler host, password, and network access.",
      commands: ["npm run db:migrate"],
    };
  }

  if (prismaError?.code === "P2021" || message.includes("does not exist")) {
    return {
      title: "Database tables are missing",
      message: "PostgreSQL is reachable, but the Prisma schema has not been migrated yet.",
      commands: ["npm run db:migrate", "npm run db:seed"],
    };
  }

  return null;
}
