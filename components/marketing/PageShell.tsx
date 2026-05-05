import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";

export function PageShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return (
    <main dir="rtl" className="min-h-screen bg-terminal text-fluorescent">
      <Nav />
      <header className="px-6 sm:px-12 pt-32 pb-16 max-w-[1280px] mx-auto">
        <span className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal">{eyebrow}</span>
        <h1 className="mt-4 font-heebo font-black tracking-tightest leading-[0.95]" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>{title}</h1>
      </header>
      <article className="px-6 sm:px-12 pb-32 max-w-[860px] mx-auto font-heebo text-fluorescent/80 leading-[1.75] text-lg sm:text-xl space-y-8">
        {children}
      </article>
      <Footer />
    </main>
  );
}
