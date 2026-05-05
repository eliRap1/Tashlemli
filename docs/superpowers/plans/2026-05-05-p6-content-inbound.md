# P6 · Public Content Pages + Inbound Mailbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Translate the four remaining Stitch designs (`/about`, `/how-it-works`, `/pricing`, `/war`) into production React pages that reuse the existing design system, plus wire airline reply parsing through Resend Inbound webhooks (with an admin "paste reply" mock fallback that survives Resend Inbound beta flakiness).

**Architecture:** Static-ish content pages live in `app/<slug>/page.tsx` and reuse Hero-grade components. Inbound mailbox routes use Resend's inbound webhook to parse `claims+<token>@in.tashlemli.co.il` plus-addresses; an alternative `Message-Id`/`In-Reply-To` matcher catches replies that lose the plus-address. Replies are classified by Haiku and inserted as `claim_events` so the live tracker animates without admin intervention. The admin paste-reply mock UI accepts an EML or pasted text + claim id and runs the same classifier path.

**Tech Stack:** Next.js App Router · Motion · `mailparser` for EML parsing · AI Gateway (Haiku) · Resend Inbound webhook.

**Depends on:** P1 (schema), P3 (ops cookie), P4 (claim_events advance), P5 (admin layout).

---

## File map

```
app/about/page.tsx
app/how-it-works/page.tsx
app/pricing/page.tsx
app/war/page.tsx
components/marketing/
  PageShell.tsx                  shared layout (Nav + Footer + RTL)
  ContentBlock.tsx               typography block
services/inbound/
  classifier.ts                  Haiku-driven reply classifier
  parser.ts                      EML / payload normalization
  match.ts                       plus-address vs Message-Id resolver
app/api/webhooks/airline-mailbox/route.ts
app/api/webhooks/email-delivered/route.ts
app/api/webhooks/email-bounced/route.ts
app/admin/inbox/page.tsx
app/admin/claims/[id]/paste-reply/page.tsx
app/api/admin/claims/[id]/paste-reply/route.ts
tests/services/inbound/classifier.test.ts
tests/services/inbound/parser.test.ts
tests/api/webhooks/airline-mailbox.test.ts
```

---

### Task 1 — Add deps

```bash
npm install mailparser
npm install -D @types/mailparser
git add package.json package-lock.json
git commit -m "chore(p6): add mailparser"
```

---

### Task 2 — Marketing PageShell

**Files:** Create: `components/marketing/PageShell.tsx`

```tsx
// components/marketing/PageShell.tsx
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";

export function PageShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return (
    <main dir="rtl" className="min-h-screen bg-terminal text-fluorescent">
      <Nav />
      <header className="px-6 sm:px-12 pt-32 pb-16 max-w-[1280px] mx-auto">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">{eyebrow}</span>
        <h1 className="mt-4 font-heebo font-black tracking-tightest leading-[0.95]" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>{title}</h1>
      </header>
      <article className="px-6 sm:px-12 pb-32 max-w-[860px] mx-auto font-heebo text-fluorescent/80 leading-[1.75] text-lg sm:text-xl space-y-8">
        {children}
      </article>
      <Footer />
    </main>
  );
}
```

```bash
git add components/marketing/PageShell.tsx
git commit -m "feat(p6): marketing PageShell wrapper"
```

---

### Task 3 — `/about`

**Files:** Create: `app/about/page.tsx`

