# TASHLEMLI · Platform Design Spec

**Status:** approved (brainstorm complete, awaiting plan)
**Author:** brainstorming session 2026-05-05
**Scope:** complete consumer-facing platform + backend for Tashlemli (תשלם לי), an Israeli flight-compensation advocacy service. Replaces an earlier landing-only build.

---

## 1. Product thesis

Tashlemli converts cancelled and delayed flights into paid-back compensation for Israeli passengers. The platform must outperform global competitors (AirHelp, Compensair, Skycop) on four wedges, all built simultaneously:

1. **Wedge A · Instant Eligibility / File-to-Claim** — user uploads boarding pass; system extracts, validates, and reveals the exact ₪ entitlement in 2-3 seconds before any form is filled.
2. **Wedge B · WhatsApp-Native Operator** — intake, status, eSign and payout flow through WhatsApp Business API. *Deferred to Phase 2.* MVP uses email magic-link.
3. **Wedge C · Cinematic Live Tracker** — every claim has a public, signed URL where visitors watch the claim move on a schematic map of airline correspondence in real time.
4. **Wedge D · AI Counsel** — Claude Sonnet drafts an airline-specific demand letter from claim facts; lawyer reviews and sends.

The product wedge that compounds the others is the **Cinematic Live Tracker**: a public, shareable artifact built on top of an event-sourced claim ledger. AirHelp cannot copy this without rebuilding their data model. Open-graph cards generated per claim drive viral acquisition.

Hebrew is native to the system, not translated. Right-to-left layout is part of the aesthetic, not an accommodation.

## 2. Constraints and non-goals

- **Israeli market.** All UX defaults to Hebrew. Israeli legal grounds (חוק שירותי תעופה 2012) are first-class alongside EU 261. War-cancellations (post October 2023) get a dedicated branch in the eligibility engine and a dedicated marketing page.
- **Lean infrastructure.** MVP runs on free / minimal-paid tiers (~$15-25/mo). Code structure remains production-grade; only infra cost is reduced. We do not introduce architectural shortcuts (e.g., skipping event sourcing) to save dollars.
- **No native WhatsApp in MVP.** WhatsApp Business API integration is fully designed but builds in Phase 2. Phase 0/1 surfaces a `wa.me` link to a human-staffed number.
- **No automated payouts in MVP.** Lawyer of record manually wires settled funds to claimant. Bit Business API integration is Phase 3.
- **No automated KYC in MVP.** Israeli ID number (תעודת זהות) is captured + check-digit-validated; full KYC vendor (AU10TIX) is Phase 3.
- **Single lawyer of record at launch.** Schema supports multiple ops users from day one but operations target one bar-licensed attorney.

## 3. Architecture

### 3.1 Stack

| Concern | Choice | Tier |
|---|---|---|
| Hosting | Vercel | Hobby during dev → Pro at public launch |
| Framework | Next.js 16 App Router · React 19 · TypeScript · Tailwind 3 · Motion 12 | — |
| Backend | Vercel Functions on Fluid Compute (Node.js 24) | Hobby |
| State | Postgres (Neon, scale-to-zero) | free 0.5 GB |
| Cache + locks | Redis (Upstash) | free 10k cmd/day |
| Files | Vercel Blob, private | free 1 GB |
| LLM | Vercel AI Gateway → Anthropic | pay-per-use |
| Flight data | AviationStack | free 100/mo + Postgres cache |
| Email | Resend (transactional + inbound parse) | free 3k/mo |
| eSign | Documenso (OSS, self-hosted on a sibling Vercel project) | free |
| Auth | Bespoke magic-link via Resend | — |
| Bot block | Cloudflare Turnstile | free |
| OG images | `@vercel/og` | included |
| Realtime | SSE on Fluid Compute backed by Postgres `LISTEN/NOTIFY` | — |
| Cron | Vercel Cron + cron-job.org (overflow) | free + free |
| Observability | Vercel Analytics + Sentry free tier + AI Gateway dashboard | free |

Vercel is the right platform because Vercel Workflow (when we move to Pro) handles long-running claim lifecycles natively. On Hobby we replicate it as a DIY state machine driven by `claim_events` plus a cron consumer; the public surface and contracts stay identical, so migration to Vercel Workflow later is a code-internal swap.

### 3.2 Cost envelope (MVP, ~500 claims/month)

