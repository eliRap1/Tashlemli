"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch("/api/admin/login", { method: "POST", body: JSON.stringify({ password: pw }), headers: { "content-type": "application/json" } });
    setBusy(false);
    if (r.ok) window.location.href = "/admin";
    else setErr("סיסמה לא תקינה");
  }
  return (
    <main dir="rtl" className="min-h-screen grid place-items-center bg-terminal">
      <form onSubmit={submit} className="w-[360px] rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/8 p-6 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/80">OPS LOGIN</div>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-fluorescent" />
        <button disabled={busy} className="w-full rounded-full bg-reversal py-3 font-heebo font-bold text-terminal disabled:opacity-50">
          {busy ? "…" : "כניסה"}
        </button>
        {err && <div className="text-xs text-cancellation font-mono">{err}</div>}
      </form>
    </main>
  );
}