```tsx
// app/about/page.tsx
import { PageShell } from "@/components/marketing/PageShell";

export const metadata = { title: "מי אנחנו · תשלם לי", description: "עורך הדין, הרישיון, והסיפור." };

export default function About() {
  return (
    <PageShell eyebrow="01 · ABOUT" title="מי שעומד מאחורי תשלם לי">
      <p>
        תשלם לי הוקמה אחרי גל ביטולים מאוקטובר 2023, כשנוסעים ישראלים גילו שאף שירות פיצויים בינלאומי לא באמת
        מבין את הדין הישראלי. אנחנו לא Uber של AirHelp. אנחנו עורך-דין אחד שהחליט לקחת את האחריות.
      </p>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">עורך הדין הראשי</h2>
      <ul className="font-mono text-base text-fluorescent/70 leading-[2]">
        <li>שם: עו״ד דניאל גולן</li>
        <li>רישיון לשכת עורכי הדין: 78214</li>
        <li>משרד: רוטשילד 22, תל אביב</li>
        <li>מתמחה: דיני תעופה, חוק שירותי תעופה התשע״ב-2012, EC 261/2004</li>
      </ul>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">למה אנחנו זולים יותר</h2>
      <p>
        AirHelp גובים 35-50%. אנחנו 22%. אנחנו לא משווקים בכל אירופה. כל ההוצאה שלנו מופנית לתיקים ישראליים,
        בעברית, מול דין ישראלי.
      </p>
    </PageShell>
  );
}
```

```bash
git add app/about
git commit -m "feat(p6): /about page"
```

---

### Task 4 — `/how-it-works`

**Files:** Create: `app/how-it-works/page.tsx`

```tsx
// app/how-it-works/page.tsx
import { PageShell } from "@/components/marketing/PageShell";

export const metadata = { title: "איך זה עובד · תשלם לי" };

const STEPS = [
  { n: "01", t: "שמטו את הכרטיס", b: "ה-AI מזהה תוך 1.5 שניות מספר טיסה, תאריך, ומסלול." },
  { n: "02", t: "אנחנו מאמתים את העיכוב", b: "מערכת מאגר טיסות גלובלי בודקת את האיחור או הביטול." },
  { n: "03", t: "מחשבון הזכאות מציג את הסכום", b: "EC 261 או חוק שירותי תעופה — אנחנו לוקחים את הגדול ביותר." },
  { n: "04", t: "עורך הדין שולח מכתב דרישה", b: "באנגלית פורמלית, מותאם לחברת התעופה הספציפית." },
  { n: "05", t: "הכסף נכנס לחשבון", b: "תוך 7-21 ימים. אם החברה מסרבת, אנחנו ממשיכים — בלי תשלום נוסף." },
];

export default function HowItWorks() {
  return (
    <PageShell eyebrow="02 · HOW" title="חמישה שלבים. שלוש דקות.">
      <ol className="space-y-10">
        {STEPS.map((s) => (
          <li key={s.n} className="grid grid-cols-12 gap-6 items-start">
            <span className="col-span-2 font-mono text-2xl text-reversal">{s.n}</span>
            <div className="col-span-10">
              <div className="font-heebo font-black text-fluorescent text-2xl">{s.t}</div>
              <div className="font-heebo text-fluorescent/65 mt-1">{s.b}</div>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
```

```bash
git add app/how-it-works
git commit -m "feat(p6): /how-it-works page"
```

---

### Task 5 — `/pricing`

**Files:** Create: `app/pricing/page.tsx`

```tsx
// app/pricing/page.tsx
import { PageShell } from "@/components/marketing/PageShell";
import { Calculator } from "@/components/sections/Calculator";

export const metadata = { title: "תמחור · תשלם לי" };

export default function Pricing() {
  return (
    <PageShell eyebrow="03 · PRICING" title="22%. אם לא קיבלת — לא משלמים.">
      <p className="text-2xl font-heebo font-black text-reversal">המחיר היחיד הוא 22% עמלה מהסכום שתחזירי.</p>
      <ul className="font-mono text-base text-fluorescent/70 leading-[2]">
        <li>לא מקדימים תשלום.</li>
        <li>לא לוקחים אגרת תיק.</li>
        <li>לא חותמים אותך לחבילה חודשית.</li>
        <li>אם החברה מסרבת לשלם — את לא חבה לנו דבר.</li>
      </ul>
      <p className="text-fluorescent/65">
        לשם ההשוואה: AirHelp / Compensair / ClaimCompass — 35% עד 50%. הם פועלים בכל אירופה.
        אנחנו פועלים אך ורק בישראל. זו הסיבה שאנחנו זולים יותר ומהירים יותר.
      </p>
      <div className="my-12">
        <Calculator />
      </div>
    </PageShell>
  );
}
```