| Line | $ / mo |
|---|---|
| Vercel Pro at launch | 20 |
| Functions / Fluid Compute usage | ~5 |
| Neon | 0 |
| Upstash | 0 |
| Vercel Blob | 0 |
| AviationStack basic (only if free tier exceeded) | 0–29 |
| Resend | 0 |
| AI Gateway passthrough (Haiku for extract/classify; Sonnet for letters) | ~10 |
| Sentry | 0 |
| **Subtotal** | **~$15–25 during build (Hobby), ~$35–65 at soft launch (Pro + AviationStack basic)** |

A single 22% commission on a ₪2,000 claim ≈ ₪440 ≈ $115. One conversion covers months of infra.

### 3.3 Boundaries (8 isolated services)

```
1. Eligibility Engine    pure: (flight, incident) → (eligible, amount, grounds)
2. Flight Lookup         AviationStack adapter + Postgres cache
3. Claim Service         CRUD + claim_events append + state derivation
4. Document Generator    facts → PDF demand letter via Sonnet + react-pdf
5. eSign Adapter         wraps Documenso API (POA send/track/retrieve)
6. WhatsApp Operator     state machine over WA Business API (Phase 2)
7. Airline Mailbox       inbound email parser + reply classifier
8. Tracker Stream        claim_events → SSE → cinematic UI
```

Each service:
- exposes a typed contract,
- can be unit-tested without spinning up the others,
- has a single owner module under `services/<name>/`,
- emits structured events into the shared event log.

### 3.4 Top-level routes

```
Public site:
  /                        Landing (already built)
  /about                   Lawyer-of-record story + bar license proof
  /how-it-works            5-step explainer
  /pricing                 22% model + interactive calculator
  /war                     Post-Oct-2023 cancellation specialty
  /check                   Wedge-A drop zone + cinematic reveal
  /claim/[token]           Wedge-C public live tracker (signed URL, no login)
  /share/[token]           Public open-graph view (server-rendered, prerendered)

Claimant area:
  /me                      Dashboard (claims, settings, privacy mode)
  /auth/verify             Magic-link verify

Ops:
  /admin                   Queue dashboard
  /admin/login
  /admin/queue
  /admin/claims/[id]
  /admin/claims/[id]/letter
  /admin/airlines
  /admin/payouts
  /admin/audit
  /admin/users

API:
  /api/eligibility/upload
  /api/eligibility/[jobId]/sse
  /api/eligibility/[jobId]/claim
  /api/claims                    GET own, POST create
  /api/claims/[id]               GET, PATCH (privacy, contact)
  /api/sse/claim/[token]         tracker stream
  /api/og/claim/[token]          OG image
  /api/auth/request
  /api/auth/verify
  /api/auth/logout
  /api/auth/session
  /api/poa/issue
  /api/webhooks/esign
  /api/webhooks/airline-mailbox
  /api/webhooks/email-delivered
  /api/webhooks/email-bounced
  /api/admin/*                   ops-gated
  /api/health
```

## 4. Wedge A · File-to-Claim engine

### 4.1 User flow

The `/check` page is a single full-screen scene with three states:

- **Idle.** A schematic terminal-corridor backdrop loops in reverse. A drop zone shaped like an open boarding-pass envelope sits center, with a softly breathing Reversal Lime hairline border. Hebrew copy: `שמט כאן את הכרטיס · גרור · או הקלק לבחור קובץ`. A privacy line states the 14-day deletion policy.
- **Processing.** On drop: terminal goes black, film grain rises. The boarding pass photo materialises in 3D, slowly rotating. SplitFlapBoard strips fly across diagonally, each rendering one pipeline event in real time (`UPLOADED ✓`, `LY 0381 · TLV → ATH`, `DELAY · 6:12`, `EU 261 ART.7`). A ShekelCoin starts rising from off-screen.
- **Reveal.** Departures-board flips to the entitled amount in JetBrains Mono tabular numerals, lime, full-bleed. Below in Heebo Black: `נועה, מגיע לך — ניקח את זה במקומך`. The shekel coin lands silently. CTA: "שלח לי ב-WhatsApp" (until Phase 2 = email instead) → opens contact-capture sheet (single field).

If extraction confidence < 0.6 or AviationStack returns no match, the UI falls through to a 3-field manual mini-form (flight number, date, claimed delay) feeding the same `compute` function.

