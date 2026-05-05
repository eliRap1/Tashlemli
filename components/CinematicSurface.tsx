"use client";

import { useEffect, useRef } from "react";

interface CinematicSurfaceProps {
  /** Optional looping video src — if omitted, a procedural ambient surface renders. */
  src?: string;
  /** Reverse playback (used in How-It-Works panels and Are You Owed panels). */
  reverse?: boolean;
  /** Overlay grade name */
  grade?: "tenet" | "enr" | "amber" | "coral";
  className?: string;
  /** Procedural fallback variant */
  variant?: "terminal" | "boarding-pass" | "hourglass" | "passport" | "flight-path" | "phone" | "runway" | "corridor";
}

export function CinematicSurface({
  src,
  reverse = false,
  grade = "tenet",
  className = "",
  variant = "terminal",
}: CinematicSurfaceProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current || !src) return;
    if (reverse) {
      ref.current.playbackRate = -1;
    }
  }, [src, reverse]);

  const gradeClass = {
    tenet: "tenet-grade",
    enr: "enr-grade",
    amber: "[filter:contrast(1.1)_saturate(1.2)_hue-rotate(8deg)]",
    coral: "[filter:contrast(1.05)_saturate(1.4)_hue-rotate(-12deg)]",
  }[grade];

  return (
    <div className={`relative overflow-hidden grain ${className}`}>
      {src ? (
        <video
          ref={ref}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover ${gradeClass}`}
          style={reverse ? { animationDirection: "reverse" } : undefined}
        />
      ) : (
        <ProceduralSurface variant={variant} reverse={reverse} />
      )}
      <div className="anamorphic-flare absolute inset-0" />
    </div>
  );
}

function ProceduralSurface({ variant, reverse }: { variant: string; reverse: boolean }) {
  switch (variant) {
    case "terminal":
      return <TerminalProcedural reverse={reverse} />;
    case "boarding-pass":
      return <BoardingPassProcedural reverse={reverse} />;
    case "hourglass":
      return <HourglassProcedural reverse={reverse} />;
    case "passport":
      return <PassportProcedural reverse={reverse} />;
    case "flight-path":
      return <FlightPathProcedural reverse={reverse} />;
    case "phone":
      return <PhoneProcedural reverse={reverse} />;
    case "runway":
      return <RunwayProcedural />;
    case "corridor":
      return <CorridorProcedural reverse={reverse} />;
    default:
      return <TerminalProcedural reverse={reverse} />;
  }
}

function TerminalProcedural({ reverse }: { reverse: boolean }) {
  return (
    <div className="absolute inset-0 terminal-hum">
      {/* Vanishing-point corridor lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A0E14" />
            <stop offset="55%" stopColor="#0A0E14" />
            <stop offset="100%" stopColor="#1a2230" />
          </linearGradient>
          <linearGradient id="ceilGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d1218" />
            <stop offset="100%" stopColor="#0a0e14" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1600" height="450" fill="url(#ceilGrad)" />
        <rect x="0" y="450" width="1600" height="450" fill="url(#floorGrad)" />
        {/* Ceiling fluorescent strips, perspective-projected */}
        {[0.1, 0.22, 0.36, 0.52].map((t, i) => {
          const y1 = 60 + t * 240;
          const x1 = 800 - 800 * (1 - t);
          const x2 = 800 + 800 * (1 - t);
          return (
            <rect
              key={i}
              x={x1}
              y={y1}
              width={x2 - x1}
              height={4 + t * 6}
              fill="#F5F5F0"
              opacity={0.34 + t * 0.4}
              className="animate-fluorescent-pulse"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          );
        })}
        {/* Floor vanishing lines */}
        <line x1="0" y1="900" x2="800" y2="450" stroke="#1a2230" strokeWidth="1.5" />
        <line x1="1600" y1="900" x2="800" y2="450" stroke="#1a2230" strokeWidth="1.5" />
        <line x1="200" y1="900" x2="800" y2="450" stroke="#0f141d" strokeWidth="1" />
        <line x1="1400" y1="900" x2="800" y2="450" stroke="#0f141d" strokeWidth="1" />
        {/* Distant amber pocket of light */}
        <circle cx="800" cy="430" r="80" fill="#FFB547" opacity="0.06" />
        <circle cx="800" cy="430" r="22" fill="#FFB547" opacity="0.18" />
        {/* Solitary traveler silhouette in foreground */}
        <g transform="translate(720, 620)" opacity={reverse ? 0.7 : 0.85}>
          <ellipse cx="80" cy="240" rx="80" ry="6" fill="#000" opacity="0.45" />
          <rect x="20" y="170" width="120" height="70" rx="4" fill="#FF6B22" opacity="0.78" />
          <ellipse cx="80" cy="135" rx="22" ry="26" fill="#1c1207" />
          <rect x="55" y="155" width="50" height="60" rx="6" fill="#1c1207" />
          <rect x="125" y="180" width="42" height="58" rx="3" fill="#0a0e14" stroke="#2A2D34" strokeWidth="1" />
        </g>
      </svg>
      {/* Slow scan-line hum */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_2px,rgba(245,245,240,0.018)_3px,transparent_4px)]" />
    </div>
  );
}

function BoardingPassProcedural({ reverse }: { reverse: boolean }) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1a1d22_0%,#0a0e14_70%)] flex items-center justify-center">
      <svg viewBox="0 0 600 260" className="w-[78%]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5F5F0" />
            <stop offset="100%" stopColor="#dad8c8" />
          </linearGradient>
        </defs>
        <g transform="translate(50, 40)">
          <rect width="500" height="180" rx="8" fill="url(#paper)" />
          <rect width="340" height="180" fill="url(#paper)" />
          <rect x="340" width="160" height="180" fill="#F5F5F0" />
          <line x1="340" y1="0" x2="340" y2="180" stroke="#0A0E14" strokeWidth="0.5" strokeDasharray="3 4" />
          <text x="20" y="40" fontFamily="JetBrains Mono" fontSize="14" fill="#0A0E14" fontWeight="700">TLV → LCA</text>
          <text x="20" y="80" fontFamily="JetBrains Mono" fontSize="32" fill="#0A0E14" fontWeight="800">LY 343</text>
          <text x="20" y="120" fontFamily="JetBrains Mono" fontSize="11" fill="#0A0E14">SEAT 14A · GATE C7</text>
          <text x="20" y="160" fontFamily="JetBrains Mono" fontSize="11" fill="#0A0E14">22:40 · DEC 14</text>
          <text x="360" y="100" fontFamily="JetBrains Mono" fontSize="20" fill="#0A0E14" fontWeight="700">14A</text>
        </g>
        <g style={{ animation: `tearReverse 6s ease-in-out infinite ${reverse ? "reverse" : "normal"}` }}>
          <rect x="293" y="40" width="14" height="180" fill="#0a0e14" opacity="0.0" />
        </g>
        <style>{`
          @keyframes tearReverse {
            0%, 30% { transform: translateX(0); }
            55% { transform: translateX(${reverse ? "-26px" : "26px"}); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </svg>
    </div>
  );
}

function HourglassProcedural({ reverse }: { reverse: boolean }) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#16191f_0%,#0a0e14_70%)] flex items-center justify-center">
      <svg viewBox="0 0 240 360" className="w-[44%]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB547" />
            <stop offset="100%" stopColor="#A8761E" />
          </linearGradient>
        </defs>
        <path d="M40 20 H200 L120 170 L40 20 Z" fill="#1a1d22" stroke="#2A2D34" strokeWidth="1" />
        <path d="M40 340 H200 L120 190 L40 340 Z" fill="#1a1d22" stroke="#2A2D34" strokeWidth="1" />
        <rect x="30" y="14" width="180" height="6" fill="#2A2D34" />
        <rect x="30" y="340" width="180" height="6" fill="#2A2D34" />
        <g style={{ animation: `sandFlow 8s linear infinite ${reverse ? "reverse" : "normal"}` }}>
          <path d="M70 30 H170 L120 130 L70 30 Z" fill="url(#sand)" opacity="0.85" />
        </g>
        <g style={{ animation: `sandStream 8s linear infinite ${reverse ? "reverse" : "normal"}` }}>
          <rect x="118" y="170" width="4" height="20" fill="url(#sand)" />
        </g>
        <style>{`
          @keyframes sandFlow {
            0%   { transform: scaleY(0.05); transform-origin: 50% 0; }
            100% { transform: scaleY(1); transform-origin: 50% 0; }
          }
          @keyframes sandStream {
            0%, 100% { opacity: 0.75; transform: translateY(0); }
            50% { opacity: 0.95; transform: translateY(${reverse ? "-6px" : "6px"}); }
          }
        `}</style>
      </svg>
    </div>
  );
}

function PassportProcedural({ reverse }: { reverse: boolean }) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#191c22_0%,#0a0e14_80%)] flex items-center justify-center">
      <svg viewBox="0 0 480 320" className="w-[80%]" preserveAspectRatio="xMidYMid meet">
        <rect x="20" y="40" width="440" height="240" rx="6" fill="#0B2545" />
        <rect x="40" y="60" width="400" height="200" rx="3" fill="#dad8c8" />
        <text x="60" y="100" fontFamily="JetBrains Mono" fontSize="11" fill="#0a0e14">PASSPORT · ישראל</text>
        <text x="60" y="130" fontFamily="JetBrains Mono" fontSize="22" fontWeight="700" fill="#0a0e14">COHEN / NOA</text>
        <text x="60" y="155" fontFamily="JetBrains Mono" fontSize="11" fill="#0a0e14">DOB 12 MAR 1991 · TLV</text>
        <g style={{ animation: `stampOff 5s ease-in-out infinite ${reverse ? "reverse" : "normal"}`, transformOrigin: "320px 200px" }}>
          <g transform="rotate(-12 320 200)">
            <rect x="240" y="170" width="160" height="60" stroke="#FF3B30" strokeWidth="3" fill="none" rx="4" />
            <text x="320" y="208" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="20" fontWeight="800" fill="#FF3B30">DENIED</text>
          </g>
        </g>
        <style>{`
          @keyframes stampOff {
            0%, 30% { opacity: 1; transform: scale(1) translateY(0); }
            55% { opacity: 0.6; transform: scale(1.08) translateY(-30px); }
            100% { opacity: 0; transform: scale(1.4) translateY(-90px); }
          }
        `}</style>
      </svg>
    </div>
  );
}