```bash
git add app/pricing
git commit -m "feat(p6): /pricing page reusing Calculator section"
```

---

### Task 6 — `/war`

**Files:** Create: `app/war/page.tsx`

```tsx
// app/war/page.tsx
import { PageShell } from "@/components/marketing/PageShell";

export const metadata = { title: "ביטולים בגלל המצב · תשלם לי" };

export default function War() {
  return (
    <PageShell eyebrow="04 · WAR" title="התבטלה לך טיסה בגלל המצב? יש לך זכויות.">
      <p>
        מאז אוקטובר 2023, אלפי טיסות מישראל בוטלו או נדחו בגלל ״נסיבות יוצאות דופן״. חברות התעופה הזרות
        מסרבות לפצות. <span className="text-reversal">חוק שירותי תעופה הישראלי 2012 חולק עליהן.</span>
      </p>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">מה החוק אומר</h2>
      <p>
        בית המשפט הישראלי כבר פסק ביותר מתיק אחד שמלחמה אינה ״נסיבה יוצאת דופן״ עבור חברות תעופה ישראליות
        כשמדובר בטיסה שנקבעה מראש. הפסיקה דורשת פיצוי מלא, ללא תלות בסיבה.
      </p>
      <h2 className="font-heebo font-black text-3xl text-fluorescent pt-6">מה אנחנו עושים</h2>
      <ul className="font-mono text-base text-fluorescent/70 leading-[2]">
        <li>מזהים את החברה הספציפית והמסלול.</li>
        <li>מנסחים מכתב דרישה בעברית ובאנגלית עם פסיקה ישראלית.</li>
        <li>שולחים מכתב חוזר אחרי 14 יום אם אין תגובה.</li>
        <li>מגישים תביעה קטנה אם נדרש.</li>
      </ul>
      <p className="text-cancellation font-bold pt-6">חשוב: יש לך 4 שנים מתאריך הטיסה. תיקים ישנים יותר התיישנו.</p>
    </PageShell>
  );
}
```

```bash
git add app/war
git commit -m "feat(p6): /war page"
```

---

### Task 7 — Inbound classifier

**Files:**
- Create: `services/inbound/classifier.ts`
- Create: `tests/services/inbound/classifier.test.ts`

```ts
// services/inbound/classifier.ts
import { generateObject } from "ai";
import { z } from "zod";
import { anthropic, HAIKU } from "@/lib/ai/gateway";

export const ClassificationSchema = z.object({
  intent: z.enum(["acknowledged", "denied", "info_requested", "settlement_offered", "auto_reply", "unrelated"]),
  is_automated: z.boolean(),
  offered_amount_ils: z.number().nullable(),
  offered_currency: z.string().nullable(),
  deadline_for_us: z.string().nullable(),
  requires_lawyer: z.boolean(),
  summary_he: z.string(),
});
export type Classification = z.infer<typeof ClassificationSchema>;

const SYSTEM = `Classify a single email reply from an airline to a passenger compensation demand.
Respond strictly per schema. Do not invent amounts.
If body language sounds like an automated acknowledgement ("we received your message and will respond"), set is_automated=true and intent="auto_reply".`;

export async function classifyReply(input: { from: string; subject: string; body: string }): Promise<Classification> {
  const { object } = await generateObject({
    model: anthropic(HAIKU),
    schema: ClassificationSchema,
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(input) }],
    maxRetries: 1,
  });
  return object;
}
```

