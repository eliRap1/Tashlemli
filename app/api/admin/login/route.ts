import { NextResponse } from "next/server";
import { z } from "zod";
import { setAdminCookie } from "@/lib/auth/admin";
import { hasValidAdminPassword } from "@/lib/auth/admin-credentials";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

const Body = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  if (!hasValidAdminPassword(parsed.data.password)) {
    return NextResponse.json({ error: "bad" }, { status: 401 });
  }
  try {
    await setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: e.code }, { status: e.httpStatus });
    throw e;
  }
}
