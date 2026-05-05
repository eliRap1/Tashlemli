"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface Destination {
  code: string;
  city: string;
  amount: number;
  /** projected screen offset from globe center, in % of globe radius */
  x: number;
  y: number;
}

const TLV = { x: 0, y: 0 };

const DESTINATIONS: Destination[] = [
  { code: "LCA", city: "Larnaca", amount: 1530, x: 14, y: -8 },
  { code: "ATH", city: "Athens", amount: 2450, x: 20, y: -22 },
  { code: "FRA", city: "Frankfurt", amount: 3670, x: -32, y: -54 },
  { code: "JFK", city: "New York", amount: 4200, x: -86, y: -38 },
  { code: "BKK", city: "Bangkok", amount: 3950, x: 78, y: -16 },
];

export function Globe({ activeIndex }: { activeIndex: number }) {
  const [rot, setRot] = useState(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setRot((r) => (r + dt * 6) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const active = DESTINATIONS[activeIndex % DESTINATIONS.length];

  return (
    <div className="relative aspect-square w-full">
      {/* Starless void background */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,#0a0e14_0%,#020306_85%)]" />

      {/* Globe sphere */}
      <div className="absolute inset-[12%] rounded-full overflow-hidden ring-1 ring-reversal/8 shadow-[inset_18px_0_60px_rgba(0,0,0,0.7),inset_-30px_0_50px_rgba(11,37,69,0.4),0_30px_120px_rgba(0,0,0,0.6)] bg-[radial-gradient(ellipse_at_30%_25%,#1a2436_0%,#070a10_70%)]">
        {/* Latitudes */}
        <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="globeOcean" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#1a2436" />
              <stop offset="100%" stopColor="#040608" />
            </radialGradient>
          </defs>
          <circle cx="0" cy="0" r="98" fill="url(#globeOcean)" />
          {[-60, -30, 0, 30, 60].map((lat) => (
            <ellipse
              key={lat}
              cx="0"
              cy="0"
              rx="98"
              ry={Math.abs(98 * Math.cos((lat * Math.PI) / 180))}
              fill="none"
              stroke="#1d2740"
              strokeWidth="0.4"
              opacity="0.5"
              transform={`translate(0, ${lat * 0.6})`}
            />
          ))}
          {[0, 30, 60, 90, 120, 150].map((lon) => {
            const phase = lon + rot;
            const rx = Math.abs(98 * Math.sin((phase * Math.PI) / 180));
            return (
              <ellipse
                key={lon}
                cx="0"
                cy="0"
                rx={rx}
                ry="98"
                fill="none"
                stroke="#1d2740"
                strokeWidth="0.4"
                opacity={Math.cos((phase * Math.PI) / 180) > 0 ? 0.55 : 0.18}
              />
            );
          })}
          {/* Israel pulse */}
          <g transform={`rotate(${-rot * 0.3})`}>
            <circle cx="22" cy="-12" r="2.4" fill="#C6F432">
              <animate attributeName="r" values="2.4;5.2;2.4" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="22" cy="-12" r="1.2" fill="#C6F432" />
          </g>
        </svg>
      </div>

      {/* Hard rim-light from upper-left */}
      <div className="absolute inset-[12%] rounded-full pointer-events-none mix-blend-screen bg-[radial-gradient(ellipse_at_28%_22%,rgba(245,245,240,0.18),transparent_55%)]" />

      {/* Arc paths drawn from each destination back to TLV */}
      <svg viewBox="-100 -100 200 200" className="absolute inset-[12%] h-[76%] w-[76%] left-[12%] top-[12%]" style={{ overflow: "visible" }}>
        <g>
          {DESTINATIONS.map((d, i) => {
            const isActive = i === activeIndex % DESTINATIONS.length;
            const cx = (d.x + TLV.x) / 2;
            const cy = (d.y + TLV.y) / 2 - Math.hypot(d.x - TLV.x, d.y - TLV.y) * 0.6;
            return (
              <motion.path
                key={d.code}
                d={`M ${d.x} ${d.y} Q ${cx} ${cy} ${TLV.x} ${TLV.y}`}
                fill="none"
                stroke={isActive ? "#FFB547" : "#FFB547"}
                strokeOpacity={isActive ? 0.9 : 0.18}
                strokeWidth={isActive ? 1.2 : 0.6}
                strokeDasharray="3 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: isActive ? [0, 1, 1] : 0.35 }}
                transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], repeat: isActive ? Infinity : 0, repeatDelay: 0.4 }}
              />
            );
          })}
          {DESTINATIONS.map((d, i) => {
            const isActive = i === activeIndex % DESTINATIONS.length;
            return (
              <g key={d.code} transform={`translate(${d.x} ${d.y})`}>
                <circle r={isActive ? 2.6 : 1.4} fill={isActive ? "#FFB547" : "#FFB547"} fillOpacity={isActive ? 1 : 0.4} />
                <text
                  x="4"
                  y="-2"
                  fill={isActive ? "#FFB547" : "#74777f"}
                  fontFamily="JetBrains Mono"
                  fontSize="3.2"
                  fontWeight="700"
                >
                  {d.code}
                </text>
              </g>
            );
          })}
          <circle cx={TLV.x} cy={TLV.y} r="2.6" fill="#C6F432" />
        </g>
      </svg>

      {/* Active label */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/55">
        <span>TLV → {active.code}</span>
        <span className="text-reversal mt-1">{active.city}</span>
      </div>
    </div>
  );
}
