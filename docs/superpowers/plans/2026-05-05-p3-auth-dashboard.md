# P3 · Auth + Claimant Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passwordless email magic-link auth, server-rendered `/me` dashboard listing the claimant's claims with deep-links to their cinematic trackers, and a privacy-mode toggle that flips public-link redaction.

**Architecture:** Hashed single-use magic-link tokens stored in `magic_link_tokens`, sessions stored in `sessions`, JWT cookie `tshl_session` carrying `(sid, uid)`. A small middleware validates the cookie + session row on every `/me/*` request. Privacy toggle writes to `users.privacy_mode` and re-mints the claim_token of any active claim so old shared links go dead (mitigates spec audit A4).

**Tech Stack:** P1 helpers (db, jwt/session-token, env, hash, rate-limit, resend) · jose · bcrypt-equivalent constant-time compare via `crypto.timingSafeEqual`.

**Depends on:** P1 (auth schema, session JWT, Resend), P2 (claim_token signing for re-mint).

---

## File map

```
services/auth/
  magic-link.ts                    request, verify, consume
  session.ts                       create, revoke, getCurrentUser
  re-mint-claim-tokens.ts          rotate user's claim tokens on privacy flip
lib/auth/middleware.ts             requireUser() helper
app/api/auth/
  request/route.ts
  verify/route.ts
  logout/route.ts
  session/route.ts
app/auth/
  verify/page.tsx                  link-target page (handles GET ?t=)
app/me/
  page.tsx                         dashboard
  settings/page.tsx                privacy toggle
components/me/
  ClaimRow.tsx
  PrivacyToggle.tsx
emails/
  magicLinkEmail.tsx               react-email template
tests/services/auth/magic-link.test.ts
tests/services/auth/session.test.ts
tests/api/auth/request.test.ts
tests/api/auth/verify.test.ts
```

---

### Task 1 — Add deps

```bash
npm install react-email @react-email/render @react-email/components
git add package.json package-lock.json
git commit -m "chore(p3): add react-email"
```

---

### Task 2 — Magic-link service

**Files:**
- Create: `services/auth/magic-link.ts`
- Create: `tests/services/auth/magic-link.test.ts`

- [ ] **Step 1: implementation**

```ts
// services/auth/magic-link.ts
import { db } from "@/lib/db/client";
import { magicLinkTokens } from "@/lib/db/schema/auth";
import { users } from "@/lib/db/schema/users";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp } from "@/lib/hash";
import { AppError } from "@/lib/errors";

const TTL_MS = 15 * 60 * 1000;

export type RequestInput = { email: string; ipHash: string };

export async function requestMagicLink({ email, ipHash }: RequestInput): Promise<{ token: string; userId: string }> {
  const rl = await rateLimit(`magic:${email}:${ipHash}`, 5, 600);
  if (!rl.ok) throw new AppError("MAGIC_RATE_LIMIT", "too many requests", 429);

  const [u] = await db
    .insert(users)
    .values({ email })
    .onConflictDoNothing()
    .returning({ id: users.id });
  const userId = u?.id ?? (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0]?.id;
  if (!userId) throw new AppError("MAGIC_USER_FAIL", "could not upsert user", 500);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest();
  await db.insert(magicLinkTokens).values({
    userId,
    tokenHash: tokenHash as any,
    channel: "email",
    expiresAt: new Date(Date.now() + TTL_MS),
    ipHash,
  });
  return { token, userId };
}

export type ConsumeInput = { token: string; ipHash: string };

export async function consumeMagicLink({ token }: ConsumeInput): Promise<{ userId: string }> {
  const tokenHash = createHash("sha256").update(token).digest();
  const candidates = await db
    .select()
    .from(magicLinkTokens)
    .where(and(isNull(magicLinkTokens.consumedAt), gt(magicLinkTokens.expiresAt, new Date())))
    .limit(50);

  let found: typeof candidates[number] | undefined;
  for (const row of candidates) {
    const stored = row.tokenHash as unknown as Buffer;
    if (stored.length === tokenHash.length && timingSafeEqual(stored, tokenHash)) {
      found = row;
      break;
    }
  }
  if (!found) throw new AppError("MAGIC_INVALID", "invalid or expired token", 401);

  await db.update(magicLinkTokens).set({ consumedAt: new Date() }).where(eq(magicLinkTokens.id, found.id));
  return { userId: found.userId };
}
```

