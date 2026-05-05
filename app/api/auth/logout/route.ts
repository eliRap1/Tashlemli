import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, revokeSession } from "@/services/auth/session";
import { verifySession } from "@/lib/jwt/session-token";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const v = jar.get(COOKIE_NAME)?.value;
  if (v) {
    try { const { sid } = await verifySession(v); await revokeSession(sid); } catch {}
  }
  jar.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
