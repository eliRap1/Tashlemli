"use client";

import { useState } from "react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { CinematicSurface } from "../CinematicSurface";

interface Panel {
  variant: "boarding-pass" | "hourglass" | "passport" | "flight-path";
  title: string;
  caption: string;
  amount: string;
  flight: string;
}

const PANELS: Panel[] = [
  {
    variant: "boarding-pass",
    title: "Denied Boarding",
    caption: "סורבת לעלות. השדה היה מלא.",
    amount: "₪ 1,530",
    flight: "LY 0343 · TLV → LCA",
  },
  {
    variant: "hourglass",
    title: "Long Delay",
    caption: "5 שעות באולם הנוסעים.",
    amount: "₪ 2,450",
    flight: "LY 0086 · TLV → ATH",
  },
  {
    variant: "passport",
    title: "Cancellation",
    caption: "בוטלה 6 שעות לפני הטיסה.",
    amount: "₪ 3,670",
    flight: "U2 8123 · TLV → FRA",
  },
  {
    variant: "flight-path",
    title: "Re-routed",
    caption: "החזירו אותך דרך מסלול אחר.",
    amount: "₪ 2,100",
    flight: "TK 0785 · TLV → JFK",
  },
];

export function AreYouOwed() {
  return (
    <section className="relative bg-terminal py-32 sm:py-40 overflow-hidden" id="owed">
      <SectionHeader />
      <div className="mt-16 flex w-full snap-x snap-mandatory overflow-x-auto no-scrollbar gap-6 px-6 sm:px-12">
        {PANELS.map((p, i) => (
          <ScrollPanel key={i} panel={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 sm:px-12">
      <div className="flex flex-col gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">
          01 · ELIGIBILITY
        </span>
        <h2
          className="font-heebo font-black tracking-tightest leading-[0.95]"
          style={{ fontSize: "clamp(2.25rem, 5vw, 4.25rem)" }}
        >
          האם <span className="text-reversal">חייבים</span> לך כסף?
        </h2>
        <p className="font-heebo text-base sm:text-lg text-fluorescent/55 max-w-[44ch]">
          ארבע סיטואציות. כל אחת שווה אלפי שקלים. בדוק אילו מהן מתאימות לך.
        </p>
      </div>
    </div>
  );
}

function ScrollPanel({ panel, index }: { panel: Panel; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.9, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="snap-center shrink-0 w-[78vw] sm:w-[58vw] md:w-[42vw] lg:w-[28vw] aspect-[4/5] relative rounded-[20px] overflow-hidden ring-1 ring-fluorescent/8 bg-[#0c1118] cursor-pointer"
    >
      <CinematicSurface variant={panel.variant} grade="tenet" reverse className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-terminal via-terminal/30 to-transparent" />

      <div className="absolute top-5 left-5 right-5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.3em] text-fluorescent/55">
        <span>{`0${index + 1}`}</span>
        <span>{panel.flight}</span>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-reversal/80 mb-2">
          {panel.title}
        </div>
        <div className="font-heebo font-bold text-fluorescent text-2xl sm:text-3xl leading-tight">
          {panel.caption}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={hover ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 flex items-center gap-3 font-mono text-2xl sm:text-3xl text-reversal font-bold tabular-nums"
        >
          <span className="size-2 rounded-full bg-reversal" />
          {panel.amount}
        </motion.div>
      </div>
    </motion.div>
  );
}