### 4.2 Pipeline

```
POST /api/eligibility/upload  (multipart)
  ├── Cloudflare Turnstile gate
  ├── rate-limit: Upstash, 5 / hr / IP-hash
  ├── MIME allowlist image/* + application/pdf
  ├── max 8 MB
  ├── strip EXIF
  ├── SHA-256 dedupe (return existing job if hash matches)
  ├── Vercel Blob private upload
  ├── INSERT eligibility_jobs(status='queued')
  └── return { jobId, sseUrl, sha256 }

Background worker (DIY workflow on Hobby; Vercel Workflow on Pro):
  extract  → looking_up → computing → ready
                ↓             ↓           ↓
              fail         fail      ineligible (still ready, with offer)

Each transition appends a row in claim_events (when promoted to claim) or updates eligibility_jobs.status.

GET /api/eligibility/[jobId]/sse
  - Streams pipeline progress to client
  - Heartbeat 25s
  - Reconnect via Last-Event-ID

POST /api/eligibility/[jobId]/claim  body { email | phone }
  - Promotes eligibility_job → claims row
  - Sends magic-link via Resend
  - Returns claim_token signed JWT
```

### 4.3 Extraction (Claude Haiku via AI Gateway)

System prompt is cached (Anthropic prompt caching). User message is the image. Output is structured JSON validated against:

```ts
const Extracted = z.object({
  flight_number: z.string().regex(/^[A-Z]{2,3}\s?\d{1,4}$/),
  departure_date: z.string().date(),
  origin_iata: z.string().length(3),
  destination_iata: z.string().length(3),
  passenger_name: z.string().nullable(),
  booking_ref: z.string().nullable(),
  airline_name: z.string().nullable(),
  delay_minutes_from_doc: z.number().nullable(),
  incident_hint: z.enum([
    "cancellation","delay","denied_boarding","rerouted","unknown"
  ]),
  confidence: z.number().min(0).max(1)
});
```

Confidence < 0.6 fails out to manual mini-form. Cost: ≈ $0.001 per extraction.

### 4.4 Flight Lookup

Postgres `flights` table is read-through cache with 30-day TTL. Cache miss hits AviationStack. Same flight number + date is shared across all claimants, so the second person on a delayed flight is a free lookup.

```sql
flights (
  id              uuid pk,
  flight_number   text not null,
  date            date not null,
  airline_iata    text,
  departure_iata  text,
  arrival_iata    text,
  scheduled_dep   timestamptz,
  actual_dep      timestamptz,
  scheduled_arr   timestamptz,
  actual_arr      timestamptz,
  status          text,           -- on-time | delayed | cancelled | diverted
  raw             jsonb,
  fetched_at      timestamptz default now(),
  unique (flight_number, date)
);
```

If AviationStack quota is exhausted, an ops alert is raised and the job is parked at `looking_up` until quota resets or an ops user manually resolves the flight from a public source. Manual resolutions are recorded in `audit_log`.

### 4.5 Eligibility Engine (`services/eligibility/engine.ts`)

Pure function. No I/O. Deterministic. Table-driven by Israeli + EU regulation. Unit-tested against a fixture matrix of distance × delay × cancellation × jurisdiction × reason category.

```ts
export function compute(input: ComputeInput): ComputeResult;

type ComputeInput = {
  distance_km: number;
  delay_minutes: number;
  cancellation: boolean;
  jurisdiction: "EU261" | "IL2012" | "BOTH";
  reason_category:
    | "carrier_fault"
    | "extraordinary"
    | "war_related"
    | "unknown";
};

type ComputeResult = {
  eligible: boolean;
  amount_ils: number;
  grounds: string[];          // ["EU 261 art.7(1)(b)", "IL Aviation Services Law §6"]
  confidence: number;
  rationale_he: string;
  rationale_en: string;
};
```

War-related reasons trigger an Israeli-specific branch where IL Aviation Services Law overrides the airline's "extraordinary circumstances" defense, per current IL case law. This branch is hardcoded, not LLM-decided.

### 4.6 Schema (Wedge A specific)

