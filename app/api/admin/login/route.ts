import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json() as { password: string };
  if (password !== process.env.OPS_PASSWORD) return NextResponse.json({ error: "bad" }, { status: 401 });
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
