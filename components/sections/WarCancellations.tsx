"use client";

import { motion } from "motion/react";
import { CinematicSurface } from "../CinematicSurface";
import { BoardingPassCTA } from "../BoardingPassCTA";

export function WarCancellations() {
  return (
    <section id="war" className="relative min-h-[88vh] overflow-hidden bg-[#1a0807]">
      <CinematicSurface variant="runway" grade="coral" className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e14] via-[#1a0807]/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-12 py-28 sm:py-36 flex flex-col items-end text-end">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-cancellation">
          04 · WAR CANCELLATIONS
        </span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 font-heebo font-black tracking-tightest leading-[0.92] max-w-[18ch]"
          style={{ fontSize: "clamp(2.5rem, 6.5vw, 5.5rem)" }}
        >
          התבטלה לך טיסה <br />
          <span className="text-cancellation">בגלל המצב?</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 font-heebo text-xl sm:text-2xl text-fluorescent max-w-[34ch]"
        >
          קיבלנו את זה. אנחנו <span className="text-reversal">מומחים בדיוק בזה.</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-heebo text-sm sm:text-base text-fluorescent/55 max-w-[44ch]"
        >
          אוקטובר 2023 ואילך. חיובים, פיצויים, החזרי כרטיס. כל סוגי החברות, כולל לואו-קוסט. שעות פתוחות 24/7.
        </motion.p>

        <div className="mt-10">
          <BoardingPassCTA href="#war-claim" size="lg" variant="lime">
            פתחו תיק עכשיו
          </BoardingPassCTA>
        </div>
      </div>
    </section>
  );
}