```sql
-- Core claim row referenced throughout this document.
claims (
  id              uuid pk,
  user_id         uuid references users(id),     -- nullable: orphan claim until contact captured
  flight_id       uuid references flights(id),
  airline_iata    text references airlines(iata),
  jurisdiction    text not null,                  -- EU261 | IL2012 | BOTH
  reason_category text not null,                  -- carrier_fault | extraordinary | war_related | unknown
  amount_ils      integer not null,
  current_state   text not null default 'intake.received',  -- denormalized latest event code
  current_stage_index smallint not null default 1,
  passenger_name  text not null,
  passenger_id_he text,                           -- ת.ז., null until POA stage
  contact_email   citext,
  contact_phone   text,
  claim_token     text unique not null,           -- signed JWT, 90d
  source          text not null,                  -- file_to_claim | manual_form | whatsapp (phase 2)
  created_at, updated_at
);
create index on claims (user_id, created_at);
create index on claims (current_state, updated_at);

eligibility_jobs (
  id            uuid pk,
  blob_key      text not null,
  blob_sha256   text not null,
  ip_hash       text not null,
  status        text not null,        -- queued | extracting | looking_up | computing | ready | failed
  extracted     jsonb,
  flight_id     uuid references flights(id),
  result        jsonb,
  failure_code  text,
  claim_id      uuid references claims(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on eligibility_jobs (status, updated_at);
```

### 4.7 Privacy + retention

The `/check` drop zone surfaces:

```
הקובץ נמחק תוך 14 יום אם לא תפתח תיק. הצפנה צד שרת. EXIF מוסר.
```

A nightly cron deletes Blob + DB rows where `claim_id is null and created_at < now() - interval '14 days'`. Converted jobs retain their files as claim evidence under standard claim retention.

## 5. Wedge C · Cinematic Live Tracker

### 5.1 Data model: event-sourced

Every claim state transition is a row in `claim_events`. The current state is denormalized on `claims.current_state` for fast list views, but the events table is the source of truth.

```sql
claim_events (
  id          uuid pk,
  claim_id    uuid not null references claims(id),
  code        text not null,      -- machine code, see lifecycle table
  actor       text not null,      -- system | lawyer | airline | claimant
  label_he    text not null,
  label_en    text not null,
  metadata    jsonb,              -- { mail_server: { host, ip, country, city }, offered_amount_ils, ... }
  occurred_at timestamptz default now()
);
create index on claim_events (claim_id, occurred_at);

create function notify_claim_event() returns trigger as $$
begin
  perform pg_notify('claim_events', new.claim_id::text);
  return new;
end $$ language plpgsql;
create trigger claim_events_notify
  after insert on claim_events
  for each row execute function notify_claim_event();
```

### 5.2 Lifecycle

| # | code | actor | HE label | Trigger |
|---|---|---|---|---|
| 01 | `intake.received` | system | תיק התקבל | eligibility_job → claim promotion |
| 02 | `poa.sent` | system | ייפוי כוח נשלח | Documenso createDocument success |
| 03 | `poa.signed` | claimant | ייפוי כוח נחתם | Documenso webhook |
| 04 | `evidence.collected` | system | עדויות נאספו | all required documents present |
| 05 | `demand.drafted` | system | מכתב דרישה הוכן | Sonnet generation success |
| 06 | `demand.reviewed` | lawyer | נסקר על ידי עו״ד | ops user clicks "approve" |
| 07 | `demand.sent` | lawyer | נשלח לחברת התעופה | Resend `email.sent` ack |
| 08 | `airline.delivered` | airline | החברה קיבלה | Resend `email.delivered` (MTA DSN) |
| 08b | `airline.bounced` | airline | המכתב חזר | Resend `email.bounced` |
| 09 | `airline.replied` | airline | החברה השיבה | inbound mailbox parser |
| 10 | `negotiation.open` | lawyer | משא ומתן פתוח | follow-up letter sent |
| 11 | `settlement.offered` | airline | הצעה להסדר | inbound classifier intent=settlement_offered |
| 12 | `settlement.accepted` | claimant | ההסדר התקבל | claimant click in dashboard |
| 13 | `payout.requested` | system | תשלום בדרך | lawyer marks wire-pending |
| 14 | `payout.complete` | system | הכסף הועבר | lawyer marks wire-confirmed |
| 15 | `claim.closed` | system | תיק נסגר | post-payout final state |

