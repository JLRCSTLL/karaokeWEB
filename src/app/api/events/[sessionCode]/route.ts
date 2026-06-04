import { getQueueSnapshot } from "@/lib/queue";

type Context = { params: Promise<{ sessionCode: string }> };

export async function GET(_request: Request, context: Context) {
  const { sessionCode } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      async function send() {
        if (closed) return;
        const snapshot = await getQueueSnapshot(sessionCode);
        controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`));
      }

      await send();
      const interval = setInterval(send, 2500);

      setTimeout(() => {
        closed = true;
        clearInterval(interval);
        controller.close();
      }, 60_000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
