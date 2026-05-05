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
  if (parsed.data.privacy_mode === "anonymous") {
    await reMintUserClaimTokens(user.id);
  }
  return NextResponse.json({ ok: true });
}
