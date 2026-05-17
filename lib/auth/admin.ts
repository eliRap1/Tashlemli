import { cookies } from "next/headers";

const COOKIE = "tshl_ops";

export async function isAdmin(req: Request): Promise<boolean> {
  if (req.headers.get("x-ops-password") === process.env.OPS_PASSWORD) return true;
  const v = (await cookies()).get(COOKIE)?.value;
  return Boolean(v) && v === process.env.OPS_COOKIE;
}

export async function setAdminCookie() {
  const cookieValue = process.env.OPS_COOKIE;
  if (!cookieValue) {
    // OPS_COOKIE is required for admin sessions; fail loudly rather than
    // writing the string "undefined" as the cookie value, which would make
    // isAdmin() return true for any unauthenticated request.
    throw new Error("OPS_COOKIE environment variable is not set");
  }
  (await cookies()).set(COOKIE, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}