- [ ] **Step 2: tests**

```ts
// tests/services/auth/magic-link.test.ts
import { describe, expect, it, vi } from "vitest";

const dbState = { tokens: [] as any[], users: [{ id: "u1", email: "noa@example.com" }] };

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: (t: any) => ({
      values: (vals: any) => ({
        onConflictDoNothing: () => ({ returning: async () => [] }),
        returning: async () => { dbState.tokens.push({ ...vals, id: "tok1" }); return [{ id: "tok1" }]; },
      }),
    }),
    select: () => ({ from: (t: any) => ({ where: (_: any) => ({ limit: async () => t === undefined ? [] : dbState.tokens.filter((x) => !x.consumedAt) }) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: async () => [{}] }) }) }),
  },
}));

vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(async () => ({ ok: true, remaining: 4 })) }));

describe("magic-link", () => {
  it("requestMagicLink stores hash and returns token", async () => {
    const { requestMagicLink } = await import("@/services/auth/magic-link");
    const { token } = await requestMagicLink({ email: "noa@example.com", ipHash: "ip" });
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(dbState.tokens[0].tokenHash).toBeInstanceOf(Buffer);
  });
});
```

- [ ] **Step 3: run + commit**

```bash
npx vitest run tests/services/auth/magic-link.test.ts
git add services/auth/magic-link.ts tests/services/auth/magic-link.test.ts
git commit -m "feat(p3): magic-link request + consume with hashed tokens"
```

---

### Task 3 — Session service

**Files:**
- Create: `services/auth/session.ts`
- Create: `tests/services/auth/session.test.ts`

- [ ] **Step 1: implementation**

```ts
// services/auth/session.ts
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema/auth";
import { users } from "@/lib/db/schema/users";
import { and, eq, gt, isNull } from "drizzle-orm";
import { signSession, verifySession } from "@/lib/jwt/session-token";
import { AppError } from "@/lib/errors";

export const COOKIE_NAME = "tshl_session";
const TTL_DAYS = 14;

export async function createSession(userId: string, ipHash: string, userAgent: string | null) {
  const [row] = await db.insert(sessions).values({
    userId,
    expiresAt: new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000),
    ipHash,
    userAgent,
  }).returning();
  if (!row) throw new AppError("SESSION_DB_FAIL", "could not create session", 500);
  return { sid: row.id, jwt: await signSession(row.id, userId, { ttlSeconds: TTL_DAYS * 24 * 60 * 60 }) };
}

export async function getCurrentUser(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  let payload: { sid: string; uid: string };
  try { payload = await verifySession(cookieValue); } catch { return null; }
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, payload.sid), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.userId !== payload.uid) return null;
  const [u] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  return u ?? null;
}

export async function revokeSession(sid: string) {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sid));
}
```

- [ ] **Step 2: smoke test (mocks)**

```ts
// tests/services/auth/session.test.ts
import { describe, expect, it, vi } from "vitest";

const sessionRow = { id: "sid1", userId: "u1", revokedAt: null, expiresAt: new Date(Date.now() + 86400e3) };
const user = { id: "u1", email: "noa@example.com" };

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: () => ({ values: () => ({ returning: async () => [sessionRow] }) }),
    select: () => ({ from: (t: any) => ({ where: () => ({ limit: async () => (t === undefined ? [user] : [sessionRow]) }) }) }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  },
}));

describe("session", () => {
  it("createSession returns sid + jwt", async () => {
    const { createSession } = await import("@/services/auth/session");
    const r = await createSession("u1", "ip", "ua");
    expect(r.sid).toBe("sid1");
    expect(typeof r.jwt).toBe("string");
  });
});
```

- [ ] **Step 3: run + commit**

