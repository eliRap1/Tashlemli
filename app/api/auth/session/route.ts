import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, getCurrentUser } from "@/services/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  const user = await getCurrentUser(c);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, email: user.email, fullName: user.fullName, privacyMode: user.privacyMode } });
}
