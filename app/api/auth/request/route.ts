import { NextResponse } from "next/server";
import { z } from "zod";
import { render } from "@react-email/render";
import { requestMagicLink } from "@/services/auth/magic-link";
import { sendEmail } from "@/lib/email/resend";
import { hashIp } from "@/lib/hash";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { MagicLinkEmail } from "@/emails/magicLinkEmail";

export const runtime = "nodejs";
const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad_email" }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";

  try {
    const { token } = await requestMagicLink({ email: parsed.data.email, ipHash: await hashIp(ip) });
    const link = `${env.APP_BASE_URL}/auth/verify?t=${encodeURIComponent(token)}`;
    const html = await render(MagicLinkEmail({ link }));
    await sendEmail({
      to: parsed.data.email,
      subject: "התחברות · תשלם לי",
      html,
      text: `להתחברות: ${link} (תקף 15 דקות).`,
    });
  } catch (e) {
    if (e instanceof AppError && e.code === "MAGIC_RATE_LIMIT") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
  }
  return NextResponse.json({ ok: true });
}
