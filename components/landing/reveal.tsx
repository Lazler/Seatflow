"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Leichtes Scroll-Reveal für Listen-Elemente (Feature-Karten, Schritte,
// Preiskarten). Feuert einmal beim Eintritt in den Viewport, respektiert
// prefers-reduced-motion vollständig.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  // useReducedMotion() resolves to null during SSR and only settles to its
  // real value after client hydration — branching `initial` on it directly
  // produces a server/client markup mismatch. Keep `initial`/`animate`
  // constant and gate only the transition duration instead (0 = instant,
  // still satisfies prefers-reduced-motion without a hydration diff).
  const reduziert = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reduziert ? 0 : 0.5, delay: reduziert ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Eintritts-Animation beim Laden (Hero), kein Scroll-Trigger nötig.
// Kurze Dauer, damit LCP-Text nicht spürbar verzögert erscheint.
export function HeroReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  // Same SSR-safety rule as Reveal: never branch `initial` on
  // useReducedMotion() directly, only the transition duration/delay.
  const reduziert = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduziert ? 0 : 0.4, delay: reduziert ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
