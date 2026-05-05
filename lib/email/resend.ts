import { Resend } from "resend";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}) {
  const res = await resend.emails.send({
    from: env.RESEND_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
    headers: opts.headers,
  });
  if (res.error) throw new AppError("EMAIL_SEND_FAIL", res.error.message, 502, res.error);
  return res.data!.id;
}
