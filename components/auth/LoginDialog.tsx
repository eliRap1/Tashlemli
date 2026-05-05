"use client";

import { useState } from "react";

export function LoginDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/auth/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    setBusy(false);
    if (r.ok) setSent(true);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm grid place-items-center z-50" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-[min(420px,90vw)] rounded-3xl bg-[#0c1118] ring-1 ring-fluorescent/10 p-8 space-y-4" dir="rtl">
        <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">LOGIN</div>
        <h2 className="font-heebo font-black text-fluorescent text-2xl">קישור חד-פעמי במייל</h2>
        {sent ? (
          <div className="font-heebo text-fluorescent/65">בדקי את תיבת המייל. הקישור תקף ל-15 דקות.</div>
        ) : (
          <>
            <input
              required type="email" dir="ltr"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-fluorescent focus:border-reversal focus:outline-none"
            />
            <button type="submit" disabled={busy} className="w-full rounded-full bg-reversal py-3 font-heebo font-bold text-terminal disabled:opacity-50">
              {busy ? "שולח…" : "שלחו לי קישור"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
