import { error, ok, readJson } from "@/lib/http";
import { getSessionByCode, upsertPlaybackState } from "@/lib/supabase-db";
import { playbackUpdateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = playbackUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid playback payload.", 422);

  const session = await getSessionByCode(parsed.data.sessionCode);
  if (!session) return error("Session not found.", 404);

  const playbackState = await upsertPlaybackState(
    session.id,
    parsed.data.currentQueueItemId || null,
    parsed.data.playerState,
  );

  return ok({ playbackState });
}
