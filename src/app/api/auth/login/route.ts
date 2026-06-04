import { NextRequest } from "next/server";
import { createAdminToken, setAdminCookie } from "@/lib/auth";
import { error, ok, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return error("Invalid login payload.", 422);

  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "change-this-password";

  if (parsed.data.username !== expectedUsername || parsed.data.password !== expectedPassword) {
    return error("Invalid admin credentials.", 401);
  }

  await setAdminCookie(createAdminToken(parsed.data.username));
  return ok({ authenticated: true });
}
