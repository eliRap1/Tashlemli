"use client";

import { useEffect, useRef, useState } from "react";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ·0123456789".split("");

function pickPath(from: string, to: string): string[] {
  const fi = CHARSET.indexOf(from);
  const ti = CHARSET.indexOf(to);
  if (fi < 0 || ti < 0) return [to];
  const path: string[] = [];
  let i = fi;
  const dir = fi > ti ? -1 : 1;
  while (i !== ti) {
    i = (i + dir + CHARSET.length) % CHARSET.length;
    path.push(CHARSET[i]);
  }
  return path;
}

function FlapChar({ from, to, delay = 0, reverse = false }: { from: string; to: string; delay?: number; reverse?: boolean }) {
  const [current, setCurrent] = useState(from);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrent(from);
    const path = reverse ? pickPath(from, to).reverse() : pickPath(from, to);
    let idx = 0;
    const startAt = window.setTimeout(() => {
      timerRef.current = window.setInterval(() => {
        if (idx >= path.length) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setCurrent(to);
          return;
        }
        setCurrent(path[idx]);
        idx += 1;
      }, 78);
    }, delay);
    return () => {
      window.clearTimeout(startAt);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [from, to, delay, reverse]);

  return (
    <span className="split-flap-char" aria-hidden="true">
      {current === " " ? " " : current}
    </span>
  );
}

interface SplitFlapBoardProps {
  states: string[];
  intervalMs?: number;
  reverse?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  charSpacing?: number;
  ariaLabel?: string;
}

export function SplitFlapBoard({
  states,
  intervalMs = 3600,
  reverse = false,
  size = "md",
  charSpacing = 70,
  ariaLabel,
}: SplitFlapBoardProps) {
  const [stateIdx, setStateIdx] = useState(0);
  const sizeMap = {
    sm: "text-2xl",
    md: "text-4xl md:text-6xl",
    lg: "text-6xl md:text-8xl",
    xl: "text-7xl md:text-[10rem]",
  };

  useEffect(() => {
    const t = window.setInterval(() => {
      setStateIdx((s) => (s + 1) % states.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [states.length, intervalMs]);

  const max = states.reduce((m, s) => Math.max(m, s.length), 0);
  const current = states[stateIdx].padEnd(max, " ");
  const next = states[(stateIdx + 1) % states.length].padEnd(max, " ");

  return (
    <div
      className={`split-flap font-mono font-bold ${sizeMap[size]}`}
      role="img"
      aria-label={ariaLabel ?? states.join(" → ")}
    >
      {current.split("").map((ch, i) => (
        <FlapChar
          key={`${stateIdx}-${i}`}
          from={ch}
          to={next[i]}
          delay={i * charSpacing}
          reverse={reverse}
        />
      ))}
    </div>
  );
}
