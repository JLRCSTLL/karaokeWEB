import { isAdminAuthenticated } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { updateSessionSettings } from "@/lib/supabase-db";
import { sessionSettingsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return error("Admin authentication required.", 401);

  const parsed = sessionSettingsSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid settings payload.", 422);

  const { sessionCode, ...settings } = parsed.data;
  const session = await updateSessionSettings(sessionCode, settings);

  return ok({ session });
}
