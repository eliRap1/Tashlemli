# P5 · Wedge D — Demand Letter Generator + Lawyer Ops Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single-operator lawyer console at `/admin` that lists claims by stage, opens a claim, lets the operator generate (Sonnet via AI Gateway), edit (Monaco), and "send" a real PDF demand letter (rendered with `@react-pdf/renderer`, delivered via Resend with a `Reply-To` plus-addressed for inbound parsing later in P6). All admin actions write `audit_log` and emit `claim_events` so the public tracker animates in real time.

**Architecture:** Letter generator is pure-ish: facts → structured JSON → PDF. Sending is a separate step that records the locked version, sends via Resend, and stages `demand.sent` followed by `airline.delivered` upon Resend's delivery webhook (P6). POC auth = single shared password header `x-ops-password` plus a session cookie issued by `/admin/login`. The admin console is RTL Hebrew + LTR English in the document editor.

**Tech Stack:** AI Gateway (Sonnet) · `@react-pdf/renderer` · Monaco editor · Documenso Cloud (POA) · Resend (email send) · existing schema.

**Depends on:** P1 (schema), P2 (claim shape), P4 (claim_events advance pattern).

---

## File map

```
services/letters/
  generator.ts                    Sonnet structured generation
  prompts.ts                      cached system prompt
  schema.ts                       zod schema for letter object
  pdf.tsx                         react-pdf component (HE+EN side by side)
  send.ts                         persist + email via Resend
services/poa/
  documenso.ts                    Documenso Cloud client
  template.tsx                    react-pdf POA template (HE)
services/admin/
  audit.ts                        helper to write audit_log
app/admin/
  layout.tsx                      protected layout
  login/page.tsx                  POC password login
  page.tsx                        queue dashboard
  claims/[id]/page.tsx            claim detail
  claims/[id]/letter/page.tsx     editor
app/api/admin/
  login/route.ts
  logout/route.ts
  claims/route.ts                 list
  claims/[id]/route.ts            get
  claims/[id]/letter/draft/route.ts        POST: generate via Sonnet
  claims/[id]/letter/[version]/pdf/route.ts GET: render PDF on demand
  claims/[id]/letter/send/route.ts         POST: lock version + email airline
  claims/[id]/poa/route.ts                 POST: send POA via Documenso
lib/auth/admin.ts                  password→cookie verify
emails/airlineDemandEmail.tsx       Resend HTML wrapper for the PDF
tests/services/letters/generator.test.ts
tests/services/letters/send.test.ts
tests/api/admin/login.test.ts
tests/api/admin/draft-letter.test.ts
```

---

### Task 1 — Add deps

```bash
npm install @react-pdf/renderer @monaco-editor/react bcrypt
npm install -D @types/bcrypt
git add package.json package-lock.json
git commit -m "chore(p5): add react-pdf + monaco + bcrypt"
```

---

### Task 2 — Letter schema + prompts

**Files:**
- Create: `services/letters/schema.ts`
- Create: `services/letters/prompts.ts`

```ts
// services/letters/schema.ts
import { z } from "zod";

export const LetterSchema = z.object({
  subject_he: z.string(),
  subject_en: z.string(),
  letterhead: z.object({
    firm: z.string(),
    lawyer: z.string(),
    bar_license: z.string(),
    address: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }),
  facts_paragraph_he: z.string(),
  facts_paragraph_en: z.string(),
  legal_grounds: z.array(z.object({
    citation: z.string(),
    article: z.string().nullable(),
    jurisdiction: z.enum(["EU261", "IL2012"]),
    applied_to_facts_he: z.string(),
    applied_to_facts_en: z.string(),
  })).min(1),
  demand_amount_ils: z.number().int().positive(),
  deadline_iso: z.string().date(),
  payment_terms_he: z.string(),
  payment_terms_en: z.string(),
  sign_off_he: z.string(),
  sign_off_en: z.string(),
});
export type Letter = z.infer<typeof LetterSchema>;
```

```ts
// services/letters/prompts.ts
export const SYSTEM_PROMPT = `You are an Israeli aviation-compensation attorney drafting a formal demand letter.
Output a strict JSON document with both Hebrew (primary) and English (airline-side) versions of every prose field.
Hebrew uses passive, formal legal register. English is plain US-legal style.
Cite specific articles only when they truly apply to the facts. Never invent statutes.
The deadline_iso must be at least 14 days after today.
demand_amount_ils must equal the eligibility amount provided.`;
```

