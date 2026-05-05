import { cookies } from "next/headers";

const COOKIE = "tshl_ops";

export async function isAdmin(req: Request): Promise<boolean> {
  if (req.headers.get("x-ops-password") === process.env.OPS_PASSWORD) return true;
  const v = (await cookies()).get(COOKIE)?.value;
  return Boolean(v) && v === process.env.OPS_COOKIE;
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, process.env.OPS_COOKIE!, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
}
