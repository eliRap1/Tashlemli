import { db } from "@/lib/db/client";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { users } from "@/lib/db/schema/users";
import { eq, asc } from "drizzle-orm";
import { verifyClaimToken } from "@/lib/jwt/claim-token";
import { AIRLINE_HQ, TLV } from "./airlineHq";
import { AppError } from "@/lib/errors";

export type PublicEvent = {
  id: string;
  code: string;
  actor: string;
  label_he: string;
  label_en: string;
  metadata: any;
  occurred_at: string;
};

export type PublicClaimView = {
  passenger_label: string;
  flight_label: string;
  origin: { iata: string; lat: number; lon: number; city: string };
  airline_hq: { iata: string; city: string; lat: number; lon: number; mailHost?: string };
  amount_ils: number;
  current_state: string;
  privacy_mode: "public_default" | "anonymous";
  events: PublicEvent[];
};

export async function loadPublicView(token: string): Promise<PublicClaimView> {
  const { claim_id } = await verifyClaimToken(token);
  const [c] = await db.select().from(claims).where(eq(claims.id, claim_id)).limit(1);
  if (!c) throw new AppError("CLAIM_NOT_FOUND", "claim missing", 404);
  const [u] = c.userId ? await db.select().from(users).where(eq(users.id, c.userId)).limit(1) : [];
  const privacy = (u?.privacyMode ?? "anonymous") as "anonymous" | "public_default";
  const passenger_label = redactPassenger(c.passengerName, privacy);

  const events = await db.select().from(claimEvents).where(eq(claimEvents.claimId, c.id)).orderBy(asc(claimEvents.occurredAt));
  const hq = AIRLINE_HQ[c.airlineIata ?? "LH"] ?? AIRLINE_HQ.LH;

  return {
    passenger_label,
    flight_label: redactFlight(c, privacy),
    origin: TLV,
    airline_hq: hq,
    amount_ils: c.amountIls,
    current_state: c.currentState,
    privacy_mode: privacy,
    events: events.map((e) => ({
      id: e.id,
      code: e.code,
      actor: e.actor,
      label_he: e.labelHe,
      label_en: e.labelEn,
      metadata: stripSensitiveMetadata(e.metadata),
      occurred_at: e.occurredAt.toISOString(),
    })),
  };
}

/** Remove fields that must not reach the public tracker view. */
function stripSensitiveMetadata(raw: any): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { to, messageId, mail_server, letter, ...safe } = raw as Record<string, unknown>;
  return safe;
}

export function redactPassenger(full: string, mode: "anonymous" | "public_default"): string {
  if (mode === "anonymous") return "נוסע/ת ישראלי/ת";
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const lastInitial = parts[1]?.[0] ?? "";
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

function redactFlight(c: { airlineIata: string | null }, _mode: "anonymous" | "public_default"): string {
  return c.airlineIata ?? "—";
}
