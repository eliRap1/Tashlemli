import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db/client";
import { eligibilityJobs } from "@/lib/db/schema/eligibility-jobs";
import { eq } from "drizzle-orm";
import { putPublic } from "@/lib/blob/client";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp, sha256Hex } from "@/lib/hash";
import { verifyTurnstile } from "@/lib/turnstile";
import { runJob } from "@/services/eligibility/runner";
import { publishJobEvent } from "@/services/eligibility/publish";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipHash = await hashIp(ip);
  const rl = await rateLimit(`upload:${ipHash}`, 5, 60 * 60);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  const turnstile = form.get("turnstile")?.toString() ?? "";
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "bad_mime" }, { status: 415 });
  if (!(await verifyTurnstile(turnstile, ip))) return NextResponse.json({ error: "bot" }, { status: 403 });

  const inputBuf = Buffer.from(await file.arrayBuffer());
  const isImage = file.type.startsWith("image/");
  const stripped = isImage ? await sharp(inputBuf).rotate().jpeg({ quality: 88 }).toBuffer() : inputBuf;
  const processedType = isImage ? "image/jpeg" : file.type;
  const sha = await sha256Hex(stripped);
  const dedupe = await db.select().from(eligibilityJobs).where(eq(eligibilityJobs.blobSha256, sha)).limit(1);
  if (dedupe[0]) {
    return NextResponse.json({ jobId: dedupe[0].id, sseUrl: `/api/eligibility/${dedupe[0].id}/sse`, deduped: true });
  }

  const ext = isImage ? "jpg" : "pdf";
  const blobKey = `eligibility/${sha.slice(0, 2)}/${sha.slice(2, 4)}/${sha}.${ext}`;
  const stored = await putPublic(blobKey, stripped, processedType);
  const [job] = await db.insert(eligibilityJobs).values({
    blobKey: stored.url,
    blobSha256: sha,
    ipHash,
    status: "queued",
  }).returning({ id: eligibilityJobs.id });
  if (!job) return NextResponse.json({ error: "db_fail" }, { status: 500 });

  await publishJobEvent(job.id, { kind: "queued" });
  // Run the pipeline inline; Vercel Functions cancel any work the response
  // doesn't await (the previous fire-and-forget pattern silently dropped
  // OCR + lookup + compute on Vercel).
  await runJob(job.id, stripped, processedType);

  return NextResponse.json({ jobId: job.id, sseUrl: `/api/eligibility/${job.id}/sse` });
}
