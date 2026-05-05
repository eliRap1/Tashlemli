import type { Metadata, Viewport } from "next";
import { Heebo, Inter, JetBrains_Mono, Mona_Sans } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const mona = Mona_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
  variable: "--font-mona",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0E14",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "תשלם לי — TASHLEMLI · Flight Compensation",
  description:
    "טיסה התבטלה? אנחנו מחזירים את הכסף. ב-7 ימים, ב-22% עמלה. ללא הצלחה — ללא תשלום.",
  openGraph: {
    title: "TASHLEMLI · תשלם לי",
    description:
      "Israel's flight-compensation advocate. We reverse cancellations into refunds — frame by frame.",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${inter.variable} ${mona.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased bg-terminal text-fluorescent">{children}</body>
    </html>
  );
}
