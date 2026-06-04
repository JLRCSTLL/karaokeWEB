import { NextRequest } from "next/server";
import { error, ok, readJson } from "@/lib/http";
import { advanceQueue } from "@/lib/queue";
import { rateLimit } from "@/lib/rate-limit";
import { sessionEndSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!rateLimit(request, "queue-next", 30, 60_000)) {
    return error("Too many playback updates. Please wait a moment.", 429);
  }

  const parsed = sessionEndSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid session payload.", 422);

  const snapshot = await advanceQueue(parsed.data.sessionCode, "completed");
  if (!snapshot) return error("Session not found.", 404);

  return ok({ snapshot });
}
