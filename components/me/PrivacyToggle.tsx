"use client";

import { useState } from "react";

export function PrivacyToggle({ initial }: { initial: "public_default" | "anonymous" }) {
  const [mode, setMode] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function flip() {
    const next = mode === "anonymous" ? "public_default" : "anonymous";
    setBusy(true);
    const r = await fetch("/api/me/privacy", { method: "POST", body: JSON.stringify({ privacy_mode: next }), headers: { "content-type": "application/json" } });
    setBusy(false);
    if (r.ok) setMode(next);
  }

  return (
    <section className="rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/8 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/45 mb-3">PRIVACY MODE</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-heebo font-bold text-fluorescent text-xl">
            {mode === "anonymous" ? "אנונימי · מומלץ" : "ציבורי · נראה לכל מי שיש לו את הקישור"}
          </div>
          <div className="font-heebo text-fluorescent/55 text-sm mt-1">
            במצב אנונימי, הקישורים הציבוריים שלך מציגים &quot;נוסע/ת ישראלי/ת&quot; בלבד.
          </div>
        </div>
        <button onClick={flip} disabled={busy} className="rounded-full bg-reversal px-5 py-2 font-heebo font-bold text-terminal disabled:opacity-50">
          {busy ? "…" : mode === "anonymous" ? "פתחי" : "הסתירי"}
        </button>
      </div>
    </section>
  );
}