`airline.delivered` is driven by Mail Transfer Agent Delivery Status Notifications received via Resend's webhook. Tracking pixels are not used. The receiving server's host, IP, country and city are extracted from the DSN headers and reverse-DNS, then stored in event metadata. The cinematic map uses this to plot a small amber pulse at the airline's mail-server location (e.g., `↘ FRA · Lufthansa SMTP Gateway`).

### 5.3 Public access + redaction

The token is an HS256 JWT with `{ claim_id, exp: +90d }`. Anyone with the link can view the tracker. The public view applies a redaction layer determined by the **owning user's** `users.privacy_mode` at view time (single user-level setting; applies uniformly to all of that user's claims):

- `public_default`: passenger first name + last-name initial (`Noa K.`), full route, full ₪ amount, full timeline.
- `anonymous`: `טס/ה ישראלית`, full route, full ₪ amount, timeline labels only.

Personal-identifying information not exposed in either mode: passport number, ת.ז., address, phone, email, payout rails.

The privacy mode toggle lives in `/me/settings` and (Phase 2) a WhatsApp `/privacy` slash command.

### 5.4 Realtime stream

```
GET /api/sse/claim/[token]
  - verify JWT, load claim
  - emit all past events (replay, oldest → newest)
  - LISTEN claim_events on Postgres
  - on NOTIFY: filter by claim_id, push event to client
  - heartbeat every 25 s
  - client reconnects with Last-Event-ID for resume

GET /api/claim/[token]/events?since=<event_id>   (polling fallback)
```

`maxDuration: 300` on the SSE function. Client implements an exponential-backoff reconnect.

### 5.5 Frontend `/claim/[token]`

Three layered surfaces:

1. **Backdrop.** Black, film grain, terminal hum.
2. **Schematic map.** Custom SVG of Mediterranean + EU + IL with JetBrains Mono labels. Origin marker (cancellation event city) pulses cancellation-red. TLV is the lawyer marker, lime. Airline HQ city is the destination marker, lime when reached. Mail-server cities are small amber pulses with lighter labels. Reverse-flight arc is amber dotted with animated `stroke-dashoffset` while in flight; solid lime when complete.
3. **HUD.** Top center: live mono ticker. Top right: ETA. Center hero (only first 2s, then fades): big SplitFlapBoard amount. Bottom: horizontal RTL timeline drawer of past events; tap to expand metadata. Bottom-left: WhatsApp magnetic CTA. Bottom-right: share button (copies link, triggers OG card preview).

Each event has a bespoke reveal animation in `components/tracker/EventReveal.tsx`:

- `intake.received` — coin spawns at origin city.
- `demand.sent` — SVG envelope flies origin → airline HQ along the arc.
- `airline.delivered` — envelope opens at the mail-server city; ink ripple.
- `airline.replied` — return envelope spawns at airline HQ, flies back to TLV.
- `settlement.offered` — numeric counter ticks up to offered amount.
- `payout.complete` — ShekelCoin lands in the foreground silhouette hand (reuse Hero component).
- `claim.closed` — board flips final time `שולם`, lime pulse, end.

### 5.6 Open-graph card

```
GET /api/og/claim/[token]   →  1200×630 PNG via @vercel/og
```

Layout: top-left `TASHLEMLI · תשלם לי`, center passenger label per privacy mode + route, right SplitFlapBoard SVG of current ₪, bottom current stage label + thin lime arc progress bar. Edge-cached per `(claim_id, current_state)` tuple. Cache busts on event insert via `revalidatePath`.

## 6. Wedge D · AI Counsel (demand letter generator)

### 6.1 Inputs

```ts
type LetterInput = {
  claim: ClaimRow;
  flight: FlightRow;
  airline: AirlineRow;
  jurisdiction: "EU261" | "IL2012" | "BOTH";
  grounds: string[];
  amount_ils: number;
  claim_token: string;
  privacy: "public_default" | "anonymous";
};
```

### 6.2 Pipeline

1. Build a deterministic skeleton from the HE+EN side-by-side template.
2. Pull airline-specific tone profile from `airlines`.
3. Call AI Gateway with `anthropic/claude-sonnet-4-6`. System prompt cached. User message = `LetterInput` JSON.
4. Validate output against the structured schema (subject, letterhead, facts paragraph HE+EN, citations, demand amount, deadline, payment terms, sign-off).
5. Render PDF via `@react-pdf/renderer` server-side, streamed.
6. Store as `documents.kind='demand_letter'`, version 1.
7. Append `claim_event` `demand.drafted`.
8. Surface to lawyer queue.

