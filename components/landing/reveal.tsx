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
  const reduziert = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduziert ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