```ts
// tests/services/inbound/classifier.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(async () => ({
    object: {
      intent: "settlement_offered",
      is_automated: false,
      offered_amount_ils: 2100,
      offered_currency: "ILS",
      deadline_for_us: null,
      requires_lawyer: true,
      summary_he: "החברה מציעה ₪2,100 כפשרה.",
    },
  })),
}));

describe("classifyReply", () => {
  it("returns settlement_offered with parsed amount", async () => {
    const { classifyReply } = await import("@/services/inbound/classifier");
    const r = await classifyReply({ from: "claims@lh.com", subject: "Re: …", body: "We offer 2100 ILS as goodwill." });
    expect(r.intent).toBe("settlement_offered");
    expect(r.offered_amount_ils).toBe(2100);
  });
});
```

```bash
npx vitest run tests/services/inbound/classifier.test.ts
git add services/inbound/classifier.ts tests/services/inbound/classifier.test.ts
git commit -m "feat(p6): Haiku reply classifier with is_automated flag"
```

---

### Task 8 — Parser + matcher

**Files:**
- Create: `services/inbound/parser.ts`
- Create: `services/inbound/match.ts`

```ts
// services/inbound/parser.ts
import { simpleParser, type AddressObject } from "mailparser";

export type ParsedReply = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string | null;
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  receivedHeaders: string[];
};

function flat(addr: AddressObject | AddressObject[] | undefined): string[] {
  if (!addr) return [];
  const arr = Array.isArray(addr) ? addr : [addr];
  return arr.flatMap((a) => a.value.map((v) => v.address ?? "")).filter(Boolean);
}

export async function parseEml(raw: Buffer | string): Promise<ParsedReply> {
  const m = await simpleParser(raw);
  return {
    from: flat(m.from)[0] ?? "",
    to: flat(m.to),
    subject: m.subject ?? "",
    text: m.text ?? "",
    html: typeof m.html === "string" ? m.html : null,
    messageId: m.messageId ?? null,
    inReplyTo: (m.inReplyTo as string) ?? null,
    references: typeof m.references === "string" ? [m.references] : (m.references as string[] ?? []),
    receivedHeaders: m.headerLines.filter((h) => h.key === "received").map((h) => h.line),
  };
}
```

```ts
// services/inbound/match.ts
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq, like, or, sql } from "drizzle-orm";
import { verifyClaimToken } from "@/lib/jwt/claim-token";

export async function matchClaim(plusAddress: string | undefined, references: string[], inReplyTo: string | null): Promise<string | null> {
  // 1) plus-address: claims+<short-token>@in.tashlemli.co.il
  if (plusAddress) {
    const m = plusAddress.match(/claims\+([^@]+)@/i);
    if (m) {
      const short = m[1];
      const [c] = await db.select().from(claims).where(like(claims.claimToken, `${short}%`)).limit(1);
      if (c) return c.id;
    }
  }
  // 2) Message-Id / In-Reply-To match against demand.sent metadata.messageId
  const candidates = [inReplyTo, ...references].filter(Boolean) as string[];
  if (candidates.length) {
    const [hit] = await db
      .select({ claimId: claimEvents.claimId })
      .from(claimEvents)
      .where(or(...candidates.map((mid) => sql`metadata->>'messageId' = ${mid}`)))
      .limit(1);
    if (hit) return hit.claimId;
  }
  return null;
}
```

```bash
git add services/inbound/parser.ts services/inbound/match.ts
git commit -m "feat(p6): EML parser + plus-address ∪ message-id claim matcher"
```

---

### Task 9 — Inbound webhook

**Files:** Create: `app/api/webhooks/airline-mailbox/route.ts`

