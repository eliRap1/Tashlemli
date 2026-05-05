import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).delete("tshl_ops");
  return NextResponse.redirect(new URL("/admin/login", process.env.APP_BASE_URL!));
}
