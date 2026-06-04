import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { advanceQueue } from "@/lib/queue";
import { addHistory, updateQueueItemStatus } from "@/lib/supabase-db";
import { queueItemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const body = await readJson(request);
  if (body.sessionCode) {
    const snapshot = await advanceQueue(body.sessionCode, "skipped");
    return ok({ snapshot });
  }

  const parsed = queueItemSchema.safeParse(body);
  if (!parsed.success) return error("Invalid queue item payload.", 422);

  const queueItem = await updateQueueItemStatus(parsed.data.queueItemId, "skipped");

  await addHistory({
    sessionId: queueItem.sessionId,
    songId: queueItem.songId,
    requesterName: queueItem.requesterName,
    action: "skipped",
  });

  return ok({ queueItem });
}
