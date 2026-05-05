import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, getCurrentUser } from "@/services/auth/session";

export async function requireUser() {
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  const user = await getCurrentUser(c);
  if (!user) redirect("/?login=1");
  return user!;
}
