const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const r = await fetch(VERIFY_URL, { method: "POST", body });
  if (!r.ok) return false;
  const j = (await r.json()) as { success?: boolean };
  return Boolean(j.success);
}
