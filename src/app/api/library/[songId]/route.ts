import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { deleteSong, updateSong } from "@/lib/supabase-db";
import { libraryUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ songId: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const { songId } = await context.params;
  const parsed = libraryUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid song payload.", 422);

  const song = await updateSong(songId, parsed.data);
  return ok({ song });
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const { songId } = await context.params;
  await deleteSong(songId);
  return ok({ deleted: true });
}
