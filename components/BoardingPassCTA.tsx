"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

interface BoardingPassCTAProps {
  children: ReactNode;
  href?: string;
  variant?: "lime" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function BoardingPassCTA({
  children,
  href = "#check",
  variant = "lime",
  size = "md",
  onClick,
}: BoardingPassCTAProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate(${dx * 0.18}px, ${dy * 0.22}px)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  const sizeClass = {
    sm: "px-5 py-2 text-sm",
    md: "px-7 py-3.5 text-base",
    lg: "px-10 py-5 text-lg",
  }[size];

  const variantClass =
    variant === "lime"
      ? "bg-reversal text-terminal hover:brightness-110"
      : "bg-transparent text-fluorescent border border-fluorescent/40 hover:border-reversal hover:text-reversal";

  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`magnetic-cta inline-flex items-center gap-3 rounded-full font-heebo font-bold uppercase tracking-tight ${sizeClass} ${variantClass} transition-[filter,box-shadow,border-color] duration-300`}
      style={{ willChange: "transform" }}
    >
      <span className="relative z-10">{children}</span>
      <ArrowGlyph />
    </a>
  );
}

function ArrowGlyph() {
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 22 14"
      fill="none"
      className="rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path
        d="M1 7H20M14 1L20 7L14 13"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
