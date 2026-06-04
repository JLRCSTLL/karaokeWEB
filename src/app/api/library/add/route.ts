import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { saveSong } from "@/lib/supabase-db";
import { libraryAddSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = await readJson(request);
  const parsed = libraryAddSchema.safeParse(payload);
  if (!parsed.success) return error("Invalid song payload.", 422);

  const addedBy = parsed.data.addedBy || ((await isAdminAuthenticated()) ? "admin" : "guest");
  const song = await saveSong({ ...parsed.data, addedBy });

  return ok({ song });
}
