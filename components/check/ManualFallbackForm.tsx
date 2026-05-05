"use client";

import { useImperativeHandle, useState, forwardRef } from "react";
import { motion } from "motion/react";

export interface ManualResult {
  jobId: string;
  result: { eligible: boolean; amount_ils: number; rejection_reason?: string };
  passenger: string;
  flight: string;
  route: string;
}

interface Props {
  onResult: (out: ManualResult) => void;
  onError: (code: string) => void;
}

export interface ManualFallbackHandle {
  fill: (flight: string, date?: string) => void;
  submit: () => void;
}

export const ManualFallbackForm = forwardRef<ManualFallbackHandle, Props>(function ManualFallbackForm({ onResult, onError }, ref) {
  const today = new Date().toISOString().slice(0, 10);
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(flightNumber: string, departureDate: string) {
    if (!flightNumber || !departureDate) return;
    setBusy(true); setErr(null);
    const r = await fetch("/api/eligibility/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        flight_number: flightNumber.toUpperCase().replace(/\s+/g, " ").trim(),
        departure_date: departureDate,
      }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(j.error ?? "fail"); onError(j.error ?? "fail"); return; }
    onResult({ jobId: j.jobId, result: j.result, passenger: j.passenger, flight: j.flight, route: j.route });
  }

  useImperativeHandle(ref, () => ({
    fill: (f: string, d?: string) => { setFlight(f); if (d) setDate(d); },
    submit: () => { run(flight, date); },
  }), [flight, date]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(flight, date);
  }

  return (
    <motion.form
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      onSubmit={onSubmit}
      className="mx-auto mt-8 flex w-[min(640px,92vw)] flex-col gap-4 rounded-2xl bg-black/55 ring-1 ring-fluorescent/10 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/55">MANUAL · FLIGHT + DATE</div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-reversal/70">העיכוב נמשך אוטומטית</div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          required dir="ltr" placeholder="LY 0381"
          value={flight} onChange={(e) => setFlight(e.target.value)}
          className="flex-1 rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-base text-fluorescent placeholder:text-fluorescent/35 focus:border-reversal focus:outline-none"
        />
        <input
          required type="date" dir="ltr"
          value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-full bg-black/60 border border-fluorescent/12 px-5 py-3 font-mono text-base text-fluorescent focus:border-reversal focus:outline-none"
        />
      </div>
      <button type="submit" disabled={busy} className="self-start rounded-full bg-reversal px-7 py-4 font-heebo font-bold text-terminal disabled:opacity-50 transition">
        {busy ? "מחשב…" : "חשב לי"}
      </button>
      {err && <div className="font-mono text-xs text-cancellation">{err}</div>}
    </motion.form>
  );
});