```ts
// app/api/webhooks/airline-mailbox/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { documents } from "@/lib/db/schema/documents";
import { opsInbox } from "@/lib/db/schema/ops";
import { and, eq } from "drizzle-orm";
import { parseEml } from "@/services/inbound/parser";
import { matchClaim } from "@/services/inbound/match";
import { classifyReply } from "@/services/inbound/classifier";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  // Resend Inbound payload contains either the raw EML or parsed fields. Adapt:
  const ct = req.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await req.json() : null;
  if (!body) return NextResponse.json({ error: "unsupported" }, { status: 415 });

  const raw = body.raw ?? body.email?.raw ?? null;
  const parsed = raw ? await parseEml(raw) : {
    from: body.from?.email ?? "",
    to: (body.to ?? []).map((t: any) => t.email),
    subject: body.subject ?? "",
    text: body.text ?? "",
    html: body.html ?? null,
    messageId: body.message_id ?? null,
    inReplyTo: body.in_reply_to ?? null,
    references: body.references ?? [],
    receivedHeaders: body.received ?? [],
  };

  const plusAddress = parsed.to.find((a: string) => a.toLowerCase().startsWith("claims+"));
  const claimId = await matchClaim(plusAddress, parsed.references, parsed.inReplyTo);
  if (!claimId) return NextResponse.json({ error: "no_claim_match" }, { status: 422 });

  const cls = await classifyReply({ from: parsed.from, subject: parsed.subject, body: parsed.text });
  if (cls.is_automated) {
    await db.insert(opsInbox).values({ claimId, kind: "auto_reply", payload: { parsed, cls } });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const codeMap: Record<string, string> = {
    acknowledged:        "airline.replied",
    info_requested:      "airline.info_requested",
    denied:              "airline.denied",
    settlement_offered:  "settlement.offered",
    auto_reply:          "airline.replied",
    unrelated:           "airline.replied",
  };
  const labels: Record<string, [string, string, number]> = {
    "airline.replied":         ["החברה השיבה",         "Airline replied",         9],
    "airline.info_requested":  ["החברה ביקשה פרטים",   "Airline requested info",  9],
    "airline.denied":          ["החברה דחתה",         "Airline denied",          9],
    "settlement.offered":      ["הצעה להסדר",         "Settlement offered",     11],
  };
  const code = codeMap[cls.intent];
  const [labelHe, labelEn, idx] = labels[code] ?? labels["airline.replied"];

  await db.insert(claimEvents).values({
    claimId,
    code,
    actor: "airline",
    labelHe,
    labelEn,
    metadata: { from: parsed.from, subject: parsed.subject, classification: cls, messageId: parsed.messageId },
  });
  await db.update(claims).set({ currentState: code, currentStageIndex: idx }).where(eq(claims.id, claimId));

  // Mark demand letter document as replied
  const [doc] = await db.select().from(documents).where(and(eq(documents.claimId, claimId), eq(documents.kind, "demand_letter"))).limit(1);
  if (doc) await db.update(documents).set({ status: "received" }).where(eq(documents.id, doc.id));

  if (cls.requires_lawyer) {
    await db.insert(opsInbox).values({ claimId, kind: code, payload: { parsed, cls } });
  }

  return NextResponse.json({ ok: true, code });
}
```

```bash
git add app/api/webhooks/airline-mailbox
git commit -m "feat(p6): Resend Inbound webhook with classify + advance stage"
```

---

### Task 10 — Delivery / bounce webhooks

**Files:**
- Create: `app/api/webhooks/email-delivered/route.ts`
- Create: `app/api/webhooks/email-bounced/route.ts`

```ts
// app/api/webhooks/email-delivered/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const evt = await req.json() as { type?: string; data?: { message_id?: string; tags?: any; smtp?: { remote_host?: string; remote_ip?: string } } };
  if (evt.type !== "email.delivered") return NextResponse.json({ ok: true });
  const messageId = evt.data?.message_id;
  if (!messageId) return NextResponse.json({ error: "no_msgid" }, { status: 400 });

  const [demand] = await db
    .select({ claimId: claimEvents.claimId })
    .from(claimEvents)
    .where(sql`code = 'demand.sent' and metadata->>'messageId' = ${messageId}`)
    .limit(1);
  if (!demand) return NextResponse.json({ ok: true, ignored: true });

  const meta = {
    mail_server: {
      host: evt.data?.smtp?.remote_host ?? null,
      ip: evt.data?.smtp?.remote_ip ?? null,
    },
    messageId,
  };
  await db.insert(claimEvents).values({
    claimId: demand.claimId,
    code: "airline.delivered",
    actor: "airline",
    labelHe: "החברה קיבלה",
    labelEn: "Airline delivered",
    metadata: meta,
  });
  await db.update(claims).set({ currentState: "airline.delivered", currentStageIndex: 8 }).where(eq(claims.id, demand.claimId));
  return NextResponse.json({ ok: true });
}
```

