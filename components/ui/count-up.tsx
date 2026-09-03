"use client";

import { useEffect, useState } from "react";

type Format = "euro" | "int" | "percent";

function formatWert(v: number, f: Format): string {
  if (f === "euro") return (v / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  if (f === "percent") return `${Math.round(v)}%`;
  return Math.round(v).toLocaleString("de-DE");
}

// Zählt beim Erscheinen von 0 auf den Zielwert hoch (easeOut). Respektiert
// prefers-reduced-motion (dann direkt der Endwert).
export function CountUp({
  value,
  format = "int",
  className,
  durationMs = 900,
}: {
  value: number;
  format?: Format;
  className?: string;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let start = 0;
    // Alle setState-Aufrufe laufen im rAF-Callback (nicht synchron im Effekt)
    const tick = (ts: number) => {
      if (reduce) { setDisplay(value); return; }
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <span className={className}>{formatWert(display, format)}</span>;
}
