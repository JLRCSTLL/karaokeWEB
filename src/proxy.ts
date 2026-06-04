import { NextRequest, NextResponse } from "next/server";

const adminCookieName = "karaoke_admin";

export function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const hasCookie = Boolean(request.cookies.get(adminCookieName)?.value);

  if (!hasCookie && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (hasCookie && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
