import QRCode from "qrcode";
import { getAppUrl } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionCode = url.searchParams.get("sessionCode") || "";
  const target = `${getAppUrl()}/session/${encodeURIComponent(sessionCode)}`;
  const svg = await QRCode.toString(target, { type: "svg", margin: 1, width: 320 });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
