import crypto from "crypto";
import { cookies } from "next/headers";

const cookieName = "karaoke_admin";
const maxAge = 60 * 60 * 12;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "dev-karaoke-secret";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createAdminToken(username: string) {
  const payload = Buffer.from(
    JSON.stringify({ username, expiresAt: Date.now() + maxAge * 1000 }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string) {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      expiresAt?: number;
    };

    return Boolean(parsed.expiresAt && parsed.expiresAt > Date.now());
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  return verifyAdminToken((await cookies()).get(cookieName)?.value);
}

export async function setAdminCookie(token: string) {
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(cookieName);
}

export function getAdminCookieName() {
  return cookieName;
}
