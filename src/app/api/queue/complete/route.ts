import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { advanceQueue } from "@/lib/queue";
import { sessionEndSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const parsed = sessionEndSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid session payload.", 422);

  const snapshot = await advanceQueue(parsed.data.sessionCode, "completed");
  return ok({ snapshot });
}
