import "dotenv/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { claims } from "@/lib/db/schema/claims";
import { claimEvents } from "@/lib/db/schema/claim-events";
import { signClaimToken } from "@/lib/jwt/claim-token";
import { eq } from "drizzle-orm";

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
  await db.update(claims).set({ claimToken: token }).where(eq(claims.id, c.id));
  await db.insert(claimEvents).values({ claimId: c.id, code: "intake.received", actor: "system", labelHe: "תיק התקבל", labelEn: "Claim received" });

  console.log("DEMO_CLAIM_TOKEN=", token);
  console.log("DEMO_CLAIM_ID=", c.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
