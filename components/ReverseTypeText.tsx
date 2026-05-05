"use client";

import { useEffect, useState } from "react";

interface ReverseTypeTextProps {
  text: string;
  className?: string;
  startDelayMs?: number;
  charDurationMs?: number;
  /** When true, type in reverse (already typed → erased → re-typed forward) */
  reversedFirst?: boolean;
}

export function ReverseTypeText({
  text,
  className,
  startDelayMs = 700,
  charDurationMs = 36,
  reversedFirst = true,
}: ReverseTypeTextProps) {
  const [output, setOutput] = useState(reversedFirst ? text : "");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await wait(startDelayMs);
      if (cancelled) return;

      if (reversedFirst) {
        for (let i = text.length; i >= 0; i--) {
          if (cancelled) return;
          setOutput(text.slice(0, i));
          await wait(charDurationMs);
        }
        await wait(180);
        for (let i = 0; i <= text.length; i++) {
          if (cancelled) return;
          setOutput(text.slice(0, i));
          await wait(charDurationMs * 0.85);
        }
        return;
      }
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        setOutput(text.slice(0, i));
        await wait(charDurationMs);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [text, startDelayMs, charDurationMs, reversedFirst]);

  return (
    <span className={className} aria-label={text}>
      {output}
      <span className="inline-block w-[0.05em] -mb-[0.06em] h-[0.85em] bg-reversal align-baseline animate-pulse" aria-hidden="true" />
    </span>
  );
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