function FlightPathProcedural({ reverse }: { reverse: boolean }) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0d121a_0%,#050709_75%)]">
      <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="medSea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1828" />
            <stop offset="100%" stopColor="#020407" />
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#medSea)" />
        {/* coast outlines */}
        <path d="M120 320 Q 200 305, 260 318 T 380 330 T 480 320 T 560 312" stroke="#FFB547" strokeOpacity="0.18" strokeWidth="0.6" fill="none" />
        <path d="M580 240 Q 640 250, 690 235 T 760 220" stroke="#FFB547" strokeOpacity="0.16" strokeWidth="0.6" fill="none" />
        {/* TLV marker */}
        <circle cx="190" cy="320" r="3" fill="#C6F432" />
        <text x="200" y="318" fontFamily="JetBrains Mono" fontSize="10" fill="#C6F432">TLV</text>
        {/* LCA marker */}
        <circle cx="610" cy="240" r="3" fill="#FFB547" />
        <text x="618" y="238" fontFamily="JetBrains Mono" fontSize="10" fill="#FFB547">LCA</text>
        {/* Reversal arc - drawn dashing back */}
        <path
          d="M 610 240 Q 400 60, 190 320"
          stroke="#FFB547"
          strokeWidth="1.4"
          fill="none"
          strokeDasharray="6 6"
          style={{
            strokeDashoffset: reverse ? "0" : "260",
            animation: `arcReverse 6s linear infinite ${reverse ? "reverse" : "normal"}`,
          }}
        />
        <style>{`
          @keyframes arcReverse {
            0%   { stroke-dashoffset: 0;   opacity: 1; }
            70%  { stroke-dashoffset: 260; opacity: 0.6; }
            100% { stroke-dashoffset: 260; opacity: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
}

function PhoneProcedural({ reverse }: { reverse: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#16191f_0%,#0a0e14_80%)]">
      <div className="relative w-[58%] aspect-[9/19] rounded-[44px] bg-[#0a0e14] border-[8px] border-[#1a1d22] shadow-[0_30px_120px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute inset-0 px-5 pt-12">
          <div className="text-[10px] font-mono text-fluorescent/50 mb-3 text-end">14:32 · רביעי</div>
          <div
            className="rounded-2xl bg-[#16191f] border border-fluorescent/8 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.55)]"
            style={{ animation: `notifSlide 5s ease-out infinite ${reverse ? "reverse" : "normal"}` }}
          >
            <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-reversal/80 font-mono">
              <span className="size-1.5 rounded-full bg-reversal animate-lime-pulse" />
              BIT · התקבל
            </div>
            <div className="font-mono text-xl text-fluorescent font-bold">+ ₪2,450</div>
            <div className="text-xs text-fluorescent/60 mt-1">Tashlemli · החזר טיסה LY343</div>
          </div>
        </div>
        <style>{`
          @keyframes notifSlide {
            0% { transform: translateY(-30px); opacity: 0; }
            25%, 75% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-30px); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

function RunwayProcedural() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#FF3B30]/15 via-[#3a1010] to-[#0a0e14]">
      <svg viewBox="0 0 1600 800" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B5C" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#3a1010" />
            <stop offset="100%" stopColor="#0a0e14" />
          </linearGradient>
        </defs>
        <rect width="1600" height="800" fill="url(#dusk)" />
        {/* Runway perspective */}
        <polygon points="700,500 900,500 1100,800 500,800" fill="#1a1d22" />
        <line x1="800" y1="500" x2="800" y2="800" stroke="#F5F5F0" strokeWidth="2" strokeDasharray="14 18" opacity="0.5" />
        <line x1="700" y1="500" x2="500" y2="800" stroke="#F5F5F0" strokeWidth="1" opacity="0.6" />
        <line x1="900" y1="500" x2="1100" y2="800" stroke="#F5F5F0" strokeWidth="1" opacity="0.6" />
        {/* 787 holding short, silhouette */}
        <g transform="translate(450 470)" opacity="0.95">
          <path
            d="M 0 0 L 250 0 L 280 -8 L 320 -10 L 340 -6 L 340 6 L 320 10 L 280 8 L 250 0 L 230 18 L 100 18 L 60 28 L 40 28 L 70 18 L 0 18 Z"
            fill="#0a0e14"
          />
          <rect x="100" y="-20" width="40" height="22" fill="#0a0e14" />
        </g>
        {/* slow rotor blink */}
        <circle cx="780" cy="466" r="3" fill="#FF3B30">
          <animate attributeName="opacity" values="1;0.05;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function CorridorProcedural({ reverse }: { reverse: boolean }) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0a0e14_0%,#020306_75%)]">
      <svg viewBox="0 0 1600 900" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <rect width="1600" height="900" fill="#070a0f" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const k = i / 9;
          const inset = 800 * k;
          return (
            <rect
              key={i}
              x={inset}
              y={inset * 0.55}
              width={1600 - inset * 2}
              height={900 - inset * 1.1}
              fill="none"
              stroke="#11161e"
              strokeWidth="1"
              opacity={1 - k}
            />
          );
        })}
        {/* paper plane traveling toward vanishing point */}
        <g
          style={{
            animation: `planeFly 7s linear infinite ${reverse ? "reverse" : "normal"}`,
          }}
        >
          <polygon points="0,0 30,8 0,16 8,8" fill="#F5F5F0" />
        </g>
        <style>{`
          @keyframes planeFly {
            0%   { transform: translate(1400px, 700px) scale(1); opacity: 0.95; }
            100% { transform: translate(800px, 450px) scale(0.05); opacity: 0; }
          }
        `}</style>
      </svg>
    </div>
  );
}