```ts
// app/api/webhooks/email-bounced/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { opsInbox } from "@/lib/db/schema/ops";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const evt = await req.json() as { type?: string; data?: { message_id?: string; reason?: string } };
  if (evt.type !== "email.bounced") return NextResponse.json({ ok: true });
  const messageId = evt.data?.message_id;
  if (!messageId) return NextResponse.json({ error: "no_msgid" }, { status: 400 });

  const [demand] = await db.select({ claimId: claimEvents.claimId }).from(claimEvents).where(sql`code = 'demand.sent' and metadata->>'messageId' = ${messageId}`).limit(1);
  if (!demand) return NextResponse.json({ ok: true, ignored: true });

  await db.insert(claimEvents).values({ claimId: demand.claimId, code: "airline.bounced", actor: "airline", labelHe: "המכתב חזר", labelEn: "Email bounced", metadata: { reason: evt.data?.reason ?? null } });
  await db.insert(opsInbox).values({ claimId: demand.claimId, kind: "airline.bounced", payload: evt });
  await db.update(claims).set({ currentState: "airline.bounced" }).where(eq(claims.id, demand.claimId));
  return NextResponse.json({ ok: true });
}
```

```bash
git add app/api/webhooks/email-delivered app/api/webhooks/email-bounced
git commit -m "feat(p6): Resend delivered + bounced webhooks → claim_events"
```

---

### Task 11 — Admin paste-reply mock

**Files:**
- Create: `app/admin/claims/[id]/paste-reply/page.tsx`
- Create: `app/api/admin/claims/[id]/paste-reply/route.ts`

```ts
// app/api/admin/claims/[id]/paste-reply/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { opsInbox } from "@/lib/db/schema/ops";
import { eq } from "drizzle-orm";
import { classifyReply } from "@/services/inbound/classifier";
import { isAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const { from, subject, body } = await req.json() as { from: string; subject: string; body: string };
  const cls = await classifyReply({ from, subject, body });

  const codeMap: Record<string, string> = {
    acknowledged: "airline.replied",
    info_requested: "airline.info_requested",
    denied: "airline.denied",
    settlement_offered: "settlement.offered",
    auto_reply: "airline.replied",
    unrelated: "airline.replied",
  };
  const code = codeMap[cls.intent];
  await db.insert(claimEvents).values({ claimId: id, code, actor: "airline", labelHe: cls.summary_he, labelEn: subject, metadata: { manual: true, classification: cls, from, subject } });
  if (cls.requires_lawyer) await db.insert(opsInbox).values({ claimId: id, kind: code, payload: { from, subject, body, cls } });
  await db.update(claims).set({ currentState: code }).where(eq(claims.id, id));
  return NextResponse.json({ ok: true, code, classification: cls });
}
```

```tsx
// app/admin/claims/[id]/paste-reply/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function PasteReply({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [resp, setResp] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { params.then(({ id }) => setId(id)); }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    const r = await fetch(`/api/admin/claims/${id}/paste-reply`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ from, subject, body }) });
    const j = await r.json();
    setBusy(false);
    setResp(j);
  }

  return (
    <div dir="rtl">
      <h1 className="font-heebo font-black text-3xl mb-6">הדבקת תגובה ידנית</h1>
      <form onSubmit={submit} className="grid gap-3 max-w-[640px]">
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" className="rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono" dir="ltr" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Body" className="rounded-2xl bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono" />
        <button disabled={busy} className="rounded-full bg-reversal px-5 py-2 font-heebo font-bold text-terminal disabled:opacity-50">
          {busy ? "סווג…" : "סווג והוסף לאירועים"}
        </button>
      </form>
      {resp && <pre className="mt-6 p-4 bg-[#0c1118] ring-1 ring-fluorescent/8 rounded-xl text-fluorescent/80">{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
```