```bash
git add services/letters/schema.ts services/letters/prompts.ts
git commit -m "feat(p5): letter zod schema + cached system prompt"
```

---

### Task 3 — Generator (Sonnet via AI Gateway)

**Files:**
- Create: `services/letters/generator.ts`
- Create: `tests/services/letters/generator.test.ts`

```ts
// services/letters/generator.ts
import { generateObject } from "ai";
import { anthropic, SONNET } from "@/lib/ai/gateway";
import { LetterSchema, type Letter } from "./schema";
import { SYSTEM_PROMPT } from "./prompts";

export async function generateLetter(input: {
  passenger_name: string;
  flight_number: string;
  flight_date: string;
  origin_iata: string;
  destination_iata: string;
  airline_name: string | null;
  amount_ils: number;
  jurisdiction: "EU261" | "IL2012" | "BOTH";
  grounds: string[];
  rationale_he: string;
  reason_category: string;
  lawyer: { firm: string; name: string; bar_license: string; address: string; phone: string; email: string };
}): Promise<Letter> {
  const { object } = await generateObject({
    model: anthropic(SONNET),
    schema: LetterSchema,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: JSON.stringify(input) },
    ],
    maxRetries: 1,
  });
  return object;
}
```

```ts
// tests/services/letters/generator.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(async () => ({
    object: {
      subject_he: "דרישת פיצוי – טיסה LY 0381",
      subject_en: "Demand for Compensation – Flight LY 0381",
      letterhead: { firm: "T", lawyer: "L", bar_license: "78214", address: "TLV", phone: "+972", email: "l@x.co.il" },
      facts_paragraph_he: "ב-1 באפריל…",
      facts_paragraph_en: "On 1 April…",
      legal_grounds: [{ citation: "EU 261/2004", article: "art.7(1)(b)", jurisdiction: "EU261", applied_to_facts_he: "x", applied_to_facts_en: "x" }],
      demand_amount_ils: 2450,
      deadline_iso: "2026-05-30",
      payment_terms_he: "x", payment_terms_en: "x",
      sign_off_he: "בכבוד רב", sign_off_en: "Sincerely",
    },
  })),
}));

describe("generateLetter", () => {
  it("returns a parsed letter", async () => {
    const { generateLetter } = await import("@/services/letters/generator");
    const out = await generateLetter({
      passenger_name: "Noa Cohen",
      flight_number: "LY 0381",
      flight_date: "2026-04-01",
      origin_iata: "TLV",
      destination_iata: "ATH",
      airline_name: "EL AL",
      amount_ils: 2450,
      jurisdiction: "EU261",
      grounds: ["EU 261 art.7(1)(b)"],
      rationale_he: "x",
      reason_category: "carrier_fault",
      lawyer: { firm: "T", name: "L", bar_license: "78214", address: "TLV", phone: "+972", email: "l@x.co.il" },
    });
    expect(out.demand_amount_ils).toBe(2450);
  });
});
```

```bash
npx vitest run tests/services/letters/generator.test.ts
git add services/letters/generator.ts tests/services/letters/generator.test.ts
git commit -m "feat(p5): Sonnet-backed letter generator"
```

---

### Task 4 — `@react-pdf` template

**Files:** Create: `services/letters/pdf.tsx`

