import Link from "next/link";
import type { Claim } from "@/lib/db/schema/claims";

export function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <Link
      href={`/claim/${claim.claimToken}`}
      className="grid grid-cols-12 gap-4 items-center rounded-2xl bg-[#0c1118] ring-1 ring-fluorescent/8 p-6 hover:ring-reversal/50 transition"
    >
      <div className="col-span-3 font-mono text-[11px] uppercase tracking-[0.3em] text-fluorescent/45">
        {claim.currentState}
      </div>
      <div className="col-span-4 font-heebo font-bold text-fluorescent">{claim.passengerName}</div>
      <div className="col-span-3 font-mono text-fluorescent/65 text-sm">{claim.airlineIata ?? "—"}</div>
      <div className="col-span-2 font-mono text-reversal text-xl tabular-nums text-end">₪ {claim.amountIls.toLocaleString()}</div>
    </Link>
  );
}
