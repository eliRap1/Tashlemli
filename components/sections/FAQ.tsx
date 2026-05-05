"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const QA = [
  {
    q: "כמה זה עולה?",
    a: "22% עמלה מתוך הסכום שתקבלי. אם לא קיבלת כלום, את לא משלמת כלום. אין מס נוסף, אין תשלום מקדמה.",
  },
  {
    q: "כמה זמן זה לוקח?",
    a: "תיק ממוצע נסגר בתוך 7 ימים. תיקים מורכבים, כולל ביטולי מלחמה, יכולים להגיע ל-21 יום. עדכון בכל שלב ב-WhatsApp.",
  },
  {
    q: "אילו טיסות מזכות בפיצוי?",
    a: "טיסות שיצאו מישראל, חזרו לישראל, או הופעלו על ידי חברה ישראלית. עיכוב מעל 3 שעות, ביטול עד 14 יום לפני, או סירוב עלייה לטיסה.",
  },
  {
    q: "האם ביטולי מלחמה מזכים?",
    a: "כן. יש לנו את העילות הספציפיות. גם אם החברה אומרת ׳נסיבות יוצאות דופן׳, יש פסיקה ישראלית עדכנית שמחייבת אותם בכל זאת.",
  },
  {
    q: "מה אם הטיסה הייתה לפני שנתיים?",
    a: "תקופת ההתיישנות בישראל היא 4 שנים. רוב הטיסות עדיין רלוונטיות. צריך מספר טיסה ותאריך, זה הכל.",
  },
  {
    q: "מה אם החברה כבר סירבה לי?",
    a: "טוב יותר. סירוב כתוב הוא ההוכחה שלנו. שלחי לנו צילום מסך, אנחנו ממשיכים מאיפה שעצרת.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative bg-terminal py-28 sm:py-36">
      <div className="mx-auto max-w-[920px] px-6 sm:px-12">
        <header className="mb-14">
          <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">
            08 · QUESTIONS
          </span>
          <h2
            className="mt-3 font-heebo font-black tracking-tightest leading-[0.95]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4.25rem)" }}
          >
            לפני שתשאלו.
          </h2>
        </header>

        <ul className="divide-y divide-fluorescent/8 border-y border-fluorescent/8">
          {QA.map((item, i) => (
            <FaqRow key={i} q={item.q} a={item.a} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function FaqRow({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const [typedA, setTypedA] = useState("");

  function toggle() {
    if (!open) {
      setTypedA("");
      let i = 0;
      const id = window.setInterval(() => {
        i += 2;
        setTypedA(a.slice(0, i));
        if (i >= a.length) window.clearInterval(id);
      }, 12);
    }
    setOpen((v) => !v);
  }

  return (
    <li>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-6 py-7 text-start group"
        aria-expanded={open}
      >
        <span className="font-heebo font-bold text-xl sm:text-2xl text-fluorescent group-hover:text-reversal transition-colors">
          {q}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-fluorescent/40 flex items-center gap-3">
          <span>{`0${index + 1}`}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block size-6 grid place-items-center"
          >
            <span className="block w-5 h-px bg-fluorescent/60" />
            <span className="block w-px h-5 bg-fluorescent/60 -mt-px" />
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 pe-12 font-heebo text-base sm:text-lg text-fluorescent/65 leading-[1.6] max-w-[60ch]">
              {typedA}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