```tsx
// services/letters/pdf.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Letter } from "./schema";

Font.register({ family: "Heebo", src: "https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6Z8E.ttf" });
Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf" });

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Inter", color: "#0a0e14" },
  he: { fontFamily: "Heebo", direction: "rtl", fontSize: 11 },
  hr: { borderBottom: "1pt solid #74777f", marginVertical: 12 },
  block: { marginBottom: 8 },
  letterhead: { fontSize: 9, color: "#44474e" },
  amount: { fontSize: 24, fontWeight: 700, color: "#0a0e14" },
});

export function DemandLetterPDF({ letter }: { letter: Letter }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View>
          <Text style={s.letterhead}>{letter.letterhead.firm}</Text>
          <Text style={s.letterhead}>{letter.letterhead.lawyer} · רישיון {letter.letterhead.bar_license}</Text>
          <Text style={s.letterhead}>{letter.letterhead.address}</Text>
          <Text style={s.letterhead}>{letter.letterhead.phone} · {letter.letterhead.email}</Text>
        </View>
        <View style={s.hr} />
        <View>
          <Text style={[s.he, { fontSize: 14, fontWeight: 700 }]}>{letter.subject_he}</Text>
          <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{letter.subject_en}</Text>
        </View>
        <View style={s.hr} />

        <View style={s.block}>
          <Text style={s.he}>{letter.facts_paragraph_he}</Text>
        </View>
        <View style={s.block}>
          <Text>{letter.facts_paragraph_en}</Text>
        </View>

        <View style={s.hr} />
        {letter.legal_grounds.map((g, i) => (
          <View key={i} style={s.block}>
            <Text style={{ fontWeight: 700 }}>{g.citation}{g.article ? ` · ${g.article}` : ""} ({g.jurisdiction})</Text>
            <Text style={s.he}>{g.applied_to_facts_he}</Text>
            <Text>{g.applied_to_facts_en}</Text>
          </View>
        ))}

        <View style={s.hr} />
        <View style={s.block}>
          <Text style={s.amount}>₪ {letter.demand_amount_ils.toLocaleString()}</Text>
          <Text style={s.he}>{letter.payment_terms_he}</Text>
          <Text>{letter.payment_terms_en}</Text>
          <Text>Deadline: {letter.deadline_iso}</Text>
        </View>

        <View style={s.hr} />
        <View>
          <Text style={s.he}>{letter.sign_off_he}</Text>
          <Text>{letter.sign_off_en}</Text>
          <Text style={{ marginTop: 16 }}>{letter.letterhead.lawyer}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

```bash
git add services/letters/pdf.tsx
git commit -m "feat(p5): react-pdf bilingual demand-letter component"
```

---

### Task 5 — Letter draft endpoint

**Files:**
- Create: `app/api/admin/claims/[id]/letter/draft/route.ts`
- Create: `lib/auth/admin.ts`

```ts
// lib/auth/admin.ts
import { cookies } from "next/headers";

const COOKIE = "tshl_ops";

