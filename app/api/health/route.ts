import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  return NextResponse.json({
    status: "ok",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    region: process.env.VERCEL_REGION ?? "local",
    nodeEnv: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
  });
}
