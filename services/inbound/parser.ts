import { simpleParser, type AddressObject } from "mailparser";

export type ParsedReply = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string | null;
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  receivedHeaders: string[];
};

function flat(addr: AddressObject | AddressObject[] | undefined): string[] {
  if (!addr) return [];
  const arr = Array.isArray(addr) ? addr : [addr];
  return arr.flatMap((a) => a.value.map((v) => v.address ?? "")).filter(Boolean);
}

export async function parseEml(raw: Buffer | string): Promise<ParsedReply> {
  const m = await simpleParser(raw);
  return {
    from: flat(m.from)[0] ?? "",
    to: flat(m.to),
    subject: m.subject ?? "",
    text: m.text ?? "",
    html: typeof m.html === "string" ? m.html : null,
    messageId: m.messageId ?? null,
    inReplyTo: (m.inReplyTo as string) ?? null,
    references: typeof m.references === "string" ? [m.references] : (m.references as string[] ?? []),
    receivedHeaders: m.headerLines.filter((h) => h.key === "received").map((h) => h.line),
  };
}