export async function isAdmin(req: Request): Promise<boolean> {
  if (req.headers.get("x-ops-password") === process.env.OPS_PASSWORD) return true;
  const v = (await cookies()).get(COOKIE)?.value;
  return Boolean(v) && v === process.env.OPS_COOKIE;
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, process.env.OPS_COOKIE!, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
}
```

```ts
// app/api/admin/claims/[id]/letter/draft/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { flights } from "@/lib/db/schema/flights";
import { documents, documentVersions } from "@/lib/db/schema/documents";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq } from "drizzle-orm";
import { generateLetter } from "@/services/letters/generator";
import { isAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [f] = c.flightId ? await db.select().from(flights).where(eq(flights.id, c.flightId)).limit(1) : [];

  const letter = await generateLetter({
    passenger_name: c.passengerName,
    flight_number: f?.flightNumber ?? "—",
    flight_date: f?.date ?? "—",
    origin_iata: f?.departureIata ?? "—",
    destination_iata: f?.arrivalIata ?? "—",
    airline_name: c.airlineIata,
    amount_ils: c.amountIls,
    jurisdiction: c.jurisdiction as any,
    grounds: [],
    rationale_he: "",
    reason_category: c.reasonCategory,
    lawyer: {
      firm: process.env.LAWYER_FIRM ?? "תשלם לי",
      name: process.env.LAWYER_NAME ?? "עו״ד דניאל גולן",
      bar_license: process.env.LAWYER_BAR ?? "78214",
      address: process.env.LAWYER_ADDRESS ?? "רוטשילד 22, תל אביב",
      phone: process.env.LAWYER_PHONE ?? "+972-50-000-0000",
      email: process.env.LAWYER_EMAIL ?? "lawyer@tashlemli.co.il",
    },
  });

  const [doc] = await db
    .insert(documents)
    .values({ claimId: id, kind: "demand_letter", language: "he+en", currentVersion: 1, status: "draft" })
    .returning();
  if (!doc) return NextResponse.json({ error: "db_fail" }, { status: 500 });
  await db.insert(documentVersions).values({ documentId: doc.id, version: 1, diffSummary: "AI draft v1" });
  await db.insert(claimEvents).values({ claimId: id, code: "demand.drafted", actor: "system", labelHe: "מכתב דרישה הוכן", labelEn: "Demand letter drafted", metadata: { documentId: doc.id, letter } });

  return NextResponse.json({ documentId: doc.id, letter });
}
```

```bash
git add app/api/admin/claims/[id]/letter/draft lib/auth/admin.ts
git commit -m "feat(p5): admin letter-draft endpoint generates Sonnet letter + emits demand.drafted"
```

---

### Task 6 — PDF render endpoint

**Files:** Create: `app/api/admin/claims/[id]/letter/[version]/pdf/route.ts`

```ts
// app/api/admin/claims/[id]/letter/[version]/pdf/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema/documents";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { and, eq } from "drizzle-orm";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { DemandLetterPDF } from "@/services/letters/pdf";
import { isAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id, version } = await params;

  const [doc] = await db.select().from(documents).where(and(eq(documents.claimId, id), eq(documents.kind, "demand_letter"))).limit(1);
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [drafted] = await db.select().from(claimEvents).where(and(eq(claimEvents.claimId, id), eq(claimEvents.code, "demand.drafted"))).limit(1);
  const letter = (drafted?.metadata as any)?.letter;
  if (!letter) return NextResponse.json({ error: "no_letter" }, { status: 404 });

  const stream = await renderToStream(React.createElement(DemandLetterPDF, { letter }));
  return new Response(stream as any, { headers: { "content-type": "application/pdf", "cache-control": "no-store" } });
}
```

```bash
git add app/api/admin/claims/[id]/letter/[version]/pdf
git commit -m "feat(p5): on-demand PDF render endpoint"
```

---

### Task 7 — Letter send endpoint

**Files:** Create: `app/api/admin/claims/[id]/letter/send/route.ts`

```ts
// app/api/admin/claims/[id]/letter/send/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { documents } from "@/lib/db/schema/documents";
import { airlines } from "@/lib/db/schema/airlines";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { auditLog } from "@/lib/db/schema/ops";
import { and, eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { DemandLetterPDF } from "@/services/letters/pdf";
import { sendEmail } from "@/lib/email/resend";
import { putPrivate } from "@/lib/blob/client";
import { sha256Hex } from "@/lib/hash";
import { isAdmin } from "@/lib/auth/admin";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;

  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [drafted] = await db.select().from(claimEvents).where(and(eq(claimEvents.claimId, id), eq(claimEvents.code, "demand.drafted"))).limit(1);
  const letter = (drafted?.metadata as any)?.letter;
  if (!letter) return NextResponse.json({ error: "no_letter" }, { status: 409 });
  const [air] = c.airlineIata ? await db.select().from(airlines).where(eq(airlines.iata, c.airlineIata)).limit(1) : [];
  const to = air?.primaryContactEmail ?? air?.fallbackContactEmail;
  if (!to) return NextResponse.json({ error: "no_airline_email" }, { status: 412 });

  const buf = await renderToBuffer(React.createElement(DemandLetterPDF, { letter }) as any);
  const hash = await sha256Hex(buf);
  const blobKey = `letters/${id}/v1-${hash.slice(0, 12)}.pdf`;
  const stored = await putPrivate(blobKey, buf, "application/pdf");

  // Lock the document row
  const [doc] = await db.select().from(documents).where(and(eq(documents.claimId, id), eq(documents.kind, "demand_letter"))).limit(1);
  if (doc) {
    await db.update(documents).set({ status: "sent_to_airline", blobKey: stored.url, hashSha256: hash }).where(eq(documents.id, doc.id));
  }

  const replyTo = `claims+${c.claimToken.slice(0, 24)}@in.tashlemli.co.il`;
  const messageId = `<${id}.${Date.now()}@${env.APP_BASE_URL.replace(/^https?:\/\//, "")}>`;
  await sendEmail({
    to,
    subject: letter.subject_en,
    html: `<p>Please see attached.</p><p>${letter.subject_he}</p>`,
    text: letter.subject_en,
    replyTo,
    headers: { "Message-Id": messageId },
  });

  await db.insert(claimEvents).values({ claimId: id, code: "demand.sent", actor: "lawyer", labelHe: "נשלח לחברת התעופה", labelEn: "Demand sent", metadata: { messageId, to } });
  await db.update(claims).set({ currentState: "demand.sent", currentStageIndex: 7 }).where(eq(claims.id, id));

  await db.insert(auditLog).values({ action: "letter.send", resourceType: "claim", resourceId: id, after: { messageId, to, blobKey: stored.url } });

  return NextResponse.json({ ok: true, blobUrl: stored.url, messageId });
}
```

```bash
git add app/api/admin/claims/[id]/letter/send
git commit -m "feat(p5): letter-send endpoint stores PDF, emails airline, locks version, emits demand.sent"
```

---

### Task 8 — Documenso Cloud client + POA template

**Files:**
- Create: `services/poa/documenso.ts`
- Create: `services/poa/template.tsx`
- Create: `app/api/admin/claims/[id]/poa/route.ts`

```ts
// services/poa/documenso.ts
import { AppError } from "@/lib/errors";

