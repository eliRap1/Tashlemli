"use client";

import { motion } from "motion/react";
import { CinematicSurface } from "../CinematicSurface";
import { SplitFlapBoard } from "../SplitFlapBoard";
import { ShekelCoin } from "../ShekelCoin";
import { BoardingPassCTA } from "../BoardingPassCTA";

export function FinalCTA() {
  return (
    <section id="final" className="relative min-h-[92vh] overflow-hidden bg-terminal">
      <CinematicSurface variant="terminal" grade="enr" className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,14,20,0.7)_85%)]" />

      <ShekelCoin direction="down" delay={0.6} className="top-[12%] left-[52%]" />

      <div className="relative z-10 mx-auto max-w-[1080px] px-6 py-24 sm:py-36 flex flex-col items-center text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal mb-6">
          09 · OUTBOUND
        </span>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-md border border-fluorescent/10 bg-black/85 px-7 py-6 shadow-[0_0_80px_rgba(0,0,0,0.7)]"
        >
          <SplitFlapBoard
            states={["CANCELED", "ON  TIME", "PAID    ", "שולם   "]}
            intervalMs={2400}
            size="xl"
            ariaLabel="Final state: PAID"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 font-heebo font-black tracking-tightest leading-[0.92] max-w-[18ch]"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          הטיסה <span className="line-through text-fluorescent/40">בוטלה</span>.
          <br />
          הכסף <span className="text-reversal">בדרך.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, delay: 0.8 }}
          className="mt-12 animate-lime-pulse rounded-full"
        >
          <BoardingPassCTA href="/check" size="lg">
            בדוק את הטיסה שלך עכשיו
          </BoardingPassCTA>
        </motion.div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/40">
          60 שניות · ללא כרטיס אשראי · ללא הצלחה ללא תשלום
        </p>
      </div>
    </section>
  );
}