### 6.3 Airline knowledge base

```sql
airlines (
  iata text pk,                       -- LH, LY, U2, TK, AF, BA, KL, ...
  legal_name text,
  legal_entity_country text,
  primary_contact_email text,
  fallback_contact_email text,
  preferred_language text,            -- en | de | fr | he
  jurisdiction_response text,         -- EU261 | local | both
  tone_profile text,                  -- formal | technical | adversarial
  historical_success_rate numeric,    -- maintained by ops
  median_settlement_days int,
  notes text,
  updated_at timestamptz
);
```

### 6.4 Versioning

Every lawyer edit creates a new `document_versions` row. The version that gets sent is locked: blob-stored, hash-recorded, and immutable. The admin diff view compares any two versions.

### 6.5 Cost

Sonnet ≈ 6k tokens per letter ≈ $0.03. 500 letters/mo ≈ $15 before prompt caching, ~$8 after.

## 7. POA + eSign

### 7.1 Stack

Documenso (Apache 2.0, Next.js + Postgres) self-hosted as a sibling Vercel project sharing the same Neon org with a separate database. Free.

### 7.2 POA template

`templates/poa-he-v1.tsx` is a `@react-pdf/renderer` component with merge fields:

```
{full_name}, {israeli_id}, {date_of_birth}, {address},
{phone}, {claim_id}, {lawyer_name}, {bar_license_number}
```

`lib/validators/teudatZehut.ts` validates the Israeli ID check digit before POA issuance. Invalid ID → manual ops review, no POA sent.

### 7.3 Flow

```
claim.created
  → POST /api/poa/issue
  → render PDF in-memory
  → upload to Documenso (createDocument)
  → create signing recipient (claimant email/phone)
  → store documenso_id on poa_signatures
  → send email via Resend with signing URL
  → claim_event poa.sent

claimant signs
  → Documenso webhook → POST /api/webhooks/esign (HMAC-verified)
  → download signed PDF, store in Blob
  → claim_event poa.signed
  → trigger evidence.collect → demand.draft
```

### 7.4 Schema

```sql
documents (
  id              uuid pk,
  claim_id        uuid,
  kind            text,    -- poa | demand_letter | airline_reply | settlement_agreement
  documenso_id    text,
  blob_key        text,
  hash_sha256     text,
  language        text,
  current_version int,
  status          text,    -- draft | sent | signed | received | sent_to_airline | locked
  created_at, updated_at
);

document_versions (
  id            uuid pk,
  document_id   uuid,
  version       int,
  blob_key      text,
  hash_sha256   text,
  diff_summary  text,
  created_by    uuid references ops_users(id),
  created_at    timestamptz default now()
);

poa_signatures (
  id                   uuid pk,
  claim_id             uuid,
  document_id          uuid,
  documenso_id         text,
  signed_at            timestamptz,
  signed_ip_hash       text,
  signed_pdf_blob_key  text
);
```

## 8. Inbound airline mailbox

### 8.1 Domain + addressing

`in.tashlemli.co.il` MX → Resend Inbound. Plus-addressing scheme:

```
claims+<claim_token>@in.tashlemli.co.il
```

When sending demand letters, `Reply-To` is set to this address. Airlines reply → email lands in Resend Inbound → webhook fires.

### 8.2 Webhook `/api/webhooks/airline-mailbox`

```
1. Verify provider HMAC.
2. Parse plus-address → extract claim_token → verify JWT → resolve claim_id.
3. Capture mail-server metadata: sender domain, MX record, reverse-DNS, country (MaxMind / ipapi.co free).
4. Store raw EML in Blob (audit trail).
5. Extract subject, body (text + html), attachments.
6. Classify with Haiku via AI Gateway:
     {
       intent: "acknowledged" | "denied" | "info_requested" |
               "settlement_offered" | "auto_reply" | "unrelated",
       offered_amount_ils: number | null,
       offered_currency: string,
       deadline_for_us: date | null,
       requires_lawyer: boolean,
       summary_he: string
     }
7. Append claim_event matching intent:
     acknowledged       → airline.replied
     settlement_offered → settlement.offered (amount in metadata)
     denied             → airline.denied
     info_requested     → airline.info_requested
8. If requires_lawyer, raise admin notification (insert ops_inbox row).
9. Update demand-letter document status to `replied`.
```

