"use client";

import { motion } from "motion/react";
import { CinematicSurface } from "../CinematicSurface";
import { SplitFlapBoard } from "../SplitFlapBoard";
import { ReverseTypeText } from "../ReverseTypeText";
import { ShekelCoin } from "../ShekelCoin";
import { BoardingPassCTA } from "../BoardingPassCTA";

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-terminal" id="hero">
      {/* Anamorphic 2.39:1 cinematic surface */}
      <CinematicSurface variant="terminal" grade="enr" className="absolute inset-0" />

      {/* Top + bottom anamorphic letterbox bars */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[8vh] bg-gradient-to-b from-black/95 to-transparent z-30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[10vh] bg-gradient-to-t from-black/95 to-transparent z-30" />

      {/* Departures board */}
      <div className="absolute top-[14vh] left-1/2 -translate-x-1/2 z-20 px-4 sm:px-8">
        <DeparturesBoard />
      </div>

      {/* Floating shekel coin from polished floor */}
      <ShekelCoin direction="up" delay={1.4} className="bottom-[18vh] left-[58%]" />
      <ShekelCoin direction="up" delay={5.2} className="bottom-[14vh] left-[42%]" />

      {/* Headline + sub + CTA — sits below board, above letterbox */}
      <div className="relative z-40 flex min-h-screen flex-col items-center justify-end pb-[18vh] px-6 text-center">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-heebo font-black text-fluorescent leading-[0.92] tracking-tightest"
          style={{ fontSize: "clamp(3rem, 8.5vw, 7.5rem)" }}
        >
          <span className="block">
            <ReverseTypeText text="הטיסה התבטלה." className="text-fluorescent" startDelayMs={500} charDurationMs={42} />
          </span>
          <span className="block mt-2">
            <ReverseTypeText
              text="הכסף בדרך."
              className="text-reversal"
              startDelayMs={2200}
              charDurationMs={42}
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 3.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 font-heebo font-light text-base sm:text-lg md:text-xl text-fluorescent/75 max-w-[42ch]"
        >
          בדוק עכשיו, חינם, ב-60 שניות. ללא הצלחה, ללא תשלום.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 3.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9"
        >
          <BoardingPassCTA href="#calculator" size="lg">
            בדיקת זכאות מיידית
          </BoardingPassCTA>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 4.6 }}
          className="mt-12 flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.3em] text-fluorescent/40"
        >
          <span>03:47 BG / TLV</span>
          <span className="size-1 rounded-full bg-reversal animate-lime-pulse" />
          <span>EU 261 · IL CONSUMER LAW</span>
        </motion.div>
      </div>

      {/* Subtle terminal hum overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(255,181,71,0.04),transparent)] mix-blend-screen" />
    </section>
  );
}

function DeparturesBoard() {
  return (
    <div className="rounded-md border border-fluorescent/10 bg-black/80 px-4 sm:px-7 py-5 sm:py-6 shadow-[0_0_60px_rgba(0,0,0,0.7)] backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.32em] text-fluorescent/55">
        <span>BEN GURION · TERMINAL 3</span>
        <span className="flex items-center gap-2">
          <span className="size-1 rounded-full bg-cancellation animate-pulse" />
          LIVE · 03:47:08
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <SplitFlapBoard
          states={["CANCELED", "CANCELED", "ON  TIME", "ON  TIME"]}
          intervalMs={3200}
          reverse
          size="lg"
          ariaLabel="Flight status reversing from CANCELED to ON TIME"
        />
        <div className="flex items-center gap-6 mt-2 text-[10px] sm:text-xs font-mono text-fluorescent/55">
          <span>LY 0343 → LCA</span>
          <span>·</span>
          <span>22:40</span>
          <span>·</span>
          <span>GATE C7</span>
        </div>
      </div>
    </div>
  );
}
