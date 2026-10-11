import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidAdminCookie } from "@/lib/auth/admin-credentials";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin") && pathname !== "/api/admin/login";

  if (isAdminPage || isAdminApi) {
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!hasValidAdminCookie(cookie)) {
      if (isAdminApi) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
