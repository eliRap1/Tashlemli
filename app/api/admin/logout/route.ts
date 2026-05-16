import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth/admin-credentials";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).delete(ADMIN_COOKIE);
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL("/admin/login", base));
}
