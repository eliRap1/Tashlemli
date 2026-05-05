import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const v = (await cookies()).get("tshl_ops")?.value;
  const path = (typeof globalThis !== "undefined" && (globalThis as any).headers ? "" : "");
  if (!v || v !== process.env.OPS_COOKIE) {
    if (!path.endsWith("/admin/login")) redirect("/admin/login");
  }
  return (
    <div dir="rtl" className="min-h-screen bg-terminal text-fluorescent">
      <header className="px-6 py-4 border-b border-fluorescent/10 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.42em] text-reversal">TASHLEMLI · OPS</div>
        <form action="/api/admin/logout" method="POST"><button className="font-mono text-xs text-fluorescent/60 hover:text-reversal">logout</button></form>
      </header>
      <main className="px-6 py-10 max-w-[1280px] mx-auto">{children}</main>
    </div>
  );
}
