"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Testimonial {
  name: string;
  role: string;
  flight: string;
  amount: string;
  quote: string;
  initials: string;
}

const T: Testimonial[] = [
  {
    name: "נועה כהן",
    role: "תל אביב · אם לשניים",
    flight: "LY 0343 · TLV→LCA",
    amount: "₪ 2,450",
    quote:
      "טסנו לחופשה משפחתית, הטיסה בוטלה 3 שעות לפני. תוך שבעה ימים הכסף היה בחשבון. בלי שיחות מתסכלות, בלי ניירת.",
    initials: "נכ",
  },
  {
    name: "יוסף בן-דוד",
    role: "ירושלים · רב",
    flight: "LH 1812 · TLV→FRA",
    amount: "₪ 3,670",
    quote:
      "התעכבתי 8 שעות ב-Frankfurt. הם דיברו עברית. הם פתרו את זה בעברית. השאר נסעו לרצוצסקי.",
    initials: "יב",
  },
  {
    name: "מתן לוי",
    role: "באר שבע · חייל בחופשה",
    flight: "TK 0785 · TLV→IST",
    amount: "₪ 1,820",
    quote:
      "ביטלו את הטיסה בגלל המצב. הם הוציאו את הזכות שלי גם מטורקיש. חשבתי שזה אבוד.",
    initials: "מל",
  },
  {
    name: "אנה גולדמן",
    role: "חיפה · סבתא",
    flight: "U2 8123 · TLV→ATH",
    amount: "₪ 2,950",
    quote:
      "אני לא טכנולוגית. שלחתי תמונה של הכרטיס ב-WhatsApp, וזהו. הכל בעברית רגילה, לא משפטית.",
    initials: "אג",
  },
];

export function Testimonials() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % T.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section id="voices" className="relative py-32 sm:py-40 bg-[radial-gradient(ellipse_at_center,#0d121a_0%,#070a0f_75%)] overflow-hidden">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-12">
        <div className="mb-16 flex items-end justify-between flex-wrap gap-6">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">
              06 · VOICES
            </span>
            <h2
              className="mt-3 font-heebo font-black tracking-tightest leading-[0.95]"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4.25rem)" }}
            >
              ישראלים <span className="text-reversal">שקיבלו את הכסף.</span>
            </h2>
          </div>
          <Pager active={idx} total={T.length} onSelect={setIdx} />
        </div>

        <div className="relative h-[60vh] sm:h-[64vh] perspective-[1600px]">
          <AnimatePresence mode="popLayout">
            {T.map((t, i) => {
              const offset = i - idx;
              const isActive = offset === 0;
              const z = -Math.abs(offset);
              if (Math.abs(offset) > 2) return null;
              return (
                <motion.article
                  key={t.name}
                  initial={{ opacity: 0, scale: 0.9, rotateY: 8 }}
                  animate={{
                    opacity: isActive ? 1 : 0.32,
                    scale: isActive ? 1 : 0.92,
                    rotateY: offset * -8,
                    z: z * 60,
                    x: offset * 36,
                  }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 mx-auto max-w-[760px] rounded-[28px] bg-[#0c1118] ring-1 ring-fluorescent/12 p-8 sm:p-12 flex flex-col justify-between"
                  style={{ transformStyle: "preserve-3d", zIndex: 100 - Math.abs(offset) }}
                >
                  <div>
                    <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/45">
                      <span>{t.flight}</span>
                      <span>·</span>
                      <span className="text-reversal">{t.amount}</span>
                    </div>
                    <p className="mt-8 font-heebo font-light text-2xl sm:text-3xl leading-[1.35] text-fluorescent/95">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div className="mt-10 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-gradient-to-br from-[#FFB547] to-[#0B2545] grid place-items-center font-heebo font-black text-terminal text-base">
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-heebo font-bold text-fluorescent">{t.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fluorescent/45 mt-1">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Pager({ active, total, onSelect }: { active: number; total: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`h-px transition-all duration-500 ${
            i === active ? "w-12 bg-reversal" : "w-6 bg-fluorescent/20"
          }`}
          aria-label={`Voice ${i + 1}`}
        />
      ))}
    </div>
  );
}