```bash
npx vitest run tests/services/auth/session.test.ts
git add services/auth/session.ts tests/services/auth/session.test.ts
git commit -m "feat(p3): session create/get/revoke"
```

---

### Task 4 — Magic-link email template

**Files:**
- Create: `emails/magicLinkEmail.tsx`

```tsx
// emails/magicLinkEmail.tsx
import { Body, Container, Head, Heading, Html, Link, Section, Text } from "@react-email/components";

export function MagicLinkEmail({ link }: { link: string }) {
  return (
    <Html dir="rtl" lang="he">
      <Head />
      <Body style={{ background: "#0A0E14", color: "#F5F5F0", fontFamily: "Heebo, Inter, sans-serif", margin: 0 }}>
        <Container style={{ padding: 32, maxWidth: 540 }}>
          <Heading style={{ fontWeight: 900, fontSize: 28, color: "#F5F5F0" }}>
            תשלם לי
          </Heading>
          <Section style={{ background: "#0c1118", padding: 24, borderRadius: 16, marginTop: 24 }}>
            <Text style={{ fontSize: 16, color: "#F5F5F0" }}>
              הקליקי על הקישור כדי להיכנס לחשבון. הקישור תקף ל-15 דקות.
            </Text>
            <Link href={link} style={{ background: "#C6F432", color: "#0A0E14", padding: "12px 24px", borderRadius: 999, fontWeight: 700, textDecoration: "none", display: "inline-block", marginTop: 16 }}>
              כניסה לחשבון
            </Link>
          </Section>
          <Text style={{ color: "#74777f", fontSize: 12, marginTop: 32 }}>
            לא ביקשת? התעלמי מהמייל הזה.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

```bash
git add emails/magicLinkEmail.tsx
git commit -m "feat(p3): react-email magic-link template (HE/RTL)"
```

---

### Task 5 — `/api/auth/request` route

**Files:** Create: `app/api/auth/request/route.ts`

```ts
// app/api/auth/request/route.ts
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
    // never leak whether the email exists; pretend success
  }
  return NextResponse.json({ ok: true });
}
```

```bash
git add app/api/auth/request
git commit -m "feat(p3): POST /api/auth/request issues magic link via Resend"
```

---

### Task 6 — `/api/auth/verify` + `/auth/verify` page + cookie

**Files:**
- Create: `app/api/auth/verify/route.ts`
- Create: `app/auth/verify/page.tsx`

```ts
// app/api/auth/verify/route.ts
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
```

```tsx
// app/auth/verify/page.tsx
export default async function Verify({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center bg-terminal text-fluorescent" dir="rtl">
      <div className="text-center font-heebo">
        {sp.err
          ? <div className="space-y-2"><div className="font-mono text-cancellation text-xs uppercase tracking-[0.3em]">קישור לא תקף</div><div className="text-2xl">בקשי קישור חדש מהדף הראשי.</div></div>
          : <div className="text-xl">מאמתים…</div>}
      </div>
    </main>
  );
}
```

```bash
git add app/api/auth/verify app/auth/verify
git commit -m "feat(p3): GET /api/auth/verify sets session cookie + redirects to /me"
```

---

### Task 7 — `/api/auth/session` + `/api/auth/logout`

**Files:**
- Create: `app/api/auth/session/route.ts`
- Create: `app/api/auth/logout/route.ts`

```ts
// app/api/auth/session/route.ts
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
```

```ts
// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, getCurrentUser, revokeSession } from "@/services/auth/session";
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
```

```bash
git add app/api/auth/session app/api/auth/logout
git commit -m "feat(p3): /api/auth/session + /api/auth/logout"
```

---

### Task 8 — `requireUser()` middleware helper

**Files:** Create: `lib/auth/middleware.ts`

```ts
// lib/auth/middleware.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, getCurrentUser } from "@/services/auth/session";

