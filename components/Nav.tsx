"use client";

import { useEffect, useState } from "react";
import { LoginDialog } from "@/components/auth/LoginDialog";

const LINKS = [
  { label: "מחשבון", href: "#calculator" },
  { label: "איך זה עובד", href: "#how" },
  { label: "ביטולי מלחמה", href: "#war" },
  { label: "אנחנו vs האחרים", href: "#vs" },
  { label: "שאלות", href: "#faq" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      dir="rtl"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-terminal/80 backdrop-blur-md border-b border-fluorescent/8" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-12 h-16 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-reversal animate-lime-pulse" />
          <span className="font-heebo font-black text-fluorescent text-xl tracking-tightest">
            תשלם לי
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 font-heebo text-sm text-fluorescent/65">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-reversal transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLoginOpen(true)}
            className="rounded-full border border-fluorescent/20 text-fluorescent/70 px-4 py-2 font-heebo text-sm hover:text-reversal hover:border-reversal transition"
          >
            כניסה
          </button>
          <a
            href="/check"
            className="rounded-full bg-reversal text-terminal px-5 py-2 font-heebo font-bold text-sm hover:brightness-110 transition"
          >
            בדיקה חינם
          </a>
        </div>
      </div>
      {loginOpen && <LoginDialog onClose={() => setLoginOpen(false)} />}
    </nav>
  );
}
