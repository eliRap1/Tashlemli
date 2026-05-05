"use client";

import { motion } from "motion/react";

const TODAY = new Date().toISOString().slice(0, 10);

const ROUTES = [
  { code: "LY 0381", route: "TLV → ATH",  airline: "EL AL",      tag: "פופולרי",    delay: "5h 12m" },
  { code: "LH 686",  route: "TLV → FRA",  airline: "Lufthansa",  tag: "מעוכב היום", delay: "3h 40m" },
  { code: "U2 8123", route: "TLV → ATH",  airline: "easyJet",    tag: "ביטול",      delay: "—" },
  { code: "TK 785",  route: "TLV → IST",  airline: "Turkish",    tag: "מעוכב היום", delay: "4h 05m" },
];

interface Props {
  onPick: (flight: string, date: string) => void;
}

export function QuickRoutes({ onPick }: Props) {
  return (
    <div className="mx-auto w-[min(820px,92vw)] mt-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/80">FAST · 4 פופולריים היום</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/40">לחיצה = חישוב מיידי</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROUTES.map((r, i) => (
          <motion.button
            key={r.code}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onPick(r.code, TODAY)}
            className="group rounded-2xl bg-black/55 ring-1 ring-fluorescent/10 hover:ring-reversal/60 p-4 text-start transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/45">{r.airline}</span>
              <span className={`font-mono text-[9px] uppercase tracking-[0.3em] ${r.tag === "ביטול" ? "text-cancellation" : "text-reversal/85"}`}>
                {r.tag}
              </span>
            </div>
            <div className="font-mono text-fluorescent text-lg font-bold tabular-nums leading-none">{r.code}</div>
            <div className="font-mono text-[11px] text-fluorescent/60 mt-1">{r.route}</div>
            <div className="font-mono text-reversal text-sm mt-3 tabular-nums">{r.delay}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
