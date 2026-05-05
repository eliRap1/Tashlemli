"use client";

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { motion } from "motion/react";

interface UploadDropZoneProps {
  onFile: (f: File) => void;
  disabled?: boolean;
}

export function UploadDropZone({ onFile, disabled = false }: UploadDropZoneProps) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [disabled, onFile],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <motion.div
      animate={{ borderColor: over ? "#C6F432" : "rgba(198,244,50,0.35)" }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => input.current?.click()}
      className={`relative mx-auto flex h-[58vh] w-[min(820px,92vw)] cursor-pointer flex-col items-center justify-center rounded-[28px] border-[1.5px] bg-black/40 backdrop-blur-sm transition-shadow ${over ? "shadow-[0_0_120px_rgba(198,244,50,0.25)]" : "shadow-[0_0_60px_rgba(0,0,0,0.6)]"} ${disabled ? "pointer-events-none opacity-50" : ""}`}
      role="button"
      aria-disabled={disabled}
      aria-label="העלאת כרטיס עלייה לטיסה"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-reversal/70 mb-6">DROP · גרור · CLICK</div>
      <div className="font-heebo font-black text-fluorescent text-3xl sm:text-5xl text-center leading-tight max-w-[18ch]">
        שמט כאן את <span className="text-reversal">כרטיס העלייה</span>
      </div>
      <div className="mt-5 font-heebo text-base text-fluorescent/55 max-w-[40ch] text-center">
        JPG · PNG · WebP · PDF · עד 8MB. הקובץ נמחק תוך 14 יום אם לא תפתחי תיק.
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleChange}
        className="sr-only"
      />
    </motion.div>
  );
}
