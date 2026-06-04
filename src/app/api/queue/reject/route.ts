import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { addHistory, updateQueueItemStatus } from "@/lib/supabase-db";
import { queueItemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const parsed = queueItemSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid queue item payload.", 422);

  const queueItem = await updateQueueItemStatus(parsed.data.queueItemId, "rejected");

  await addHistory({
    sessionId: queueItem.sessionId,
    songId: queueItem.songId,
    requesterName: queueItem.requesterName,
    action: "rejected",
  });

  return ok({ queueItem });
}