Outbound MTA delivery (`airline.delivered`) is handled by a separate webhook `/api/webhooks/email-delivered` consuming Resend's `email.delivered` event. Bounces drive `airline.bounced` via `/api/webhooks/email-bounced`.

## 9. Auth + claimant dashboard

### 9.1 Model

Passwordless. Magic-link only. Email is the v1 channel; SMS (and WhatsApp in Phase 2) follow.

### 9.2 Endpoints

```
POST /api/auth/request    body { email | phone }
  - upsert users row (no enumeration leak in response)
  - generate 32-byte token
  - store hash in magic_link_tokens (15-min TTL, single-use)
  - send link via Resend
  - return 204

GET /api/auth/verify?t=<token>
  - load token by hash, check expiry + unconsumed + IP-window
  - mark consumed_at = now()
  - create sessions row
  - set HttpOnly Secure SameSite=Lax cookie tshl_session=<jwt(sid)>
  - 302 → /me

POST /api/auth/logout      revoke session
GET  /api/auth/session     returns { user } | 401
```

Rate-limit: 5 magic-link requests per email + IP per 10 min, enforced via Upstash. Token comparison is constant-time. The cookie is a signed JWT with `sid`; the server validates the `sessions` row exists, is unrevoked, and unexpired.

### 9.3 Schema

```sql
users (
  id            uuid pk,
  email         citext unique,
  phone         text unique,
  full_name     text,
  privacy_mode  text not null default 'public_default',
  language      text not null default 'he',
  created_at, updated_at
);

magic_link_tokens (
  id          uuid pk,
  user_id     uuid not null,
  token_hash  bytea not null,
  channel     text not null,            -- email | sms
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  ip_hash     text,
  created_at  timestamptz default now()
);
create index on magic_link_tokens (user_id, expires_at);

sessions (
  id          uuid pk,
  user_id     uuid not null,
  expires_at  timestamptz not null,
  ip_hash     text,
  user_agent  text,
  revoked_at  timestamptz,
  created_at  timestamptz default now()
);
```

### 9.4 Dashboard `/me`

Header with name + privacy toggle. Active claims grid where each row is a mini-tracker preview deep-linking to `/claim/[token]`. Closed claims archive. Settings: contact preferences, language, account deletion (Israeli Privacy Law right to erasure).

## 10. Lawyer ops console

### 10.1 Auth (separate from claimants)

`ops_users` is a wholly separate identity domain. No row in `users` is also in `ops_users`. Login is email + TOTP via `otplib` with the secret stored encrypted (envelope-encrypted; key in Vercel env). Session cookie is `tshl_ops` (different name from claimant cookie).

### 10.2 Routes

```
/admin                              queue dashboard
/admin/login
/admin/queue                        claims by stage, sortable
/admin/claims/[id]                  full claim view + actions
/admin/claims/[id]/letter           letter editor (monaco-react)
/admin/airlines                     directory + success rates
/admin/payouts                      claims at settlement.accepted, awaiting wire
/admin/audit                        audit log explorer
/admin/users                        claimant search
/api/admin/...                      all gated by ops session middleware
```

### 10.3 Audit

Every ops action emits an `audit_log` row and, where it changes claim state, a `claim_event`.

```sql
ops_users (
  id                     uuid pk,
  email                  citext unique not null,
  full_name              text,
  totp_secret_encrypted  bytea not null,
  bar_license_number     text,
  role                   text not null,    -- lawyer | admin | paralegal
  active                 boolean default true,
  created_at, updated_at
);

audit_log (
  id              bigserial pk,
  ops_user_id     uuid,
  action          text not null,
  resource_type   text not null,
  resource_id     uuid,
  before          jsonb,
  after           jsonb,
  ip_hash         text,
  occurred_at     timestamptz default now()
);

ops_inbox (
  id          uuid pk,
  claim_id    uuid,
  kind        text,    -- airline_reply_classified | settlement_offer | info_request | escalation
  payload     jsonb,
  read_by     uuid references ops_users(id),
  read_at     timestamptz,
  created_at  timestamptz default now()
);
```

## 11. Public-page content map

All RTL Hebrew. All reuse the existing design system + components.

