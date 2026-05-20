# Tashlemli · תשלם לי

> A flight-compensation platform for the Israeli market, designed and built end-to-end as a portfolio project. Hebrew-native, RTL-first, cinematic. Built on Next.js 16 + Vercel.

[![Built on Vercel](https://img.shields.io/badge/Built_on-Vercel-000?logo=vercel)](https://vercel.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-53_passing-brightgreen)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

---

## What this is

Tashlemli (Hebrew for "pay me") is a consumer-facing legal-tech product: passengers whose flights were cancelled or delayed upload a boarding pass and watch the eligible compensation amount materialize in real time. A single lawyer of record then files the claim against the airline; the user can share a public link to a cinematic tracker showing the claim's progress.

This repository contains the full system &mdash; landing page, eligibility funnel, public tracker, claimant dashboard, lawyer ops console, demand-letter generator, and inbound airline-mailbox parser &mdash; built as a single Next.js application deployable to Vercel.

The README is structured for engineering review. The architecture decisions, trade-offs, and intentional scope cuts are documented inline.

---

## Demo

- **Production:** [tashlemli-elirap1s-projects.vercel.app](https://tashlemli-elirap1s-projects.vercel.app) &mdash; if the page is gated behind a Vercel auth screen, deployment protection is still on; toggle it off in the project's _Settings &rarr; Deployment Protection_ panel for a public demo.
- **Landing tour:** scroll the hero, watch the departures board reverse from `CANCELED` to `ON TIME`, the floating shekel coin, the verdict-style competitor comparison, and the pinned How-It-Works horizontal scroll.
- **Eligibility funnel:** `/check` → drop any JPEG (boarding pass), or click one of four quick-pick chips, or type a flight number + date. Within ~2&nbsp;s the system returns the entitlement amount and grounds.
- **Cinematic tracker:** `/claim/<token>` &mdash; public, signed, sharable. Real-time event stream over SSE. Schematic map shows the claim flying back from the airline HQ to the passenger.

---

## The problem

The Israeli flight-compensation market is dominated by global services (AirHelp, Compensair, Skycop) that take 35&ndash;50% commission, treat Hebrew as a translated afterthought, and have no specialty for war-related cancellations &mdash; the most common claim type in Israel since October 2023. Israeli law (חוק שירותי תעופה התשע"ב-2012) actually grants stronger consumer protections than EU 261 in several scenarios, but global platforms ignore it.

## The product thesis

Four "wedges," each a category-of-one feature relative to the competition:

| Wedge | What it does |
|---|---|
| **A &mdash; File-to-Claim** | User uploads a boarding pass photo. Claude Haiku extracts flight number / date / passenger via OCR. Flight status is fetched and validated. The system computes the exact ₪ entitlement and displays it cinematically &mdash; no form filling. |
| **B &mdash; WhatsApp-Native Operator** | (Phase 2.) Status, Q&A, eSign, and payout flow through WhatsApp Business API. The web is the funnel; WhatsApp is the product. |
| **C &mdash; Cinematic Live Tracker** | Public, signed-URL claim page where anyone with the link watches the claim travel on a schematic Mediterranean / EU map in real time, with per-stage reveal animations. Open-Graph card per claim drives social sharing. |
| **D &mdash; AI Counsel** | Claude Sonnet drafts the airline-specific demand letter from claim facts. Lawyer reviews and sends. Hebrew + English bilingual PDF rendered with `@react-pdf/renderer`. |

---

## Tech stack

```
Next.js 16 App Router · React 19 · TypeScript (strict)
Tailwind 3 · Motion 12 (Framer Motion) · @react-pdf/renderer
Drizzle ORM · Postgres (Neon) · Upstash Redis (rate limiting)
Vercel Blob (private file storage)
Vercel AI Gateway → Anthropic (Claude Haiku for OCR + classification, Sonnet for letters)
Resend (transactional + inbound email parsing)
Documenso Cloud (eSign for Powers of Attorney)
jose (JWT) · zod (runtime schema validation)
Vitest · Playwright
```

All backend code runs on Vercel Functions (Fluid Compute, Node.js 24). No traditional servers.

---

## Architecture highlights

### Event-sourced claim ledger

Every state transition is a row in `claim_events`. The current state is denormalized on `claims.current_state` for fast list views, but the events table is the source of truth. A Postgres trigger emits `pg_notify('claim_events', claim_id)` on insert; the SSE endpoint subscribes via `LISTEN/NOTIFY` to push live updates to the public tracker.

```sql
create function notify_claim_event() returns trigger as $$
begin
  perform pg_notify('claim_events', new.claim_id::text);
  return new;
end $$ language plpgsql;
create trigger claim_events_notify
  after insert on claim_events
  for each row execute function notify_claim_event();
```

15 lifecycle stages: `intake.received` → `poa.sent` → `poa.signed` → `evidence.collected` → `demand.drafted` → `demand.reviewed` → `demand.sent` → `airline.delivered` → `airline.replied` → `negotiation.open` → `settlement.offered` → `settlement.accepted` → `payout.requested` → `payout.complete` → `claim.closed`.

### File-to-Claim pipeline

```
POST /api/eligibility/upload  (multipart, with EXIF strip + SHA-256 dedupe)
  → Vercel Blob (private)
  → INSERT eligibility_jobs
  → Run pipeline inline (Vercel kills detached async work)
       extract  (Haiku via AI Gateway, structured output via zod)
       lookup   (AviationStack adapter with 30-day Postgres cache, stub fallback)
       compute  (pure deterministic engine, table-driven by case-law fixtures)
  → publishJobEvent('ready')
GET /api/eligibility/[jobId]/sse  (replay + LISTEN tail, heartbeat 25s)
```

The eligibility engine is a **pure function** unit-tested against a 19-case fixture matrix covering EU 261 distance buckets, IL Aviation Services Law thresholds, war-related branches (where IL law overrides "extraordinary circumstances"), and statute-of-limitations rejections.

### Cinematic public tracker

`/claim/[token]` validates an HS256 JWT (`{ claim_id, exp: +90d }`), redacts PII based on `users.privacy_mode` (default = `anonymous`), then streams claim events over SSE. The schematic SVG map projects EU + IL coordinates with a custom equirectangular projection; reverse-flight arcs draw via animated `stroke-dashoffset`; per-event reveal animations dispatch from `<EventReveal>` (envelope flights, settlement counters, the shekel coin landing on `payout.complete`).

Open-Graph cards are server-rendered per claim via `@vercel/og`, edge-cached on the `(claim_id, current_state)` tuple.

### Privacy default = anonymous

A spec-audit finding before implementation: defaulting public-facing claim links to "Noa K." (first name + last initial) creates real privacy risk in Israel's small flight-compensation community. The default was flipped to `anonymous` (label: "נוסע/ת ישראלי/ת"). Toggling to public mode is opt-in via `/me/settings`. **Tightening privacy mode re-mints the user's claim tokens** so old shared links die instead of leaking historical state.

### AI Counsel: structured generation, not free-form

Demand letters are generated via `generateObject` (AI SDK) against a strict zod schema covering subject, letterhead, facts, legal grounds with per-citation rationale, demand amount, deadline, payment terms, and sign-off &mdash; in Hebrew (primary) and English (airline-side) side-by-side. The model never returns prose that bypasses validation. Lawyer review is mandatory before send.

### Inbound mailbox

Demand letters are sent with `Reply-To: claims+<short-token>@in.tashlemli.co.il`. Resend Inbound parses incoming mail and posts to `/api/webhooks/airline-mailbox`. The matcher resolves the claim by **plus-address OR `Message-Id` / `In-Reply-To` headers** &mdash; necessary because some enterprise mail systems (Microsoft Exchange) strip plus-addresses. Replies are classified by Haiku (`acknowledged | denied | info_requested | settlement_offered | auto_reply | unrelated`); automated acknowledgements are flagged so they don't falsely advance the tracker stage.

### Lazy env validation

`lib/env.ts` defines a strict zod schema for required environment variables. The exported `env` is a Proxy that defers evaluation to first property access, so module-load code in tests doesn't trip the validator before `tests/setup.ts` runs. During `NEXT_PHASE=phase-production-build`, the Proxy returns shape-valid placeholders (URL fields → `https://stub.example.com`, etc.) so Vercel's page-data collection succeeds without env vars set; strict validation runs only at runtime.

---

## Project structure

```
app/
  page.tsx                    Cinematic landing page (Hero, AreYouOwed, Calculator, ...)
  about/, how-it-works/, pricing/, war/    Marketing pages, RTL Hebrew
  check/                      Wedge A: drop zone + cinematic reveal
  claim/[token]/              Wedge C: public live tracker (SSE)
  me/, me/settings/           Claimant dashboard + privacy toggle
  admin/                      Lawyer ops console (queue, claim, letter editor, inbox, paste-reply mock)
  auth/verify/                Magic-link landing
  api/
    eligibility/              upload | manual | sse | claim (promote)
    sse/claim/[token]/        Public tracker stream
    og/claim/[token]/         Open-Graph image (dynamic)
    auth/                     request | verify | session | logout
    me/privacy/               Privacy-mode toggle (re-mints claim tokens)
    admin/                    login | logout | claims/[id]/{advance, letter, poa, paste-reply}
    webhooks/                 airline-mailbox | email-delivered | email-bounced | esign
    cron/purge-orphan-jobs/   Daily Vercel Cron (14d retention)
    health/

components/
  Hero, AreYouOwed, Calculator, HowItWorks, WarCancellations, VsOthers,
  Testimonials, Trust, FAQ, FinalCTA, Footer       Landing sections
  SplitFlapBoard, ShekelCoin, CinematicSurface,
  BoardingPassCTA, ReverseTypeText, Globe          Shared cinematic primitives
  check/                      UploadDropZone, ProcessingPipeline, RevealStage,
                              ContactCaptureSheet, ManualFallbackForm, QuickRoutes
  tracker/                    TrackerMap, TrackerHud, TrackerTimeline, EventReveal
  me/, auth/, marketing/      Dashboard / login / shell components

services/
  eligibility/                engine.ts (pure), engine.fixtures.ts (19 cases),
                              extract.ts, lookup.ts, runner.ts, publish.ts, types.ts
  flights/aviationstack.ts    Adapter + deterministic stub fallback
  letters/                    schema.ts, prompts.ts, generator.ts (Sonnet), pdf.tsx (react-pdf)
  poa/                        documenso.ts, template.tsx (HE PDF)
  claims/promote.ts           eligibility_job → claim row + first claim_event
  inbound/                    parser.ts (mailparser), classifier.ts (Haiku), match.ts
  tracker/                    publicView.ts (redaction), airlineHq.ts
  admin/audit.ts              audit_log helper
  auth/                       magic-link.ts, session.ts, re-mint-claim-tokens.ts

lib/
  db/                         Drizzle client (lazy) + schema (15 tables, all snake_case)
  jwt/                        claim-token.ts, session-token.ts (separate secrets, distinct audiences)
  ai/gateway.ts               Anthropic provider via Vercel AI Gateway
  email/resend.ts             Resend wrapper + magic-link template
  blob/client.ts              Vercel Blob private store
  rate-limit.ts               Upstash token-bucket
  hash.ts                     sha256, ip-hash
  validators/teudat-zehut.ts  Israeli ID Luhn-like checksum
  errors.ts                   Typed AppError
  auth/                       requireUser, isAdmin
  env.ts                      Lazy zod-validated env
  turnstile.ts                Cloudflare Turnstile verify

db/migrations/                Drizzle-generated SQL + manual triggers

emails/magicLinkEmail.tsx     React Email template (Hebrew, RTL)

scripts/
  seed-demo-claim.ts          Insert a demo claim, print tracker token
  install-triggers.ts         Install pg_notify triggers on a fresh Neon DB

tests/
  lib/, services/, api/, e2e/

docs/superpowers/
  specs/2026-05-05-tashlemli-platform-design.md     Full design document
  plans/2026-05-05-p1-foundation.md                 Implementation plan, P1
  plans/2026-05-05-p2-wedge-a-file-to-claim.md      P2
  plans/2026-05-05-p3-auth-dashboard.md             P3
  plans/2026-05-05-p4-tracker.md                    P4
  plans/2026-05-05-p5-letters-admin.md              P5
  plans/2026-05-05-p6-content-inbound.md            P6

stitch/                       Original Stitch (Google Labs) design exports
```

---

## Local setup

### Prerequisites

- Node.js 22 or 24
- A Postgres database (Neon free tier recommended; the lazy stub-mode lets the build run without one)
- Vercel CLI (optional but recommended)

### Quick start

```bash
git clone https://github.com/eliRap1/Tashlemli.git
cd Tashlemli
npm install
cp .env.example .env.local        # then fill the values
npm run db:push                   # apply Drizzle schema to Postgres
npx tsx scripts/install-triggers.ts   # add pg_notify triggers on claim_events + job_events
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Source |
|---|---|---|
| `DATABASE_URL` | yes | Neon (Vercel Marketplace) |
| `JWT_CLAIM_SECRET` | yes | 32+ random chars |
| `JWT_SESSION_SECRET` | yes | 32+ random chars |
| `APP_BASE_URL` | yes | `http://localhost:3000` or production URL |
| `OPS_PASSWORD` / `OPS_COOKIE` | yes (admin) | 32+ random chars |
| `BLOB_READ_WRITE_TOKEN` | optional | Vercel Blob (auto-injected when integration is connected) |
| `AI_GATEWAY_API_KEY` / `AI_GATEWAY_BASE_URL` | optional | Vercel AI Gateway |
| `RESEND_API_KEY` / `RESEND_FROM` | optional (no auth emails without it) | Resend |
| `AVIATIONSTACK_KEY` | optional (stub data without it) | aviationstack.com |
| `DOCUMENSO_API_KEY` / `DOCUMENSO_BASE_URL` | optional (no POA flow without it) | Documenso Cloud |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | optional (no rate limiting without it) | Upstash |

The system runs in **stub mode** for any service whose key isn't set, so the demo flow works on a fresh Vercel + Neon project alone.

### Useful commands

```bash
npm run dev          # Next.js dev with Turbopack
npm run build        # Production build (works without env via the build-phase Proxy)
npm test             # Vitest run (53 tests across 19 files)
npm run db:push      # Apply Drizzle schema
npm run db:studio    # Drizzle Studio UI
npm run seed:demo    # Insert a demo claim, print tracker URL
```

---

## Engineering decisions worth noting

- **Plan-then-build, not vibe-build.** A 14-section design spec was written first, audited red/amber/yellow for failure modes (privacy default, statute-of-limitations gap, AviationStack quota, Hobby ToS, Israeli compliance), and only then broken into six implementation plans (P1 → P6, ~6,700 lines of plan content). Each plan was executed by a fresh subagent with spec-compliance + code-quality reviews per phase. The plans are in `docs/superpowers/`.
- **Pure eligibility engine.** The `compute()` function takes typed input and returns typed output with zero I/O. War-related cases are hardcoded into the IL branch (not LLM-decided) because the legal logic must be deterministic.
- **Inline pipelines on Vercel.** The original design used fire-and-forget `void runJob(...)`, which Vercel Functions cancel after the response. Switched to inline `await` so the work completes within the function lifetime; clients still subscribe to SSE for replay if they want the cinematic stage-by-stage UX.
- **Privacy redaction at view time.** A single `users.privacy_mode` value drives both the public tracker and the OG card. Tightening from public to anonymous re-mints all of the user's claim tokens, expiring previously-shared links instead of leaking redacted-after-the-fact state.
- **No traditional auth library.** Magic-link via Resend, sessions in Postgres, JWT cookie. ~120 lines of auth code. No vendor lock-in, no NextAuth abstraction overhead.
- **Cinematic but accessible.** All Motion animations honor `prefers-reduced-motion` (defined in `app/globals.css`).
- **Stub modes are first-class.** AviationStack, Turnstile, and AI Gateway each have deterministic stub fallbacks. Demo runs end-to-end on Hobby tier with no paid keys.

---

## Scaling considerations

The current stack is sized for portfolio demo + low-traffic launch on the Vercel Hobby / Neon free tier. The two primitives that constrain it at scale are documented here so a reviewer doesn't have to derive them from the code.

| Primitive | Limit | Mitigation when it bites |
|---|---|---|
| **SSE + LISTEN/NOTIFY** | Each connected tracker holds one Vercel Function instance + one direct (unpooled) Neon connection. Neon free-tier compute caps direct connections; Vercel Active CPU bills idle SSE time. | Swap the public tracker SSE for a fanout service (Ably, Pusher, or Supabase Realtime). The `pg_notify` trigger stays; only the consumer changes. Triggered when concurrent trackers exceed ~50. |
| **Eligibility pipeline** | Runs inline inside the upload request (Vercel kills detached async work). Bound by `maxDuration = 60s`. | Move pipeline behind a Vercel Queue (public beta) when median runtime crosses ~15s. Client SSE replay path already exists for async resumption. |
| **AviationStack quota** | Free tier = 100 lookups / month. | 30-day Postgres cache already in place. When real traffic ramps, swap adapter to Cirium / OAG (paid). The interface is one file: `services/flights/aviationstack.ts`. |
| **Magic-link rate limit** | Upstash free tier = 10k requests / day. | Sufficient until ~1k DAU. Upgrade or move to Redis on Fly. |

The architecture choice to make: SSE+LISTEN/NOTIFY is the right tool for a demo (zero infra, perfect latency, ~120 lines), the wrong tool past low triple-digit concurrent connections. Documented here so the trade is visible.

---

## Status & scope

**What works** (53 passing tests, full Vercel build green):

- All 6 public pages (RTL Hebrew, custom typography pair Heebo + Mona Sans + JetBrains Mono).
- File-to-claim end-to-end: drop → OCR → flight lookup → eligibility → reveal → contact capture → claim row.
- Cinematic public tracker with SSE replay + per-event animations + OG card.
- Magic-link auth + claimant dashboard + privacy toggle with token re-mint.
- Demand letter generation (Sonnet) → bilingual PDF → admin Monaco editor → "send to airline" via Resend.
- POA via Documenso Cloud + Israeli ID checksum gate.
- Inbound mailbox webhook (Resend Inbound) with Haiku classifier + plus-address-or-Message-Id matcher.
- Admin queue + claim detail + paste-reply mock.

**Deliberately deferred** (documented in the spec audit):

- WhatsApp Business API (Phase 2)
- Real KYC vendor (manual ת.ז. validation only for POC)
- Real money payouts via Bit Business API (Phase 3)
- Israeli legal entity, VAT registration, accountant, professional liability insurance &mdash; everything that turns the software into an actual law practice.

This is a **portfolio POC**, not an operating business. The architecture supports launching, but launching requires the legal infrastructure listed above.

---

## Testing

```bash
npm test
```

```
Test Files  19 passed (19)
Tests       53 passed (53)
Duration    ~2s
```

Coverage areas:
- Pure functions: eligibility engine (19 fixture cases), Israeli ID validator, JWT round-trip + tampering + expiry, sha256.
- Integration: upload route (with mocked Blob, AI, AviationStack), promote-job-to-claim, magic-link issue + consume, sessions, inbound webhook classifier, eligibility runner orchestrator.
- E2E (Playwright specs included; not run in CI by default): check-flow happy path, tracker SSE stage-advance.

---

## Author

Built solo. Roughly two weeks of design + implementation. The interesting parts &mdash; event sourcing, the schematic-map tracker, the AI letter pipeline, the privacy redaction model, the spec audit identifying the eight red-flag failure modes before any code was written &mdash; are mine. Happy to walk through any of them in detail.

**Eli Rap** &mdash; eli08rap@gmail.com &mdash; [github.com/eliRap1](https://github.com/eliRap1)

---

## License

MIT. See [LICENSE](./LICENSE).
