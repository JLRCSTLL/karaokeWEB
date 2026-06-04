import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { error } from "@/lib/http";
import { getHistory, getSessionByCode } from "@/lib/supabase-db";

function csv(value: string | null | undefined) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const sessionCode = request.nextUrl.searchParams.get("sessionCode") || "";
  const session = await getSessionByCode(sessionCode);
  if (!session) return error("Session not found.", 404);

  const history = await getHistory(session.id);

  const rows = [
    ["timestamp", "action", "song", "artist", "requester"].map(csv).join(","),
    ...history.map((item) =>
      [
        item.timestamp,
        item.action,
        Array.isArray(item.song) ? item.song[0]?.title : item.song?.title,
        Array.isArray(item.song)
          ? item.song[0]?.artist || item.song[0]?.channelName
          : item.song?.artist || item.song?.channelName,
        item.requesterName,
      ]
        .map(csv)
        .join(","),
    ),
  ];

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${session.sessionCode}-queue-history.csv"`,
    },
  });
}
