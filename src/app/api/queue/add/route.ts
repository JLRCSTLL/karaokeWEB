import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { nextQueuePosition } from "@/lib/queue";
import { rateLimit } from "@/lib/rate-limit";
import {
  addHistory,
  countQueueItems,
  createQueueItem,
  findSongById,
  findSongByYoutubeId,
  getSessionByCode,
} from "@/lib/supabase-db";
import { queueAddSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!rateLimit(request, "queue-add", 12, 60_000)) {
    return error("Too many song requests. Please wait a moment.", 429);
  }

  const parsed = queueAddSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid queue payload.", 422);
  const isAdmin = await isAdminAuthenticated();

  const session = await getSessionByCode(parsed.data.sessionCode);

  if (!session || !session.isActive) return error("Karaoke session is not active.", 404);
  if (!session.guestRequestsEnabled && !isAdmin) return error("Guest requests are currently disabled.", 403);

  const song = parsed.data.songId
    ? await findSongById(parsed.data.songId)
    : await findSongByYoutubeId(parsed.data.youtubeVideoId || "");

  if (!song || song.isBlacklisted) return error("Song is not available.", 404);

  const duplicateCount = await countQueueItems({
    sessionId: session.id,
    songId: song.id,
    statuses: ["pending", "approved", "playing"],
  });

  if (duplicateCount > 0) {
    return error("That song is already in the queue.", 409);
  }

  const requesterActiveCount = await countQueueItems({
    sessionId: session.id,
    requesterName: parsed.data.requesterName,
    statuses: ["pending", "approved"],
  });

  if (!isAdmin && requesterActiveCount >= 3) {
    return error("This singer already has the maximum pending songs.", 429);
  }

  const queueItem = await createQueueItem({
    sessionId: session.id,
    songId: song.id,
    requesterName: parsed.data.requesterName,
    status: session.approvalRequired && !isAdmin ? "pending" : "approved",
    position: await nextQueuePosition(session.id),
  });

  await addHistory({
    sessionId: session.id,
    songId: song.id,
    requesterName: parsed.data.requesterName,
    action: session.approvalRequired && !isAdmin ? "requested_pending" : "requested_approved",
  });

  const queuePosition = await countQueueItems({
    sessionId: session.id,
    statuses: ["pending", "approved"],
    maxPosition: queueItem.position,
  });

  return ok({ queueItem, queuePosition });
}
