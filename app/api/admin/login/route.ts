import { NextResponse } from "next/server";
import { z } from "zod";
import { setAdminCookie } from "@/lib/auth/admin";
import { hasValidAdminPassword } from "@/lib/auth/admin-credentials";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp } from "@/lib/hash";

export const runtime = "nodejs";

const Body = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipHash = await hashIp(ip);
  const rl = await rateLimit(`login:${ipHash}`, 5, 15 * 60);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

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
