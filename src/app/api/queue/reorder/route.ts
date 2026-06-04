import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { normalizeQueuePositions } from "@/lib/queue";
import { getSessionByCode, reorderQueueItems } from "@/lib/supabase-db";
import { reorderSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const parsed = reorderSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid reorder payload.", 422);

  const session = await getSessionByCode(parsed.data.sessionCode);
  if (!session) return error("Session not found.", 404);

  await reorderQueueItems(parsed.data.queueItemIds);
  await normalizeQueuePositions(session.id);

  return ok({ reordered: true });
}
