"use client";

import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, CaretLeft as ArrowLeftIcon, CaretRight as ArrowRightIcon } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";

// Reihenfolge korrespondiert mit den data-tour-Attributen in sitzplan-editor.tsx
const ZIELE = ["planeinstellungen", "element-hinzufuegen", "canvas", "sidebar", "preiskategorien", "speichern"] as const;

const RAND = 8; // Abstand des Spotlight-Rahmens zum Zielelement
const TOOLTIP_BREITE = 300;

// Wird vom Elternteil nur gemountet, während die Tour offen ist — dadurch
// startet schrittIndex bei jedem Öffnen frisch bei 0, ganz ohne Reset-Effect.
export function EditorTour({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [schrittIndex, setSchrittIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const SCHRITTE = [
    { titel: t.editor.tour.schritt1Titel, text: t.editor.tour.schritt1Text },
    { titel: t.editor.tour.schritt2Titel, text: t.editor.tour.schritt2Text },
    { titel: t.editor.tour.schritt3Titel, text: t.editor.tour.schritt3Text },
    { titel: t.editor.tour.schritt4Titel, text: t.editor.tour.schritt4Text },
    { titel: t.editor.tour.schritt5Titel, text: t.editor.tour.schritt5Text },
    { titel: t.editor.tour.schritt6Titel, text: t.editor.tour.schritt6Text },
  ];

  useLayoutEffect(() => {
    function berechnen() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${ZIELE[schrittIndex]}"]`);
      // offsetParent ist null bei display:none (z.B. Desktop-Sidebar am Handy) — dann zentrierte Karte ohne Spotlight
      if (!el || el.offsetParent === null) { setRect(null); return; }
      setRect(el.getBoundingClientRect());
    }
    berechnen();
    window.addEventListener("resize", berechnen);
    return () => window.removeEventListener("resize", berechnen);
  }, [schrittIndex]);

  const letzterSchritt = schrittIndex === SCHRITTE.length - 1;
  const aktuell = SCHRITTE[schrittIndex];

  function weiter() {
    if (letzterSchritt) { onClose(); return; }
    setSchrittIndex((i) => i + 1);
  }

  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const platzUnten = rect ? vh - rect.bottom : 0;
  const unterhalbAnzeigen = !rect || platzUnten > 220 || rect.top < 220;
  const tooltipStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        width: Math.min(TOOLTIP_BREITE, vw - 32),
        left: Math.min(Math.max(rect.left, 16), vw - Math.min(TOOLTIP_BREITE, vw - 32) - 16),
        ...(unterhalbAnzeigen
          ? { top: rect.bottom + RAND + 8 }
          : { bottom: vh - rect.top + RAND + 8 }),
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: Math.min(TOOLTIP_BREITE, vw - 32),
      };

  return (
    <>
      {/* Klick-Blocker: dimmt bei zentrierten Schritten direkt, sonst übernimmt das Spotlight das Dimmen */}
      <div className={`fixed inset-0 z-[80] ${rect ? "" : "bg-black/55"}`} />
      {rect && (
        <div
          className="fixed z-[81] rounded-lg pointer-events-none border-2 border-brand transition-all duration-200"
          style={{
            top: rect.top - RAND,
            left: rect.left - RAND,
            width: rect.width + RAND * 2,
            height: rect.height + RAND * 2,
            boxShadow: "0 0 0 9999px rgba(15,15,15,0.55)",
          }}
        />
      )}
      <div
        className="z-[90] rounded-xl border border-border bg-card shadow-2xl p-4 space-y-3"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{aktuell.titel}</p>
          <button type="button" onClick={onClose} aria-label={t.editor.tour.ueberspringen}
            className="h-6 w-6 shrink-0 -mt-1 -mr-1 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{aktuell.text}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {fmt(t.editor.tour.schrittVon, { n: schrittIndex + 1, gesamt: SCHRITTE.length })}
          </span>
          <div className="flex items-center gap-1.5">
            {schrittIndex > 0 && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setSchrittIndex((i) => i - 1)}>
                <ArrowLeftIcon className="h-3 w-3 mr-1" /> {t.editor.tour.zurueck}
              </Button>
            )}
            <Button size="sm" className="h-7 px-3 text-xs" onClick={weiter}>
              {letzterSchritt ? t.editor.tour.fertig : t.editor.tour.weiter}
              {!letzterSchritt && <ArrowRightIcon className="h-3 w-3 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
