import { NextRequest } from "next/server";
import { error, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { searchYouTube } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  if (!rateLimit(request, "youtube-search", 20, 60_000)) {
    return error("Too many YouTube searches. Please wait a moment.", 429);
  }

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) || "";
  if (query.length < 2) return error("Search query is too short.", 422);

  try {
    const results = await searchYouTube(query);
    return ok({ results });
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : "YouTube search failed.", 500);
  }
}