export async function requireUser() {
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  const user = await getCurrentUser(c);
  if (!user) redirect("/?login=1");
  return user!;
}
```

```bash
git add lib/auth/middleware.ts
git commit -m "feat(p3): requireUser() helper for server components"
```

---

### Task 9 — `/me` dashboard

**Files:**
- Create: `app/me/page.tsx`
- Create: `components/me/ClaimRow.tsx`

```tsx
// app/me/page.tsx
import { requireUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { desc, eq } from "drizzle-orm";
import { ClaimRow } from "@/components/me/ClaimRow";
import Link from "next/link";

export default async function MeDashboard() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(claims)
    .where(eq(claims.userId, user.id))
    .orderBy(desc(claims.createdAt))
    .limit(50);

  return (
    <main dir="rtl" className="min-h-screen bg-terminal text-fluorescent py-16 px-6">
      <div className="mx-auto max-w-[1080px]">
        <header className="flex items-end justify-between mb-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">DASHBOARD</span>
            <h1 className="mt-3 font-heebo font-black tracking-tightest text-4xl sm:text-5xl">שלום, {user.fullName ?? user.email}</h1>
          </div>
          <Link href="/me/settings" className="font-mono text-xs uppercase tracking-[0.3em] text-fluorescent/55 hover:text-reversal">
            הגדרות
          </Link>
        </header>

        {rows.length === 0 ? (
          <div className="font-heebo text-fluorescent/65">
            אין תיקים עדיין. <Link href="/check" className="text-reversal underline">בדקי טיסה.</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((c) => <ClaimRow key={c.id} claim={c} />)}
          </div>
        )}
      </div>
    </main>
  );
}
```

```tsx
// components/me/ClaimRow.tsx
import Link from "next/link";
import type { Claim } from "@/lib/db/schema/claims";

export function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <Link
      href={`/claim/${claim.claimToken}`}
      className="grid grid-cols-12 gap-4 items-center rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/8 p-6 hover:ring-reversal/50 transition"
    >
      <div className="col-span-3 font-mono text-[11px] uppercase tracking-[0.3em] text-fluorescent/45">
        {claim.currentState}
      </div>
      <div className="col-span-4 font-heebo font-bold text-fluorescent">{claim.passengerName}</div>
      <div className="col-span-3 font-mono text-fluorescent/65 text-sm">{claim.airlineIata ?? "—"}</div>
      <div className="col-span-2 font-mono text-reversal text-xl tabular-nums text-end">₪ {claim.amountIls.toLocaleString()}</div>
    </Link>
  );
}
```

```bash
git add app/me/page.tsx components/me/ClaimRow.tsx
git commit -m "feat(p3): /me dashboard listing user's claims"
```

---

### Task 10 — Privacy toggle + claim_token re-mint

**Files:**
- Create: `services/auth/re-mint-claim-tokens.ts`
- Create: `app/me/settings/page.tsx`
- Create: `components/me/PrivacyToggle.tsx`
- Create: `app/api/me/privacy/route.ts`

```ts
// services/auth/re-mint-claim-tokens.ts
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { eq } from "drizzle-orm";
import { signClaimToken } from "@/lib/jwt/claim-token";

export async function reMintUserClaimTokens(userId: string) {
  const rows = await db.select().from(claims).where(eq(claims.userId, userId));
  for (const c of rows) {
    const token = await signClaimToken(c.id);
    await db.update(claims).set({ claimToken: token }).where(eq(claims.id, c.id));
  }
  return rows.length;
}
```

```ts
// app/api/me/privacy/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { reMintUserClaimTokens } from "@/services/auth/re-mint-claim-tokens";

const Body = z.object({ privacy_mode: z.enum(["public_default", "anonymous"]) });

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });

  await db.update(users).set({ privacyMode: parsed.data.privacy_mode }).where(eq(users.id, user.id));
  // Tightening privacy → expire old shared links by re-minting tokens
  if (parsed.data.privacy_mode === "anonymous") {
    await reMintUserClaimTokens(user.id);
  }
  return NextResponse.json({ ok: true });
}
```

```tsx
// app/me/settings/page.tsx
import { requireUser } from "@/lib/auth/middleware";
import { PrivacyToggle } from "@/components/me/PrivacyToggle";