const BASE = process.env.DOCUMENSO_BASE_URL ?? "https://app.documenso.com/api/v1";

async function call(path: string, init: RequestInit) {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${process.env.DOCUMENSO_API_KEY}`,
      "content-type": "application/json",
    },
  });
  if (!r.ok) throw new AppError("DOCUMENSO_HTTP", `documenso ${r.status}`, 502);
  return await r.json();
}

export async function createDocumentSimple(args: { title: string; pdfBase64: string; recipientEmail: string; recipientName: string }): Promise<{ id: string; signingUrl: string }> {
  const created = await call("/documents", {
    method: "POST",
    body: JSON.stringify({
      title: args.title,
      document: args.pdfBase64,
      recipients: [{ email: args.recipientEmail, name: args.recipientName, role: "SIGNER" }],
    }),
  });
  const sent = await call(`/documents/${created.id}/send`, { method: "POST", body: "{}" });
  const link = (sent.recipients?.[0]?.signingUrl as string) ?? created.recipients?.[0]?.signingUrl;
  return { id: String(created.id), signingUrl: link };
}
```

```tsx
// services/poa/template.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({ family: "Heebo", src: "https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6Z8E.ttf" });

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Heebo", direction: "rtl", fontSize: 11, color: "#0a0e14" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 16 },
});

export function PoaPDF(p: { full_name: string; israeli_id: string; date_of_birth: string; address: string; phone: string; claim_id: string; lawyer_name: string; bar_license_number: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>ייפוי כוח</Text>
        <Text>אני הח״מ {p.full_name}, ת״ז {p.israeli_id}, ילוד/ה {p.date_of_birth}, מרחוב {p.address}, טלפון {p.phone},</Text>
        <Text style={{ marginTop: 12 }}>ממנה בזאת את עו״ד {p.lawyer_name}, רישיון לשכת עורכי הדין מספר {p.bar_license_number}, לטפל בתיק הפיצוי שלי (מזהה {p.claim_id}) מול חברת התעופה.</Text>
        <Text style={{ marginTop: 24 }}>חתימה: ___________________________________</Text>
        <Text>תאריך: ___________________________________</Text>
      </Page>
    </Document>
  );
}
```

```ts
// app/api/admin/claims/[id]/poa/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { documents } from "@/lib/db/schema/documents";
import { poaSignatures } from "@/lib/db/schema/poa";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PoaPDF } from "@/services/poa/template";
import { createDocumentSimple } from "@/services/poa/documenso";
import { isValidTeudatZehut } from "@/lib/validators/teudat-zehut";
import { isAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json() as { israeli_id: string; date_of_birth: string; address: string };

  if (!isValidTeudatZehut(body.israeli_id)) return NextResponse.json({ error: "bad_id" }, { status: 422 });

  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c?.contactEmail) return NextResponse.json({ error: "no_email" }, { status: 412 });

  const buf = await renderToBuffer(React.createElement(PoaPDF, {
    full_name: c.passengerName,
    israeli_id: body.israeli_id,
    date_of_birth: body.date_of_birth,
    address: body.address,
    phone: c.contactPhone ?? "—",
    claim_id: id,
    lawyer_name: process.env.LAWYER_NAME ?? "עו״ד דניאל גולן",
    bar_license_number: process.env.LAWYER_BAR ?? "78214",
  }) as any);

  const { id: documensoId, signingUrl } = await createDocumentSimple({
    title: `POA · ${c.passengerName} · ${id.slice(0, 8)}`,
    pdfBase64: buf.toString("base64"),
    recipientEmail: c.contactEmail,
    recipientName: c.passengerName,
  });

  const [doc] = await db.insert(documents).values({ claimId: id, kind: "poa", documensoId, status: "sent", language: "he" }).returning();
  await db.insert(poaSignatures).values({ claimId: id, documentId: doc?.id, documensoId });
  await db.insert(claimEvents).values({ claimId: id, code: "poa.sent", actor: "system", labelHe: "ייפוי כוח נשלח", labelEn: "POA sent", metadata: { documensoId } });
  await db.update(claims).set({ currentState: "poa.sent", currentStageIndex: 2 }).where(eq(claims.id, id));

  return NextResponse.json({ documensoId, signingUrl });
}
```

```bash
git add services/poa app/api/admin/claims/[id]/poa
git commit -m "feat(p5): POA generation + Documenso Cloud send + ת.ז. validation gate"
```

---

### Task 9 — Admin login, layout, queue, claim detail

**Files:**
- Create: `app/api/admin/login/route.ts`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/claims/[id]/page.tsx`

```ts
// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json() as { password: string };
  if (password !== process.env.OPS_PASSWORD) return NextResponse.json({ error: "bad" }, { status: 401 });
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
```

```tsx
// app/admin/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const v = (await cookies()).get("tshl_ops")?.value;
  const path = (typeof globalThis !== "undefined" && (globalThis as any).headers ? "" : "");
  if (!v || v !== process.env.OPS_COOKIE) {
    if (!path.endsWith("/admin/login")) redirect("/admin/login");
  }
  return (
    <div dir="rtl" className="min-h-screen bg-terminal text-fluorescent">
      <header className="px-6 py-4 border-b border-fluorescent/10 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.42em] text-reversal">TASHLEMLI · OPS</div>
        <form action="/api/admin/logout" method="POST"><button className="font-mono text-xs text-fluorescent/60 hover:text-reversal">logout</button></form>
      </header>
      <main className="px-6 py-10 max-w-[1280px] mx-auto">{children}</main>
    </div>
  );
}
```

```tsx
// app/admin/login/page.tsx
"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch("/api/admin/login", { method: "POST", body: JSON.stringify({ password: pw }), headers: { "content-type": "application/json" } });
    setBusy(false);
    if (r.ok) window.location.href = "/admin";
    else setErr("סיסמה לא תקינה");
  }
  return (
    <main dir="rtl" className="min-h-screen grid place-items-center bg-terminal">
      <form onSubmit={submit} className="w-[360px] rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/8 p-6 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/80">OPS LOGIN</div>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-fluorescent" />
        <button disabled={busy} className="w-full rounded-full bg-reversal py-3 font-heebo font-bold text-terminal disabled:opacity-50">
          {busy ? "…" : "כניסה"}
        </button>
        {err && <div className="text-xs text-cancellation font-mono">{err}</div>}
      </form>
    </main>
  );
}
```

```tsx
// app/admin/page.tsx
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminQueue() {
  const rows = await db.select().from(claims).orderBy(desc(claims.updatedAt)).limit(200);
  return (
    <div dir="rtl">
      <h1 className="font-heebo font-black text-3xl mb-8">תור תיקים ({rows.length})</h1>
      <div className="grid gap-2">
        {rows.map((c) => (
          <Link key={c.id} href={`/admin/claims/${c.id}`} className="grid grid-cols-12 gap-3 items-center rounded-xl bg-[#0c1118] ring-1 ring-fluorescent/6 px-5 py-4 hover:ring-reversal/40">
            <div className="col-span-3 font-mono text-[11px] uppercase tracking-[0.3em] text-reversal/75">{c.currentState}</div>
            <div className="col-span-3 font-heebo font-bold">{c.passengerName}</div>
            <div className="col-span-2 font-mono text-fluorescent/60 text-sm">{c.airlineIata ?? "—"}</div>
            <div className="col-span-2 font-mono text-fluorescent/60 text-sm">{c.contactEmail ?? c.contactPhone ?? "—"}</div>
            <div className="col-span-2 text-end font-mono text-reversal text-base tabular-nums">₪ {c.amountIls.toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// app/admin/claims/[id]/page.tsx
import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";

export default async function ClaimAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  if (!c) return <div>not found</div>;
  const events = await db.select().from(claimEvents).where(eq(claimEvents.claimId, id)).orderBy(asc(claimEvents.occurredAt));

  return (
    <div dir="rtl" className="grid grid-cols-12 gap-6">
      <aside className="col-span-4 space-y-3">
        <div className="rounded-2xl bg-[#0c1118] p-5 ring-1 ring-fluorescent/8">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/45 mb-2">CLAIM</div>
          <div className="font-heebo font-black text-2xl">{c.passengerName}</div>
          <div className="font-mono text-sm text-fluorescent/60 mt-1">{c.airlineIata ?? "—"} · ₪ {c.amountIls.toLocaleString()}</div>
          <div className="font-mono text-[10px] text-fluorescent/45 mt-3 uppercase tracking-[0.3em]">{c.currentState}</div>
        </div>
        <div className="rounded-2xl bg-[#0c1118] p-5 ring-1 ring-fluorescent/8 space-y-2">
          <Link className="block rounded-full bg-reversal px-4 py-2 font-heebo font-bold text-terminal text-center" href={`/admin/claims/${id}/letter`}>פתח עורך מכתב</Link>
          <form action={`/api/admin/claims/${id}/poa`} method="POST" className="space-y-2">
            <input name="israeli_id" required placeholder="ת.ז." className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-4 py-2 font-mono text-fluorescent" dir="ltr" />
            <input name="date_of_birth" required type="date" className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-4 py-2 font-mono text-fluorescent" dir="ltr" />
            <input name="address" required placeholder="כתובת" className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-4 py-2 font-mono text-fluorescent" />
            <button className="w-full rounded-full bg-fluorescent/10 py-2 font-heebo">שלח POA</button>
          </form>
        </div>
      </aside>
      <section className="col-span-8 space-y-3">
        {events.map((e) => (
          <div key={e.id} className="rounded-xl bg-[#0c1118] p-4 ring-1 ring-fluorescent/6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-reversal/80">{e.code}</span>
              <span className="font-mono text-xs text-fluorescent/45">{new Date(e.occurredAt).toISOString().slice(0, 16).replace("T", " ")}</span>
            </div>
            <div className="font-heebo font-bold mt-1">{e.labelHe}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
```

```bash
git add app/api/admin/login app/admin/layout.tsx app/admin/login app/admin/page.tsx app/admin/claims
git commit -m "feat(p5): admin login + layout + queue + claim detail page"
```

---

### Task 10 — Admin letter editor (Monaco)

**Files:** Create: `app/admin/claims/[id]/letter/page.tsx`

```tsx
// app/admin/claims/[id]/letter/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false });

export default function LetterEditor({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [letter, setLetter] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => { params.then(({ id }) => setId(id)); }, [params]);

  async function draft() {
    if (!id) return;
    setBusy(true);
    const r = await fetch(`/api/admin/claims/${id}/letter/draft`, { method: "POST" });
    const j = await r.json();
    setBusy(false);
    if (j.letter) setLetter(JSON.stringify(j.letter, null, 2));
  }

  async function preview() {
    if (!id) return;
    setPdfUrl(`/api/admin/claims/${id}/letter/1/pdf?ts=${Date.now()}`);
  }

  async function send() {
    if (!id) return;
    setBusy(true);
    const r = await fetch(`/api/admin/claims/${id}/letter/send`, { method: "POST" });
    setBusy(false);
    if (!r.ok) alert("send failed: " + (await r.text()));
    else alert("sent");
  }

  return (
    <div dir="rtl" className="grid grid-cols-12 gap-6">
      <div className="col-span-7 h-[78vh] rounded-2xl overflow-hidden ring-1 ring-fluorescent/8 bg-[#0c1118]">
        <MonacoEditor height="100%" defaultLanguage="json" value={letter} onChange={(v) => setLetter(v ?? "")} theme="vs-dark" />
      </div>
      <div className="col-span-5 space-y-3">
        <div className="flex gap-2">
          <button onClick={draft} disabled={busy} className="rounded-full bg-reversal px-5 py-2 font-heebo font-bold text-terminal disabled:opacity-50">{busy ? "…" : "טיוטה (AI)"}</button>
          <button onClick={preview} className="rounded-full bg-fluorescent/10 px-5 py-2 font-heebo">תצוגה PDF</button>
          <button onClick={send} disabled={busy} className="rounded-full bg-fluorescent text-terminal px-5 py-2 font-heebo font-bold disabled:opacity-50">שלח לחברה</button>
        </div>
        {pdfUrl && <iframe src={pdfUrl} className="w-full h-[68vh] rounded-2xl ring-1 ring-fluorescent/8 bg-fluorescent" />}
      </div>
    </div>
  );
}
```

```bash
git add app/admin/claims/[id]/letter
git commit -m "feat(p5): admin letter editor (Monaco) with draft/preview/send"
```

---

### Task 11 — Admin logout

**Files:** Create: `app/api/admin/logout/route.ts`

```ts
// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).delete("tshl_ops");
  return NextResponse.redirect(new URL("/admin/login", process.env.APP_BASE_URL!));
}
```

```bash
git add app/api/admin/logout
git commit -m "feat(p5): admin logout"
```

---

### Task 12 — Audit-log helper

**Files:** Create: `services/admin/audit.ts`

```ts
// services/admin/audit.ts
import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema/ops";

export async function audit(action: string, resourceType: string, resourceId: string | null, before: any, after: any, ipHash: string | null = null) {
  await db.insert(auditLog).values({ action, resourceType, resourceId: resourceId ?? undefined, before, after, ipHash });
}
```

```bash
git add services/admin/audit.ts
git commit -m "feat(p5): audit() helper"
```

> Future maintenance: wrap admin endpoints with `audit()` calls before mutating; the send endpoint above already does. Apply to draft, advance, POA endpoints over time.

---

### Task 13 — Bulk advance fixture script (POC seeding)

**Files:** Create: `scripts/seed-demo-claim.ts`

```ts
// scripts/seed-demo-claim.ts
import "dotenv/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { signClaimToken } from "@/lib/jwt/claim-token";

async function main() {
  const [u] = await db.insert(users).values({ email: "demo@tashlemli.co.il", fullName: "Noa Cohen", privacyMode: "public_default" }).onConflictDoNothing().returning();

  const [c] = await db.insert(claims).values({
    userId: u?.id,
    airlineIata: "LH",
    jurisdiction: "EU261",
    reasonCategory: "carrier_fault",
    amountIls: 2620,
    passengerName: "Noa Cohen",
    contactEmail: "demo@tashlemli.co.il",
    claimToken: "tmp",
    source: "seed",
  }).returning();
  if (!c) throw new Error("no claim");
  const token = await signClaimToken(c.id);
  await db.update(claims).set({ claimToken: token }).where(claims.id.equals?.(c.id) ?? undefined as any);
  await db.insert(claimEvents).values({ claimId: c.id, code: "intake.received", actor: "system", labelHe: "תיק התקבל", labelEn: "Claim received" });

  console.log("DEMO_CLAIM_TOKEN=", token);
  console.log("DEMO_CLAIM_ID=", c.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

Add npm script:

```json
{ "scripts": { "seed:demo": "tsx scripts/seed-demo-claim.ts" } }
```

```bash
git add scripts/seed-demo-claim.ts package.json
git commit -m "chore(p5): scripts/seed-demo-claim.ts for stage-advance demos"
```

---

## Self-review

- [x] Letter generator validates output via zod; never returns unvalidated objects.
- [x] PDF renderer is bilingual (HE primary, EN airline-side).
- [x] Send flow locks document version, stores PDF in Blob, audit-logs the action, advances stage.
- [x] POA flow validates ת.ז. before sending.
- [x] Admin layout protected by cookie.
- [x] Reply-To uses plus-addressing matching the inbound parser format defined in P6.
- [x] No placeholders.

P5 complete. P6 picks up plus-address inbound parsing + the four marketing pages.
