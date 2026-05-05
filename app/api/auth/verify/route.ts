import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/services/auth/magic-link";
import { createSession, COOKIE_NAME } from "@/services/auth/session";
import { hashIp } from "@/lib/hash";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";

  try {
    const { userId } = await consumeMagicLink({ token, ipHash: await hashIp(ip) });
    const { jwt } = await createSession(userId, await hashIp(ip), req.headers.get("user-agent"));
    const res = NextResponse.redirect(new URL("/me", url.origin));
    res.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/auth/verify?err=1", url.origin));
  }
}
