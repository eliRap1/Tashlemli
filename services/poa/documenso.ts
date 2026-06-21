import { AppError } from "@/lib/errors";
// TODO(audit): README lists /api/webhooks/esign but the route does not exist.
// When Documenso fires the signing-complete webhook, poa.signed must be recorded
// on the claim. Create app/api/webhooks/esign/route.ts that verifies the
// Documenso webhook secret, looks up poaSignatures by documensoId, and inserts
// a poa.signed claim event + advances currentState / currentStageIndex to 3.

const BASE = process.env.DOCUMENSO_BASE_URL ?? "https://app.documenso.com/api/v1";

async function call(path: string, init: RequestInit) {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${process.env.DOCUMENSO_API_KEY}`,
      "content-type": "application/json",
    },
  });
  if (!r.ok) throw new AppError("DOCUMENSO_HTTP", `documenso ${r.status}`, 502);
  return await r.json();
}

export async function createDocumentSimple(args: { title: string; pdfBase64: string; recipientEmail: string; recipientName: string }): Promise<{ id: string; signingUrl: string }> {
  const created = await call("/documents", {
    method: "POST",
    body: JSON.stringify({
      title: args.title,
      document: args.pdfBase64,
      recipients: [{ email: args.recipientEmail, name: args.recipientName, role: "SIGNER" }],
    }),
  });
  const sent = await call(`/documents/${created.id}/send`, { method: "POST", body: "{}" });
  const link = (sent.recipients?.[0]?.signingUrl as string) ?? created.recipients?.[0]?.signingUrl;
  return { id: String(created.id), signingUrl: link };
}
