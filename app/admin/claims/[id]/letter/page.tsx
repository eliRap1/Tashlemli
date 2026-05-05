"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), { ssr: false });

export default function LetterEditor({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [letter, setLetter] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => { params.then(({ id }) => setId(id)); }, [params]);

  async function draft() {
    if (!id) return;
    setBusy(true);
    const r = await fetch(`/api/admin/claims/${id}/letter/draft`, { method: "POST" });
    const j = await r.json();
    setBusy(false);
    if (j.letter) setLetter(JSON.stringify(j.letter, null, 2));
  }

  async function preview() {
    if (!id) return;
    setPdfUrl(`/api/admin/claims/${id}/letter/1/pdf?ts=${Date.now()}`);
  }

  async function send() {
    if (!id) return;
    setBusy(true);
    const r = await fetch(`/api/admin/claims/${id}/letter/send`, { method: "POST" });
    setBusy(false);
    if (!r.ok) alert("send failed: " + (await r.text()));
    else alert("sent");
  }

  return (
    <div dir="rtl" className="grid grid-cols-12 gap-6">
      <div className="col-span-7 h-[78vh] rounded-2xl overflow-hidden ring-1 ring-fluorescent/8 bg-[#0c1118]">
        <MonacoEditor height="100%" defaultLanguage="json" value={letter} onChange={(v) => setLetter(v ?? "")} theme="vs-dark" />
      </div>
      <div className="col-span-5 space-y-3">
        <div className="flex gap-2">
          <button onClick={draft} disabled={busy} className="rounded-full bg-reversal px-5 py-2 font-heebo font-bold text-terminal disabled:opacity-50">{busy ? "…" : "טיוטה (AI)"}</button>
          <button onClick={preview} className="rounded-full bg-fluorescent/10 px-5 py-2 font-heebo">תצוגה PDF</button>
          <button onClick={send} disabled={busy} className="rounded-full bg-fluorescent text-terminal px-5 py-2 font-heebo font-bold disabled:opacity-50">שלח לחברה</button>
        </div>
        {pdfUrl && <iframe src={pdfUrl} className="w-full h-[68vh] rounded-2xl ring-1 ring-fluorescent/8 bg-fluorescent" />}
      </div>
    </div>
  );
}
