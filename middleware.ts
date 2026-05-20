import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidAdminCookie } from "@/lib/auth/admin-credentials";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!hasValidAdminCookie(cookie)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
