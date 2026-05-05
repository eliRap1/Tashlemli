"use client";

import { useState } from "react";
import { motion } from "motion/react";

interface Props { onJob: (jobId: string, sseUrl: string) => void; }

export function ManualFallbackForm({ onJob }: Props) {
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState("");
  const [delay, setDelay] = useState<number | "">("");
  const [cancel, setCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const r = await fetch("/api/eligibility/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        flight_number: flight.toUpperCase(),
        departure_date: date,
        delay_minutes: delay === "" ? undefined : Number(delay),
        cancellation: cancel,
      }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "fail"); return; }
    onJob(j.jobId, j.sseUrl);
  }

  return (
    <motion.form
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      onSubmit={submit}
      className="mx-auto mt-8 flex w-[min(640px,92vw)] flex-col gap-4 rounded-2xl bg-black/55 ring-1 ring-fluorescent/10 p-6"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/55">MANUAL · 3 FIELDS</div>
      <input
        required dir="ltr" placeholder="LY 0381"
        value={flight} onChange={(e) => setFlight(e.target.value)}
        className="rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-base text-fluorescent placeholder:text-fluorescent/35 focus:border-reversal focus:outline-none"
      />
      <input
        required type="date" dir="ltr"
        value={date} onChange={(e) => setDate(e.target.value)}
        className="rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-base text-fluorescent focus:border-reversal focus:outline-none"
      />
      <div className="flex gap-3">
        <input
          type="number" min={0} dir="ltr" placeholder="delay minutes"
          value={delay} onChange={(e) => setDelay(e.target.value === "" ? "" : Number(e.target.value))}
          className="flex-1 rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-base text-fluorescent placeholder:text-fluorescent/35 focus:border-reversal focus:outline-none"
        />
        <label className="flex items-center gap-2 font-heebo text-fluorescent/65 text-sm">
          <input type="checkbox" checked={cancel} onChange={(e) => setCancel(e.target.checked)} className="accent-reversal" />
          ביטול
        </label>
      </div>
      <button type="submit" disabled={busy} className="self-start rounded-full bg-reversal px-7 py-4 font-heebo font-bold text-terminal disabled:opacity-50">
        {busy ? "מחשב…" : "חשב לי"}
      </button>
      {err && <div className="font-mono text-xs text-cancellation">{err}</div>}
    </motion.form>
  );
}
