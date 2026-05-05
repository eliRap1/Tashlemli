"use client";

import { useRef, useState } from "react";
import { CinematicSurface } from "@/components/CinematicSurface";
import { UploadDropZone } from "@/components/check/UploadDropZone";
import { ProcessingPipeline } from "@/components/check/ProcessingPipeline";
import { RevealStage } from "@/components/check/RevealStage";
import { ContactCaptureSheet } from "@/components/check/ContactCaptureSheet";
import { ManualFallbackForm, type ManualFallbackHandle, type ManualResult } from "@/components/check/ManualFallbackForm";
import { QuickRoutes } from "@/components/check/QuickRoutes";

type Phase = "idle" | "uploading" | "processing" | "ready" | "failed";

export function CheckPageClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [sseUrl, setSseUrl] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ amount_ils: number; passenger: string; flight: string; route: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const manualRef = useRef<ManualFallbackHandle>(null);

  async function handleFile(f: File) {
    setPhase("uploading");
    const fd = new FormData();
    fd.set("file", f);
    fd.set("turnstile", "dev");
    const r = await fetch("/api/eligibility/upload", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) { setPhase("failed"); setFailure(j.error ?? "upload_fail"); return; }
    setJobId(j.jobId);
    setSseUrl(j.sseUrl);
    setPhase("processing");
  }

  function handleManualResult(out: ManualResult) {
    setJobId(out.jobId);
    if (!out.result.eligible) {
      setPhase("failed");
      setFailure(out.result.rejection_reason ?? "ineligible");
      return;
    }
    setReveal({ amount_ils: out.result.amount_ils, passenger: out.passenger, flight: out.flight, route: out.route });
    setPhase("ready");
  }

  function handleManualError(code: string) {
    setPhase("failed"); setFailure(code);
  }

  function handleQuickPick(flight: string, date: string) {
    manualRef.current?.fill(flight, date);
    // Defer one tick so the input state is committed before submit reads it.
    setTimeout(() => manualRef.current?.submit(), 50);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-terminal" dir="rtl">
      <CinematicSurface variant="terminal" grade="enr" className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[8vh] bg-gradient-to-b from-black/95 to-transparent z-30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[10vh] bg-gradient-to-t from-black/95 to-transparent z-30" />

      <div className="relative z-40 flex min-h-screen flex-col items-center justify-center gap-8 py-16 px-6">
        {phase === "idle" && (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/80">
              CHECK · 60 SECONDS · NO FORMS
            </div>
            <UploadDropZone onFile={handleFile} />
            <QuickRoutes onPick={handleQuickPick} />
            <ManualFallbackForm ref={manualRef} onResult={handleManualResult} onError={handleManualError} />
          </>
        )}
        {phase === "processing" && sseUrl && (
          <ProcessingPipeline
            sseUrl={sseUrl}
            onReady={(e) => {
              if (!e.result.eligible) {
                setPhase("failed"); setFailure(e.result.rejection_reason ?? "ineligible"); return;
              }
              setReveal({ amount_ils: e.result.amount_ils, passenger: e.passenger, flight: e.flight, route: e.route });
              setPhase("ready");
            }}
            onFailed={(e) => { setPhase("failed"); setFailure(e.code); }}
          />
        )}
        {phase === "ready" && reveal && jobId && (
          <>
            <RevealStage {...reveal} onContinue={() => setShowCapture(true)} />
            {showCapture && <ContactCaptureSheet jobId={jobId} onSuccess={(url) => (window.location.href = url)} />}
          </>
        )}
        {phase === "failed" && (
          <div className="font-heebo text-fluorescent/80 max-w-[32ch] text-center">
            <div className="font-mono text-cancellation text-xs uppercase tracking-[0.3em] mb-2">{failure ?? "FAIL"}</div>
            <div className="text-2xl font-bold mb-2">לא הצלחנו לאשר את הטיסה. נסי בעזרת מספר טיסה ידני.</div>
            <ManualFallbackForm onResult={handleManualResult} onError={handleManualError} />
          </div>
        )}
      </div>
    </main>
  );
}
