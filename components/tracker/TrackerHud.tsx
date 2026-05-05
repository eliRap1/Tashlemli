"use client";

import type { PublicClaimView, PublicEvent } from "@/services/tracker/publicView";
import { SplitFlapBoard } from "@/components/SplitFlapBoard";

export function TrackerHud({ view, latest }: { view: PublicClaimView; latest: PublicEvent | null }) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-6 sm:p-10 pointer-events-none">
      <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/80">
        STATUS · {latest ? new Date(latest.occurred_at).toISOString().slice(11, 16) : "--:--"} · {latest?.label_he ?? "תיק התקבל"}
      </div>
      <div className="text-end font-mono text-[10px] uppercase tracking-[0.42em] text-fluorescent/55">
        ETA · {estimateEta(view.current_state)}
      </div>

      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 pointer-events-auto">
        <div className="rounded-md border border-fluorescent/10 bg-black/85 px-7 py-5 shadow-[0_0_80px_rgba(0,0,0,0.7)]">
          <SplitFlapBoard states={[`₪${view.amount_ils.toLocaleString()}`.padStart(9, " ")]} intervalMs={99_999_999} size="lg" />
        </div>
        <div className="mt-3 text-center font-heebo text-fluorescent/85">{view.passenger_label}</div>
      </div>
    </div>
  );
}

function estimateEta(state: string): string {
  switch (state) {
    case "intake.received": return "14 ימים";
    case "poa.sent":
    case "poa.signed":
    case "evidence.collected":
    case "demand.drafted":
    case "demand.reviewed": return "10 ימים";
    case "demand.sent":
    case "airline.delivered": return "7 ימים";
    case "airline.replied":
    case "negotiation.open":
    case "settlement.offered": return "4 ימים";
    case "settlement.accepted":
    case "payout.requested": return "יום-יומיים";
    case "payout.complete":
    case "claim.closed": return "הושלם";
    default: return "—";
  }
}
