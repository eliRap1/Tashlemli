"use client";

import { motion } from "motion/react";
import { SplitFlapBoard } from "../SplitFlapBoard";
import { ShekelCoin } from "../ShekelCoin";
import { BoardingPassCTA } from "../BoardingPassCTA";

interface RevealStageProps {
  amount_ils: number;
  passenger: string;
  flight: string;
  route: string;
  onContinue: () => void;
}

export function RevealStage({ amount_ils, passenger, flight, route, onContinue }: RevealStageProps) {
  const display = `₪${amount_ils.toLocaleString()}`.padStart(9, " ");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full min-h-[80vh] flex flex-col items-center justify-center gap-10 grain"
    >
      <ShekelCoin direction="up" delay={0.2} className="bottom-[10vh] left-[55%]" />

      <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/80">REVEAL · ENTITLEMENT</div>

      <div className="rounded-md border border-fluorescent/10 bg-black/85 px-7 py-6 shadow-[0_0_80px_rgba(0,0,0,0.7)]">
        <SplitFlapBoard states={[display]} intervalMs={99_999_999} size="xl" ariaLabel={`Entitlement: ${display}`} />
      </div>

      <h2
        className="font-heebo font-black tracking-tightest leading-[0.92] max-w-[20ch] text-center"
        style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
      >
        {passenger}, מגיע לך — <span className="text-reversal">ניקח את זה במקומך.</span>
      </h2>

      <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.3em] text-fluorescent/60">
        <span>{flight}</span><span>·</span><span>{route}</span>
      </div>

      <BoardingPassCTA href="#capture" size="lg" onClick={onContinue}>
        שלחו לי קישור במייל
      </BoardingPassCTA>

      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fluorescent/35">
        ללא הצלחה · ללא תשלום · 22% עמלה
      </span>
    </motion.div>
  );
}
