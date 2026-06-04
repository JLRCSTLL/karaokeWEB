import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { addHistory, clearQueuedItems, getSessionByCode } from "@/lib/supabase-db";
import { sessionEndSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const parsed = sessionEndSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid session payload.", 422);

  const session = await getSessionByCode(parsed.data.sessionCode);
  if (!session) return error("Session not found.", 404);

  await clearQueuedItems(session.id);

  await addHistory({ sessionId: session.id, action: "queue_cleared" });

  return ok({ cleared: true });
}
