import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema/ops";

export async function audit(action: string, resourceType: string, resourceId: string | null, before: any, after: any, ipHash: string | null = null) {
  await db.insert(auditLog).values({ action, resourceType, resourceId: resourceId ?? undefined, before, after, ipHash });
}
