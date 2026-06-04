import crypto from "crypto";
import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { createSession } from "@/lib/supabase-db";
import { sessionCreateSchema } from "@/lib/validation";

function sessionCode() {
  return crypto.randomBytes(7).toString("base64url");
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const parsed = sessionCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid session payload.", 422);

  const session = await createSession(parsed.data.name, sessionCode());

  return ok({ session });
}
