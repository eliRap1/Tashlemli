import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth/admin-credentials";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL("/admin/login", env.APP_BASE_URL));
}
