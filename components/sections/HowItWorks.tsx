"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { CinematicSurface } from "../CinematicSurface";

const PANELS = [
  {
    step: "01",
    eyebrow: "TAKEOVER",
    title: "אנחנו לוקחים את הטיסה שלך.",
    body: "תפסיקי להתנצח עם נציג. ההודעה הזועמת שלך נמחקת, אנחנו פותחים את התיק תוך 90 שניות.",
    variant: "phone" as const,
    grade: "tenet" as const,
  },
  {
    step: "02",
    eyebrow: "PURSUIT",
    title: "עורכי דין ישראלים ממשיכים לרוץ.",
    body: "מטוס נייר חוצה את כל אולם בן-גוריון. הוא לא נעצר עד שהסכום נכנס.",
    variant: "corridor" as const,
    grade: "enr" as const,
  },
  {
    step: "03",
    eyebrow: "PAYOUT",
    title: "₪2,450 התקבלו.",
    body: "התראה ב-Bit. מטבע אחד נופל בחזרה לכף היד. שבע ימים. בלי טפסים.",
    variant: "phone" as const,
    grade: "amber" as const,
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.6%"]);

  return (
    <section id="how" ref={ref} className="relative h-[300vh] bg-terminal" aria-label="How it works">
      <div className="sticky top-0 h-screen overflow-hidden">
        <header className="absolute top-10 right-6 sm:right-12 z-30 flex flex-col items-end">
          <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">
            03 · HOW IT WORKS
          </span>
          <h2
            className="mt-3 font-heebo font-black tracking-tightest leading-[0.95] text-end"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            שלושה פריימים. סוף.
          </h2>
        </header>

        <motion.div className="flex h-full" style={{ x, width: "300%" }}>
          {PANELS.map((p) => (
            <Panel key={p.step} {...p} />
          ))}
        </motion.div>

        <footer className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-fluorescent/40">
          <span className="size-1 rounded-full bg-reversal animate-lime-pulse" />
          GLIDE
          <span className="ms-3">scroll →</span>
        </footer>
      </div>
    </section>
  );
}

function Panel({
  step,
  eyebrow,
  title,
  body,
  variant,
  grade,
}: (typeof PANELS)[number]) {
  return (
    <div className="relative h-full w-1/3 shrink-0 grow-0 px-6 sm:px-12 flex items-center justify-center">
      <div className="relative w-full h-[78vh] rounded-[24px] overflow-hidden ring-1 ring-fluorescent/8 bg-[#0c1118]">
        <CinematicSurface variant={variant} grade={grade} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-terminal via-terminal/50 to-transparent" />
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/80 z-10">
          STEP {step} · {eyebrow}
        </div>
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 z-10">
          <h3
            className="font-heebo font-black tracking-tightest leading-[0.95] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3.6vw, 3.25rem)" }}
          >
            {title}
          </h3>
          <p className="font-heebo text-base sm:text-lg text-fluorescent/65 max-w-[40ch]">{body}</p>
        </div>
      </div>
    </div>
  );
}
