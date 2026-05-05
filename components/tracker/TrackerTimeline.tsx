"use client";

import type { PublicEvent } from "@/services/tracker/publicView";

export function TrackerTimeline({ events }: { events: PublicEvent[] }) {
  const reversed = [...events].reverse();
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 px-6 sm:px-10 pb-8">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex flex-row-reverse gap-3 min-w-max" dir="rtl">
          {reversed.map((e) => (
            <div key={e.id} className="rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/8 px-4 py-3 min-w-[220px]">
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-reversal/75">{e.code}</div>
              <div className="font-heebo font-bold text-fluorescent text-base mt-1">{e.label_he}</div>
              <div className="font-mono text-[10px] text-fluorescent/45 mt-2">{new Date(e.occurred_at).toISOString().slice(0, 16).replace("T", " ")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
