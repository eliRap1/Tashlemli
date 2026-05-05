"use client";

import { motion } from "motion/react";
import type { PublicClaimView, PublicEvent } from "@/services/tracker/publicView";

const VIEW_W = 1600;
const VIEW_H = 900;

function project(lat: number, lon: number) {
  const minLon = -10, maxLon = 50, minLat = 25, maxLat = 60;
  const x = ((lon - minLon) / (maxLon - minLon)) * VIEW_W;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * VIEW_H;
  return { x, y };
}

export function TrackerMap({ view, latest }: { view: PublicClaimView; latest: PublicEvent | null }) {
  const a = project(view.origin.lat, view.origin.lon);
  const b = project(view.airline_hq.lat, view.airline_hq.lon);
  const cx = (a.x + b.x) / 2;
  const cy = Math.min(a.y, b.y) - 220;
  const arcD = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;

  const stage = latest?.code ?? "intake.received";
  const isInbound = ["airline.replied", "negotiation.open", "settlement.offered", "settlement.accepted", "payout.requested", "payout.complete", "claim.closed"].includes(stage);
  const completed = ["payout.complete", "claim.closed"].includes(stage);

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={(VIEW_H / 8) * i} x2={VIEW_W} y2={(VIEW_H / 8) * i} stroke="#11161e" strokeWidth={1} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={(VIEW_W / 12) * i} y1={0} x2={(VIEW_W / 12) * i} y2={VIEW_H} stroke="#11161e" strokeWidth={1} />
      ))}

      <motion.path d={arcD} fill="none" stroke={completed ? "#C6F432" : "#FFB547"} strokeWidth={completed ? 2.4 : 1.4} strokeDasharray="6 6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isInbound || completed ? 1 : stage === "demand.sent" ? 0.6 : 0.2 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />

      {isInbound && (
        <motion.path d={`M ${b.x} ${b.y} Q ${cx} ${cy + 80} ${a.x} ${a.y}`} fill="none" stroke="#C6F432" strokeWidth={2.4} strokeDasharray="3 6"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6 }} />
      )}

      <g transform={`translate(${a.x} ${a.y})`}>
        <circle r={6} fill="#C6F432" />
        <circle r={14} fill="#C6F432" opacity={0.18} />
        <text x={12} y={-10} fill="#C6F432" fontFamily="JetBrains Mono" fontSize={14} fontWeight={700}>{view.origin.iata}</text>
      </g>

      <g transform={`translate(${b.x} ${b.y})`}>
        <circle r={6} fill={completed ? "#C6F432" : "#FFB547"} />
        <circle r={14} fill={completed ? "#C6F432" : "#FFB547"} opacity={0.18}>
          <animate attributeName="r" values="14;22;14" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <text x={12} y={-10} fill={completed ? "#C6F432" : "#FFB547"} fontFamily="JetBrains Mono" fontSize={14} fontWeight={700}>
          {view.airline_hq.iata}
        </text>
      </g>

      {latest?.code === "airline.delivered" && view.airline_hq.mailHost && (
        <g transform={`translate(${b.x + 20} ${b.y + 28})`}>
          <text fill="#FFB547" fontFamily="JetBrains Mono" fontSize={10} opacity={0.85}>
            ↘ {view.airline_hq.iata} · {view.airline_hq.mailHost}
          </text>
        </g>
      )}
    </svg>
  );
}
