import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: "#0A0E14",
        cancellation: "#FF3B30",
        reversal: "#C6F432",
        fluorescent: "#F5F5F0",
        concrete: "#2A2D34",
        amber: "#FFB547",
        navy: "#0B2545",
        "navy-deep": "#001026",
      },
      fontFamily: {
        heebo: ["var(--font-heebo)", "sans-serif"],
        display: ["var(--font-mona)", "var(--font-heebo)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        body: ["var(--font-inter)", "var(--font-heebo)", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
      },
      fontSize: {
        hero: ["clamp(3.5rem, 9vw, 8.5rem)", { lineHeight: "0.92", letterSpacing: "-0.04em", fontWeight: "900" }],
        display: ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "0.95", letterSpacing: "-0.035em", fontWeight: "900" }],
      },
      animation: {
        "fluorescent-pulse": "fluorescent 4.2s ease-in-out infinite",
        "coin-rise": "coinRise 14s linear infinite",
        "flap-clack": "flapClack 0.9s steps(2) infinite",
        "lime-pulse": "limePulse 3.4s ease-in-out infinite",
        "marquee-rtl": "marqueeRTL 40s linear infinite",
      },
      keyframes: {
        fluorescent: {
          "0%, 100%": { opacity: "0.92", filter: "brightness(1)" },
          "47%": { opacity: "1", filter: "brightness(1.07)" },
          "49%": { opacity: "0.7", filter: "brightness(0.85)" },
          "51%": { opacity: "1", filter: "brightness(1.05)" },
        },
        coinRise: {
          "0%": { transform: "translate(0, 0) rotateY(0deg)", opacity: "0" },
          "10%": { opacity: "0.5" },
          "100%": { transform: "translate(-12px, -800px) rotateY(720deg)", opacity: "0" },
        },
        flapClack: {
          "0%": { transform: "rotateX(0deg)" },
          "100%": { transform: "rotateX(-180deg)" },
        },
        limePulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(198,244,50,0.55), 0 0 60px 0 rgba(198,244,50,0.15)" },
          "50%": { boxShadow: "0 0 0 18px rgba(198,244,50,0), 0 0 90px 12px rgba(198,244,50,0.28)" },
        },
        marqueeRTL: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(50%)" },
        },
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.42 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
    },
  },
  plugins: [],
};

export default config;