| Route | Source | Notes |
|---|---|---|
| `/` | already built | Hero + 10 sections + Footer |
| `/about` | `stitch/about/index.html` | Translate Stitch markup → React; lawyer-of-record bar license proof; founding context |
| `/how-it-works` | `stitch/how-it-works/index.html` | 5-step explainer, reuse Hero corridor visuals |
| `/pricing` | `stitch/pricing/index.html` | 22% commission section + extracted Calculator widget + FAQ |
| `/war` | `stitch/war-cancellations/index.html` | Coral runway visual reused; legal-grounds detail |
| `/check` | `stitch/eligibility-checker/index.html` | Wired to backend pipeline (Wedge A) |
| `/claim/[token]` | new | Tracker map + EventReveal library |
| `/me` | new | Minimal claimant dashboard |
| `/admin/*` | new | Functional ops UI |

Translation step per page: map class names from Stitch HTML, swap copy for our voice, wrap in `<RootLayout>`. ~half-day per content page.

## 12. Testing + observability

### 12.1 Unit (Vitest)

- `services/eligibility/engine.ts` — table-driven, 30+ fixtures covering EU/IL × distance bucket × delay × cancellation × reason matrix, including all war-related branches.
- `lib/validators/teudatZehut.ts` — full check-digit table.
- `lib/parsers/airlineReply.ts` — fixture-driven classification with LLM mocked.
- `lib/jwt/claimToken.ts` — sign/verify, expired, tampered.
- `lib/poa/render.ts` — snapshot testing of generated PDF text content.

### 12.2 Integration

- Eligibility upload pipeline with mocked AI Gateway + AviationStack; assert SSE event shape and resulting claim row.
- Webhook signature verification (Documenso, Resend inbound, Resend delivery).
- POA flow end-to-end against Documenso sandbox.
- `claim_events` trigger fires correct `pg_notify`.

### 12.3 E2E (Playwright)

- Drop boarding pass → magic moment renders → CTA captures email → claim row exists → tracker URL loads with replayed events.
- Magic-link auth: request → email captured (Mailosaur) → click link → `/me` loads.
- Admin: login → review claim → edit letter → mark sent → claim_event present → tracker reflects change.

### 12.4 Observability

- Vercel Analytics for page perf.
- Sentry free tier for runtime errors (alerting on > 1% error rate per route).
- AI Gateway dashboard for per-call cost + latency.
- Postgres slow-query logs via Neon dashboard.
- Synthetic uptime: cron-job.org pings `/api/health` every 5 min.

### 12.5 Preview environments

Every Vercel preview deployment gets a dedicated Neon DB branch. PR opens → unique URL → unique data. Free, isolated, parallel.

## 13. Phase plan

```
Phase 0 — Build              week 1-3   Hobby tier · ~$0
  · Site shell + 6 public pages
  · Eligibility upload pipeline
  · Eligibility engine + flight cache
  · Tracker + SSE + OG card
  · Magic-link auth + claimant dashboard
  · POA + Documenso integration
  · Demand-letter generator (Sonnet)
  · Inbound mailbox + reply classifier
  · Lawyer ops console
  · Test suites + observability

Phase 1 — Soft launch        week 4    Pro · ~$25-65
  · Real claimants
  · WhatsApp link points to wa.me with human-staffed number
  · Real domain + production secrets
  · Documenso self-host promoted to production

Phase 2 — WhatsApp Operator  week 5-7  +$10-30
  · WhatsApp Business Cloud API
  · State-machine intake + status + Q&A in WhatsApp
  · Boarding-pass photo via WA → eligibility pipeline
  · Outbound status updates per claim_event

Phase 3 — Auto payouts + KYC week 8-10 +vendor fees
  · Bit Business API for outbound transfers
  · AU10TIX or equivalent for ת.ז. KYC
  · Multi-lawyer ops onboarding flow
```

## 14. Open questions deferred to plan

- Choice of inbound parser between Resend Inbound (beta, simpler) and Postmark Inbound (mature, $15/mo). Plan-time decision based on Resend Inbound stability at the time of implementation.
- Israeli Hebrew translation review of all generated demand letters before send (manual lawyer step in MVP; AI consensus check in a later phase).
- Rate-limiting strategy for the public tracker SSE endpoint (currently per-token; may need per-IP if shared links go viral).

---

End of spec.
