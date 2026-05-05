"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicClaimView, PublicEvent } from "@/services/tracker/publicView";
import { TrackerMap } from "@/components/tracker/TrackerMap";
import { TrackerHud } from "@/components/tracker/TrackerHud";
import { TrackerTimeline } from "@/components/tracker/TrackerTimeline";
import { CinematicSurface } from "@/components/CinematicSurface";

export function TrackerClient({ view: initial, token }: { view: PublicClaimView; token: string }) {
  const [events, setEvents] = useState<PublicEvent[]>(initial.events);

  useEffect(() => {
    const es = new EventSource(`/api/sse/claim/${encodeURIComponent(token)}`);
    es.onmessage = (m) => {
      try {
        const row = JSON.parse(m.data);
        setEvents((prev) => (prev.some((e) => e.id === row.id) ? prev : [...prev, normalize(row)]));
      } catch {}
    };
    return () => es.close();
  }, [token]);

  const latest = events[events.length - 1] ?? null;
  const view = useMemo(() => ({ ...initial, events }), [initial, events]);

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-terminal">
      <CinematicSurface variant="terminal" grade="enr" className="absolute inset-0" />
      <TrackerMap view={view} latest={latest} />
      <TrackerHud view={view} latest={latest} />
      <TrackerTimeline events={events} />
    </main>
  );
}

function normalize(row: any): PublicEvent {
  return {
    id: row.id,
    code: row.code,
    actor: row.actor,
    label_he: row.labelHe ?? row.label_he,
    label_en: row.labelEn ?? row.label_en,
    metadata: row.metadata,
    occurred_at: row.occurredAt ?? row.occurred_at,
  };
}
