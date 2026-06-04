import { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { searchLibrary } from "@/lib/supabase-db";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  const { songs, count } = await searchLibrary(query);

  return ok({ songs, count });
}
