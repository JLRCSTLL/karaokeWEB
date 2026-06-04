import { error, ok } from "@/lib/http";
import { getPlaybackBySessionCode } from "@/lib/supabase-db";

type Context = { params: Promise<{ sessionCode: string }> };

export async function GET(_request: Request, context: Context) {
  const { sessionCode } = await context.params;
  const playback = await getPlaybackBySessionCode(sessionCode);

  if (!playback) return error("Session not found.", 404);

  return ok(playback);
}
