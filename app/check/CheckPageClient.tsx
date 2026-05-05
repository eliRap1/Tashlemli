"use client";

import { useState } from "react";
import { CinematicSurface } from "@/components/CinematicSurface";
import { UploadDropZone } from "@/components/check/UploadDropZone";
import { ProcessingPipeline } from "@/components/check/ProcessingPipeline";
import { RevealStage } from "@/components/check/RevealStage";
import { ContactCaptureSheet } from "@/components/check/ContactCaptureSheet";
import { ManualFallbackForm } from "@/components/check/ManualFallbackForm";

type Phase = "idle" | "uploading" | "processing" | "ready" | "failed";

export function CheckPageClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [sseUrl, setSseUrl] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ amount_ils: number; passenger: string; flight: string; route: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);

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

  function handleManual(jid: string, url: string) {
    setJobId(jid); setSseUrl(url); setPhase("processing");
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
            <ManualFallbackForm onJob={handleManual} />
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
            <div className="text-2xl font-bold mb-2">לא הצלחנו לקרוא את הקובץ או לאשר את הטיסה.</div>
            <ManualFallbackForm onJob={handleManual} />
          </div>
        )}
      </div>
    </main>
  );
}
