import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/auth/admin";

// TODO(audit): This endpoint has no rate limiting. An attacker can attempt
// unlimited password guesses from a single IP. Add rateLimit() from
// @/lib/rate-limit before the password check (same pattern as the
// magic-link request endpoint). Suggested: 10 attempts per 15 min per IP.

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json() as { password: string };
  if (password !== process.env.OPS_PASSWORD) return NextResponse.json({ error: "bad" }, { status: 401 });
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
