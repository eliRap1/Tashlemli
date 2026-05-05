export default async function Verify({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center bg-terminal text-fluorescent" dir="rtl">
      <div className="text-center font-heebo">
        {sp.err
          ? <div className="space-y-2"><div className="font-mono text-cancellation text-xs uppercase tracking-[0.3em]">קישור לא תקף</div><div className="text-2xl">בקשי קישור חדש מהדף הראשי.</div></div>
          : <div className="text-xl">מאמתים…</div>}
      </div>
    </main>
  );
}
