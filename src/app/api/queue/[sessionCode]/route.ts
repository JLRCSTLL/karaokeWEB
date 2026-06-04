import { error, ok } from "@/lib/http";
import { getQueueSnapshot } from "@/lib/queue";

type Context = { params: Promise<{ sessionCode: string }> };

export async function GET(_request: Request, context: Context) {
  const { sessionCode } = await context.params;
  const snapshot = await getQueueSnapshot(sessionCode);

  if (!snapshot) return error("Session not found.", 404);

  return ok(snapshot);
}
