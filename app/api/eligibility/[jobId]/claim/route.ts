import { NextResponse } from "next/server";
import { z } from "zod";
import { promoteJobToClaim } from "@/services/claims/promote";
import { AppError } from "@/lib/errors";

const Body = z.union([
  z.object({ email: z.string().email() }),
  z.object({ phone: z.string().regex(/^\+?\d{8,15}$/) }),
]);

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  try {
    const claim = await promoteJobToClaim(jobId, parsed.data as any);
    return NextResponse.json({
      claim_id: claim.id,
      claim_token: claim.claimToken,
      tracker_url: `/claim/${claim.claimToken}`,
    });
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: e.code }, { status: e.httpStatus });
    throw e;
  }
}
