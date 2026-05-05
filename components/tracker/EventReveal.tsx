"use client";

import { AnimatePresence, motion } from "motion/react";
import type { PublicEvent } from "@/services/tracker/publicView";
import { ShekelCoin } from "@/components/ShekelCoin";

export function EventReveal({ latest }: { latest: PublicEvent | null }) {
  return (
    <AnimatePresence mode="wait">
      {latest && (
        <motion.div
          key={latest.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-20"
        >
          {latest.code === "demand.sent" && <Envelope direction="out" />}
          {latest.code === "airline.delivered" && <Envelope direction="open" />}
          {latest.code === "airline.replied" && <Envelope direction="in" />}
          {latest.code === "settlement.offered" && <SettlementCounter amount={latest.metadata?.offered_amount_ils ?? 0} />}
          {latest.code === "payout.complete" && <ShekelCoin direction="down" delay={0.2} className="bottom-[20%] left-[48%]" />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Envelope({ direction }: { direction: "out" | "in" | "open" }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.svg
        width="80" height="56" viewBox="0 0 80 56"
        initial={{ x: direction === "in" ? 200 : direction === "out" ? -200 : 0, opacity: 0, scale: direction === "open" ? 1 : 0.6 }}
        animate={{ x: 0, opacity: 1, scale: direction === "open" ? 1.2 : 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect x={1} y={1} width={78} height={54} fill="#F5F5F0" stroke="#0a0e14" strokeWidth={1.5} />
        <path d="M 1 1 L 40 32 L 79 1" fill="none" stroke="#0a0e14" strokeWidth={1.5} />
      </motion.svg>
    </div>
  );
}

function SettlementCounter({ amount }: { amount: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="font-mono text-reversal text-7xl font-bold tabular-nums">
        ₪ {amount.toLocaleString()}
      </div>
    </div>
  );
}
