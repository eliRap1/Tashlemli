"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const ROWS = [
  { label: "עמלה", us: "22%", them: "35–50%" },
  { label: "שפה", us: "עברית מלידה", them: "תרגום אוטומטי" },
  { label: "התמחות", us: "דין ישראלי", them: "אירופה / כללי" },
  { label: "ביטולי מלחמה", us: "כן", them: "לא" },
  { label: "תשלום", us: "7 ימים", them: "4–8 חודשים" },
  { label: "תמיכה", us: "WhatsApp 24/7", them: "מייל בלבד" },
];

export function VsOthers() {
  return (
    <section id="vs" className="relative bg-terminal py-32 sm:py-40">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-12">
        <header className="mb-14 sm:mb-20">
          <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">
            05 · VERDICT
          </span>
          <h2
            className="mt-4 font-heebo font-black tracking-tightest leading-[0.95]"
            style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
          >
            תשלם לי <span className="text-reversal">נגד</span> השאר.
          </h2>
        </header>

        <div className="rounded-[28px] ring-1 ring-fluorescent/10 overflow-hidden">
          <div className="grid grid-cols-12 bg-[#0c1118] border-b border-fluorescent/10 font-mono text-[10px] uppercase tracking-[0.36em] text-fluorescent/55">
            <div className="col-span-4 px-5 sm:px-8 py-5">קריטריון</div>
            <div className="col-span-4 px-5 sm:px-8 py-5 text-reversal flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-reversal animate-lime-pulse" />
              תשלם לי
            </div>
            <div className="col-span-4 px-5 sm:px-8 py-5 text-fluorescent/40">המתחרים</div>
          </div>
          {ROWS.map((row, i) => (
            <Row key={row.label} row={row} index={i} />
          ))}
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/40 text-end">
          *פסיקה — נכנסת בזמן אמת
        </p>
      </div>
    </section>
  );
}

function Row({ row, index }: { row: (typeof ROWS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6, once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-12 border-b border-fluorescent/6 last:border-0 hover:bg-fluorescent/[0.02] transition-colors"
    >
      <div className="col-span-4 px-5 sm:px-8 py-6 font-heebo text-base sm:text-lg text-fluorescent/70">
        {row.label}
      </div>
      <div className="col-span-4 px-5 sm:px-8 py-6 flex items-center gap-3 font-heebo font-bold text-base sm:text-lg text-fluorescent">
        {inView && <CheckMark delay={index * 0.08 + 0.2} />}
        <span>{row.us}</span>
      </div>
      <motion.div
        initial={{ opacity: 1 }}
        animate={inView ? { opacity: 0.32 } : { opacity: 1 }}
        transition={{ duration: 0.9, delay: index * 0.08 + 0.4 }}
        className="col-span-4 px-5 sm:px-8 py-6 font-heebo text-base sm:text-lg text-fluorescent/55 line-through"
      >
        {row.them}
      </motion.div>
    </motion.div>
  );
}

function CheckMark({ delay }: { delay: number }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className="draw-check"
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <path
        d="M3 11.5L8.5 17L19 5"
        stroke="#C6F432"
        strokeWidth="2.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
