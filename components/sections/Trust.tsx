"use client";

export function Trust() {
  return (
    <section id="trust" className="relative bg-fluorescent text-terminal py-28 sm:py-36">
      <div className="mx-auto max-w-[1080px] px-6 sm:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-terminal/55">
              07 · COUNSEL OF RECORD
            </span>
            <h2
              className="mt-4 font-heebo font-black tracking-tightest leading-[0.92] text-terminal"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
            >
              שתיקה.
              <br />
              <span className="text-navy">מקצועית.</span>
            </h2>
            <p className="mt-6 font-heebo text-base text-terminal/65 max-w-[36ch]">
              כאן הסרט נעצר. כל מה שמופיע למטה אמיתי, מאומת, ובר-בדיקה. בלי אנימציות. בלי דרמה.
            </p>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 gap-x-10 gap-y-7 font-mono text-sm">
            <Field label="REPRESENTING ATTORNEY" value="עו״ד דניאל גולן" />
            <Field label="ISRAEL BAR LICENSE" value="No. 78214" />
            <Field label="COMPANY · ח.פ." value="51-619-XXXX" />
            <Field label="REGISTERED ADDRESS" value="רוטשילד 22, תל אביב" />
            <Field label="GOOGLE REVIEWS" value="4.9 / 5 · 1,840 ביקורות" />
            <Field label="PAYMENT SECURITY" value="🔒 PCI-DSS · TLS 1.3" />
            <Field label="EU REGULATION" value="EC 261/2004" />
            <Field label="ISRAEL CONSUMER LAW" value="חוק שירותי תעופה 2012" />
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-terminal/15 flex flex-wrap items-center gap-x-12 gap-y-6 font-mono text-[10px] uppercase tracking-[0.32em] text-terminal/55">
          <span>Tashlemli · תשלם לי</span>
          <span>EST. 2024</span>
          <span>HQ · TEL AVIV</span>
          <span>HEBREW · ENGLISH · RUSSIAN · ARABIC</span>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.32em] text-terminal/45">{label}</div>
      <div className="mt-1 text-base text-terminal font-bold">{value}</div>
    </div>
  );
}
