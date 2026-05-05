import { ImageResponse } from "next/og";
import { loadPublicView } from "@/services/tracker/publicView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let view;
  try { view = await loadPublicView(token); }
  catch { return new Response("not found", { status: 404 }); }

  const amount = `₪${view.amount_ils.toLocaleString()}`;

  return new ImageResponse(
    (
      <div style={{
        height: "100%", width: "100%", display: "flex", flexDirection: "column",
        background: "#0A0E14", color: "#F5F5F0", padding: 64, fontFamily: "Inter",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#C6F432" }} />
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>TASHLEMLI · תשלם לי</div>
        </div>
        <div style={{ marginTop: 56, display: "flex", gap: 16, fontSize: 18, color: "#74777f", letterSpacing: 4, textTransform: "uppercase" }}>
          <span>STATUS</span><span>·</span><span>{view.current_state}</span>
        </div>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 60, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{view.passenger_label}</div>
          <div style={{ marginTop: 24, display: "flex", gap: 16, fontSize: 28, color: "#F5F5F0", fontFamily: "monospace" }}>
            <span>{view.origin.iata}</span><span>→</span><span>{view.airline_hq.iata}</span>
          </div>
        </div>
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 18, color: "#74777f", letterSpacing: 4, textTransform: "uppercase" }}>RECOVERED</div>
          <div style={{ fontSize: 120, fontWeight: 900, color: "#C6F432", letterSpacing: -4, fontFamily: "monospace" }}>{amount}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
