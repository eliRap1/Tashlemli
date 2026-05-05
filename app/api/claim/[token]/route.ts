import { NextResponse } from "next/server";
import { loadPublicView } from "@/services/tracker/publicView";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const view = await loadPublicView(token);
    return NextResponse.json(view);
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: e.code }, { status: e.httpStatus });
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}
