"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Globe } from "../Globe";
import { SplitFlapBoard } from "../SplitFlapBoard";
import { BoardingPassCTA } from "../BoardingPassCTA";

const ROUTES = [
  { code: "LCA", label: "TLV → LCA · Larnaca", amount: "₪ 1,530" },
  { code: "ATH", label: "TLV → ATH · Athens", amount: "₪ 2,450" },
  { code: "FRA", label: "TLV → FRA · Frankfurt", amount: "₪ 3,670" },
  { code: "JFK", label: "TLV → JFK · New York", amount: "₪ 4,200" },
  { code: "BKK", label: "TLV → BKK · Bangkok", amount: "₪ 3,950" },
];

export function Calculator() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setActive((a) => (a + 1) % ROUTES.length);
    }, 4200);
    return () => window.clearInterval(t);
  }, []);

  const amounts = ROUTES.map((r) => r.amount.replace("₪ ", "₪").padStart(7, " "));

  return (
    <section className="relative py-32 sm:py-40 bg-terminal overflow-hidden" id="calculator">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="flex flex-col gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">
                02 · CALCULATOR
              </span>
              <h2
                className="font-heebo font-black tracking-tightest leading-[0.95]"
                style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)" }}
              >
                כל יעד.
                <br />
                <span className="text-reversal">סכום מדויק.</span>
              </h2>
              <p className="font-heebo text-base sm:text-lg text-fluorescent/55 max-w-[44ch]">
                כל מסלול מוחזר אל בן-גוריון. הסכום שלך מבוסס על מרחק, סוג העיכוב, ופסיקה ישראלית עדכנית.
              </p>

              <div className="mt-8 rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/10 p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/45 mb-3">
                  ESTIMATED RECOVERY
                </div>
                <SplitFlapBoard
                  states={amounts}
                  intervalMs={4200}
                  size="lg"
                  ariaLabel="Estimated compensation per route"
                />
                <div className="mt-4 flex items-center gap-3 text-xs font-mono text-fluorescent/50">
                  <span className="size-1.5 rounded-full bg-reversal animate-lime-pulse" />
                  {ROUTES[active].label}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <BoardingPassCTA href="/check" size="lg">
                  בדיקה לפי הטיסה שלך
                </BoardingPassCTA>
                <span className="text-xs font-mono uppercase tracking-[0.3em] text-fluorescent/40">
                  60 שניות · ללא כרטיס אשראי
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-square max-w-[640px] mx-auto"
            >
              <Globe activeIndex={active} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
