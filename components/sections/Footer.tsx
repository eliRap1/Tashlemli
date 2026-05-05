"use client";

export function Footer() {
  return (
    <footer className="relative bg-black text-fluorescent/70 pt-20 pb-10">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-10">
          <div className="sm:col-span-5">
            <a href="#" className="inline-flex items-center gap-3 group">
              <WhatsAppGlyph size={48} />
              <span className="font-heebo font-black text-fluorescent text-3xl tracking-tightest">
                תשלם לי
              </span>
            </a>
            <p className="mt-6 font-heebo text-sm text-fluorescent/55 max-w-[36ch]">
              שירות פיצויי טיסה ישראלי. WhatsApp, עברית, ובן אדם, לא בוט.
            </p>
            <a
              href="https://wa.me/972500000000"
              className="mt-6 inline-flex items-center gap-3 font-heebo font-bold text-reversal hover:text-fluorescent transition-colors"
            >
              <WhatsAppGlyph size={22} />
              <span>+972 50 000 0000</span>
            </a>
          </div>

          <div className="sm:col-span-3">
            <FooterCol
              title="שירות"
              items={[
                { label: "בדיקת זכאות", href: "#check" },
                { label: "ביטולי מלחמה", href: "#war" },
                { label: "מחשבון פיצוי", href: "#calculator" },
                { label: "שאלות נפוצות", href: "#faq" },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <FooterCol
              title="חוקיות"
              items={[
                { label: "תנאי שימוש", href: "#" },
                { label: "פרטיות", href: "#" },
                { label: "EC 261", href: "#" },
                { label: "חוק שירותי תעופה", href: "#" },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <FooterCol
              title="שעות"
              items={[
                { label: "א׳-ה׳ 24/7", href: "#" },
                { label: "ו׳ 08:00–14:00", href: "#" },
                { label: "שבת — סגור", href: "#" },
              ]}
            />
            <div className="mt-6 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.32em] text-fluorescent/35">
              <button className="hover:text-reversal transition-colors">HE</button>
              <span>·</span>
              <button className="hover:text-reversal transition-colors">EN</button>
              <span>·</span>
              <button className="hover:text-reversal transition-colors">RU</button>
              <span>·</span>
              <button className="hover:text-reversal transition-colors">AR</button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-fluorescent/10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.32em] text-fluorescent/40">
          <span>© 2026 TASHLEMLI</span>
          <span>·</span>
          <span>ח.פ. 51-619-XXXX</span>
          <span>·</span>
          <span>עו״ד דניאל גולן</span>
          <span>·</span>
          <span>רישיון לשכת עורכי הדין מס׳ 78214</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.36em] text-fluorescent/40 mb-5">
        {title}
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="font-heebo text-sm text-fluorescent/75 hover:text-reversal transition-colors">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhatsAppGlyph({ size = 40 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full bg-reversal animate-lime-pulse"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 4C9.4 4 4 9.4 4 16c0 2.4.7 4.6 1.9 6.5L4 28l5.7-1.8c1.8 1 3.9 1.6 6.3 1.6 6.6 0 12-5.4 12-12S22.6 4 16 4zm5.5 16.5c-.3.7-1.4 1.4-2 1.5-.5.1-1.2.2-1.9-.1-1-.4-2.6-1-4.5-2.7-1.7-1.6-2.8-3.5-3.1-4.1-.3-.6-.5-1-.5-1.5 0-.5.2-1 .5-1.4.3-.4.7-.4 1-.4h.7c.2 0 .5 0 .8.6.3.7.9 2.3 1 2.5.1.2.1.4 0 .6-.1.2-.2.3-.4.5-.2.2-.4.4-.5.5-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.4 1.5 2.7 1.7.3.2.5.1.7-.1.2-.2.7-.9 1-1.2.2-.3.5-.2.7-.1.3.1 1.9.9 2.2 1 .3.1.5.2.6.4.1.2.1.7-.2 1.4z"
          fill="#0a0e14"
        />
      </svg>
    </span>
  );
}
