"use client";

import { motion } from "motion/react";

interface ShekelCoinProps {
  direction?: "up" | "down";
  delay?: number;
  className?: string;
}

export function ShekelCoin({ direction = "up", delay = 1.4, className = "" }: ShekelCoinProps) {
  return (
    <motion.div
      className={`pointer-events-none absolute z-30 ${className}`}
      initial={{ y: direction === "up" ? 0 : -640, opacity: 0, rotateY: 0 }}
      animate={{
        y: direction === "up" ? -640 : 0,
        opacity: [0, 0.85, 0.85, 0],
        rotateY: 720,
      }}
      transition={{
        duration: 9,
        delay,
        ease: [0.42, 0, 0.58, 1],
        repeat: Infinity,
        repeatDelay: 1.6,
      }}
      aria-hidden="true"
    >
      <Coin />
    </motion.div>
  );
}

function Coin() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <defs>
        <radialGradient id="coinFace" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFE9A0" />
          <stop offset="40%" stopColor="#FFB547" />
          <stop offset="80%" stopColor="#A8761E" />
          <stop offset="100%" stopColor="#3A2A0A" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#coinFace)" stroke="#3A2A0A" strokeWidth="0.5" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        fontFamily="Heebo, sans-serif"
        fontWeight="900"
        fontSize="20"
        fill="#3A2A0A"
      >
        ₪
      </text>
    </svg>
  );
}
