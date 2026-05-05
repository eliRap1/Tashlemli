"use client";

import { useEffect, useState } from "react";

export default function PasteReply({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [resp, setResp] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { params.then(({ id }) => setId(id)); }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    const r = await fetch(`/api/admin/claims/${id}/paste-reply`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ from, subject, body }) });
    const j = await r.json();
    setBusy(false);
    setResp(j);
  }

  return (
    <div dir="rtl">
      <h1 className="font-heebo font-black text-3xl mb-6">הדבקת תגובה ידנית</h1>
      <form onSubmit={submit} className="grid gap-3 max-w-[640px]">
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" className="rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono" dir="ltr" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Body" className="rounded-2xl bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono" />
        <button disabled={busy} className="rounded-full bg-reversal px-5 py-2 font-heebo font-bold text-terminal disabled:opacity-50">
          {busy ? "סווג…" : "סווג והוסף לאירועים"}
        </button>
      </form>
      {resp && <pre className="mt-6 p-4 bg-[#0c1118] ring-1 ring-fluorescent/8 rounded-xl text-fluorescent/80">{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}
