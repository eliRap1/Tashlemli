import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";
import { ADMIN_COOKIE, getAdminCookieSecret, hasValidAdminCookie, hasValidAdminPassword } from "./admin-credentials";

export async function isAdmin(req: Request): Promise<boolean> {
  if (hasValidAdminPassword(req.headers.get("x-ops-password"))) return true;
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  return hasValidAdminCookie(v);
}

export async function setAdminCookie() {
  const secret = getAdminCookieSecret();
  if (!secret) throw new AppError("OPS_COOKIE_NOT_CONFIGURED", "admin cookie secret is not configured", 503);
  (await cookies()).set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}
