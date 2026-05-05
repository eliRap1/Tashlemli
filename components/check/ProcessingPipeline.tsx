"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SplitFlapBoard } from "../SplitFlapBoard";

type Event =
  | { kind: "queued" }
  | { kind: "extracting" }
  | { kind: "extracted"; extracted: any }
  | { kind: "looking_up" }
  | { kind: "looked_up"; flight_id: string }
  | { kind: "computing" }
  | { kind: "ready"; result: any; passenger: string; flight: string; route: string }
  | { kind: "failed"; code: string; message: string };

interface Props {
  sseUrl: string;
  onReady: (e: Extract<Event, { kind: "ready" }>) => void;
  onFailed: (e: Extract<Event, { kind: "failed" }>) => void;
}

export function ProcessingPipeline({ sseUrl, onReady, onFailed }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  useEffect(() => {
    const es = new EventSource(sseUrl);
    es.onmessage = (m) => {
      const e = JSON.parse(m.data) as Event;
      setEvents((arr) => [...arr, e]);
      if (e.kind === "ready") onReady(e);
      if (e.kind === "failed") onFailed(e);
    };
    es.onerror = () => {};
    return () => es.close();
  }, [sseUrl, onReady, onFailed]);

  return (
    <div className="relative h-[58vh] w-[min(820px,92vw)] mx-auto rounded-[28px] bg-black/55 ring-1 ring-fluorescent/8 overflow-hidden grain">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
        {events.map((e, i) => (
          <Strip key={i} index={i} event={e} />
        ))}
      </div>
    </div>
  );
}

function Strip({ event, index }: { event: Event; index: number }) {
  const text = labelFor(event);
  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="font-mono text-[12px] uppercase tracking-[0.3em] text-reversal/85"
    >
      <SplitFlapBoard states={[text.padEnd(32, " ")]} intervalMs={9_999_999} size="sm" />
    </motion.div>
  );
}

function labelFor(e: Event): string {
  switch (e.kind) {
    case "queued": return "UPLOADED";
    case "extracting": return "EXTRACTING";
    case "extracted": return `${e.extracted.flight_number} · ${e.extracted.origin_iata} → ${e.extracted.destination_iata}`;
    case "looking_up": return "VALIDATING FLIGHT";
    case "looked_up": return "FLIGHT CONFIRMED";
    case "computing": return "COMPUTING ENTITLEMENT";
    case "ready": return e.result.eligible ? `READY · ₪ ${e.result.amount_ils}` : "READY";
    case "failed": return `FAILED · ${e.code}`;
  }
}