export default async function Settings() {
  const user = await requireUser();
  return (
    <main dir="rtl" className="min-h-screen bg-terminal text-fluorescent py-16 px-6">
      <div className="mx-auto max-w-[640px] space-y-10">
        <h1 className="font-heebo font-black text-4xl">הגדרות</h1>
        <PrivacyToggle initial={user.privacyMode as "public_default" | "anonymous"} />
      </div>
    </main>
  );
}
```

```tsx
// components/me/PrivacyToggle.tsx
"use client";

import { useState } from "react";

export function PrivacyToggle({ initial }: { initial: "public_default" | "anonymous" }) {
  const [mode, setMode] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function flip() {
    const next = mode === "anonymous" ? "public_default" : "anonymous";
    setBusy(true);
    const r = await fetch("/api/me/privacy", { method: "POST", body: JSON.stringify({ privacy_mode: next }), headers: { "content-type": "application/json" } });
    setBusy(false);
    if (r.ok) setMode(next);
  }

  return (
    <section className="rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/8 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/45 mb-3">PRIVACY MODE</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-heebo font-bold text-fluorescent text-xl">
            {mode === "anonymous" ? "אנונימי · מומלץ" : "ציבורי · נראה לכל מי שיש לו את הקישור"}
          </div>
          <div className="font-heebo text-fluorescent/55 text-sm mt-1">
            במצב אנונימי, הקישורים הציבוריים שלך מציגים &quot;נוסע/ת ישראלי/ת&quot; בלבד.
          </div>
        </div>
        <button onClick={flip} disabled={busy} className="rounded-full bg-reversal px-5 py-2 font-heebo font-bold text-terminal disabled:opacity-50">
          {busy ? "…" : mode === "anonymous" ? "פתחי" : "הסתירי"}
        </button>
      </div>
    </section>
  );
}
```

```bash
git add services/auth/re-mint-claim-tokens.ts app/api/me/privacy app/me/settings components/me/PrivacyToggle.tsx
git commit -m "feat(p3): privacy-mode toggle with claim_token re-mint on tighten"
```

---

### Task 11 — Login launcher on landing

**Files:** Modify: `components/Nav.tsx` (add login link), Create: `components/auth/LoginDialog.tsx`

```tsx
// components/auth/LoginDialog.tsx
"use client";

import { useState } from "react";

export function LoginDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/auth/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    setBusy(false);
    if (r.ok) setSent(true);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center z-50" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-[min(420px,90vw)] rounded-3xl bg-[#0c1118] ring-1 ring-fluorescent/10 p-8 space-y-4" dir="rtl">
        <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">LOGIN</div>
        <h2 className="font-heebo font-black text-fluorescent text-2xl">קישור חד-פעמי במייל</h2>
        {sent ? (
          <div className="font-heebo text-fluorescent/65">בדקי את תיבת המייל. הקישור תקף ל-15 דקות.</div>
        ) : (
          <>
            <input
              required type="email" dir="ltr"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-fluorescent focus:border-reversal focus:outline-none"
            />
            <button type="submit" disabled={busy} className="w-full rounded-full bg-reversal py-3 font-heebo font-bold text-terminal disabled:opacity-50">
              {busy ? "שולח…" : "שלחו לי קישור"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
```

```bash
git add components/auth/LoginDialog.tsx
git commit -m "feat(p3): client login dialog (email-only)"
```

> Wiring `LoginDialog` into `Nav` is mechanical: add a state + button labelled `כניסה` that toggles the dialog. Skip Nav modification if you prefer linking from `/me` redirect (`?login=1`) directly.

---

## Self-review

- [x] Magic-link tokens hashed with sha256; constant-time comparison.
- [x] Sessions stored in DB with revoke flow.
- [x] JWT cookie HttpOnly + SameSite=Lax + Secure (in prod).
- [x] No email enumeration in `/api/auth/request` response (always returns `ok: true`).
- [x] Privacy tightening re-mints claim tokens (mitigates A4 from spec audit).
- [x] All routes use `runtime: "nodejs"`.
- [x] No placeholders.

P3 complete. P4 consumes: `users.privacy_mode`, claim_token verification, sessions, `requireUser()`.
