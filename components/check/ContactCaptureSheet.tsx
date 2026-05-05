"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface Props {
  jobId: string;
  onSuccess: (trackerUrl: string) => void;
}

export function ContactCaptureSheet({ jobId, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch(`/api/eligibility/${jobId}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "fail"); return; }
    onSuccess(j.tracker_url);
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-10 flex w-[min(560px,92vw)] flex-col gap-3"
    >
      <label className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/55">EMAIL FOR TRACKING LINK</label>
      <input
        type="email" required dir="ltr" value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-full bg-black/60 border border-fluorescent/12 px-6 py-4 font-mono text-base text-fluorescent placeholder:text-fluorescent/35 focus:border-reversal focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy}
        className="mt-2 self-start rounded-full bg-reversal px-7 py-4 font-heebo font-bold text-terminal disabled:opacity-50"
      >
        {busy ? "שולח…" : "שלחו לי את הקישור"}
      </button>
      {err && <div className="font-mono text-xs text-cancellation">{err}</div>}
    </motion.form>
  );
}
