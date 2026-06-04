import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const adminCookieName = "karaoke_admin";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

export async function proxy(request: NextRequest) {
  const supabaseResponse = await updateSession(request);
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const hasCookie = Boolean(request.cookies.get(adminCookieName)?.value);

  if (isAdminPath && !hasCookie && !isLogin) {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    copyCookies(supabaseResponse, response);
    return response;
  }

  if (isAdminPath && hasCookie && isLogin) {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    copyCookies(supabaseResponse, response);
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