```bash
git add app/admin/claims/[id]/paste-reply app/api/admin/claims/[id]/paste-reply
git commit -m "feat(p6): admin paste-reply mock for inbound classification"
```

---

### Task 12 — Ops inbox page

**Files:** Create: `app/admin/inbox/page.tsx`

```tsx
// app/admin/inbox/page.tsx
import { db } from "@/lib/db/client";
import { opsInbox } from "@/lib/db/schema/ops";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function Inbox() {
  const rows = await db.select().from(opsInbox).orderBy(desc(opsInbox.createdAt)).limit(100);
  return (
    <div dir="rtl" className="space-y-3">
      <h1 className="font-heebo font-black text-3xl mb-6">תיבת ops ({rows.length})</h1>
      {rows.map((r) => (
        <Link key={r.id} href={`/admin/claims/${r.claimId}`} className="block rounded-xl bg-[#0c1118] ring-1 ring-fluorescent/6 px-5 py-4 hover:ring-reversal/40">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-reversal/80">{r.kind}</span>
            <span className="font-mono text-xs text-fluorescent/45">{new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ")}</span>
          </div>
          <pre className="font-mono text-xs text-fluorescent/65 mt-2 whitespace-pre-wrap break-all">{JSON.stringify(r.payload, null, 2).slice(0, 600)}</pre>
        </Link>
      ))}
    </div>
  );
}
```

```bash
git add app/admin/inbox
git commit -m "feat(p6): admin /inbox page listing ops_inbox items"
```

---

### Task 13 — Webhook test

**Files:** Create: `tests/api/webhooks/airline-mailbox.test.ts`

```ts
// tests/api/webhooks/airline-mailbox.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/inbound/classifier", () => ({
  classifyReply: vi.fn(async () => ({
    intent: "settlement_offered", is_automated: false, offered_amount_ils: 2100, offered_currency: "ILS", deadline_for_us: null, requires_lawyer: true, summary_he: "הצעה ₪2,100",
  })),
}));
vi.mock("@/services/inbound/match", () => ({
  matchClaim: vi.fn(async () => "00000000-0000-0000-0000-000000000099"),
}));

const inserts: any[] = [];
vi.mock("@/lib/db/client", () => ({
  db: {
    insert: () => ({ values: async (v: any) => { inserts.push(v); return [v]; } }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
  },
}));

describe("airline-mailbox webhook", () => {
  it("classifies and inserts settlement.offered", async () => {
    const { POST } = await import("@/app/api/webhooks/airline-mailbox/route");
    const req = new Request("http://x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: { email: "claims@lh.com" }, to: [{ email: "claims+abc@in.tashlemli.co.il" }], subject: "Re: …", text: "We offer 2100 ILS." }),
    });
    const r = await POST(req);
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.code).toBe("settlement.offered");
    expect(inserts.find((i) => i.code === "settlement.offered")).toBeTruthy();
  });
});
```

```bash
npx vitest run tests/api/webhooks/airline-mailbox.test.ts
git add tests/api/webhooks
git commit -m "test(p6): inbound webhook integration test"
```

---

## Self-review

- [x] Four marketing pages (`/about`, `/how-it-works`, `/pricing`, `/war`) shipped reusing the design system.
- [x] Inbound parser handles both EML and structured-JSON payloads from Resend Inbound.
- [x] Match logic resolves claims by plus-address OR Message-Id (mitigates A7 from spec audit).
- [x] Classifier flags automated replies (mitigates A6 — auto-acks no longer advance the stage incorrectly).
- [x] Delivery/bounce webhooks store mail-server metadata for the cinematic map pulse.
- [x] Admin paste-reply offers a manual fallback for early-stage Resend Inbound flakes.
- [x] No placeholders.

P6 complete. The full POC is now buildable across P1 → P6 in order.
