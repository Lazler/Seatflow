"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowCounterClockwise } from "@phosphor-icons/react";
import type { SitzplanKonfiguration, SitzplanElement } from "@/types/sitzplan";

const SitzplanCanvas = dynamic(() => import("@/components/raumplan/sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: 340 }} />
  ),
});

export type BuilderDemoTexte = {
  badge: string;          // "Live-Demo — echt klickbar"
  leer: string;           // "Klicke ein paar Plätze an."
  gewaehlt: string;       // "{n} Plätze gewählt — {preis}"
  zuruecksetzen: string;
  zoneFrei: string;
  zoneGewaehlt: string;
  zoneHinzufuegen: string;
  zoneAusverkauft: string;
  canvasAria: string;
  barrierefrei: string;
  stehplatz: string;
  zoomVergroessern: string;
  zoomVerkleinern: string;
  zoomReset: string;
};

// Zeigt bewusst die Bandbreite des Builders: gebogene Reihen, Mittelgang,
// Rundtische, Stehplatz-Zone, Annotation — alles echte Canvas-Features.
function demoKonfiguration(): SitzplanKonfiguration {
  const elemente: SitzplanElement[] = [
    // Zwei gebogene Premium-Reihen direkt an der Bühne
    { typ: "reihe", id: "p1", bezeichnung: "A", x: 380, y: 150, winkel: 0, kategorie_id: "premium", anzahlSitze: 11, sitzAbstand: 33, bogen: 26 },
    { typ: "reihe", id: "p2", bezeichnung: "B", x: 380, y: 196, winkel: 0, kategorie_id: "premium", anzahlSitze: 11, sitzAbstand: 33, bogen: 26 },
    // Drei gerade Parkett-Reihen mit Mittelgang (geteilte Reihen, durchlaufende Nummern)
    ...([0, 1, 2] as const).flatMap((r): SitzplanElement[] => {
      const bez = String.fromCharCode(67 + r); // C, D, E
      const y = 268 + r * 44;
      return [
        { typ: "reihe", id: `l${r}`, bezeichnung: bez, x: 285, y, winkel: 0, kategorie_id: "parkett", anzahlSitze: 5, sitzAbstand: 32 },
        { typ: "reihe", id: `r${r}`, bezeichnung: bez, x: 477, y, winkel: 0, kategorie_id: "parkett", anzahlSitze: 5, sitzAbstand: 32, nummerStart: 6, labelAusblenden: true },
      ];
    }),
    // Rundtisch rechts (Kabarett-Ecke)
    { typ: "rundtisch", id: "rt", bezeichnung: "T1", x: 650, y: 320, winkel: 0, kategorie_id: "parkett", anzahlSitze: 6, tischRadius: 30 },
    // Stehplatz-Zone hinten
    { typ: "stehplatz", id: "sz", bezeichnung: "S", x: 380, y: 460, winkel: 0, kategorie_id: "steh", breite: 280, hoehe: 78, kapazitaet: 25 },
    // Annotation
    { typ: "text", id: "tx", bezeichnung: "X1", x: 660, y: 462, winkel: 0, kategorie_id: "parkett", text: "BAR", fontSize: 15 },
  ];
  return {
    breite: 760,
    hoehe: 530,
    buehne: { x: 380, y: 52, breite: 360, hoehe: 42, winkel: 0, label: "BÜHNE" },
    kategorien: [
      { id: "premium", name: "Premium", preis_cent: 3200, farbe: "#d9481f" },
      { id: "parkett", name: "Parkett", preis_cent: 2400, farbe: "#3a3c40" },
      { id: "steh", name: "Stehplatz", preis_cent: 1500, farbe: "#c99a3a" },
    ],
    elemente,
  };
}

const BELEGT = ["A-4", "B-8", "C-2", "D-7", "E-10", "T1-3", "S-1", "S-2", "S-3"];

export default function BuilderDemo({ texte }: { texte: BuilderDemoTexte }) {
  // Lazy-Init statt useRef.current im Render (React-Compiler-Regel)
  const [konfig] = useState(demoKonfiguration);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [gewaehlt, setGewaehlt] = useState<Set<string>>(new Set());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / konfig.breite));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [konfig.breite]);

  const preisFuer = (id: string) => {
    if (id.startsWith("A-") || id.startsWith("B-")) return 3200;
    if (id.startsWith("S-")) return 1500;
    return 2400;
  };
  const summe = [...gewaehlt].reduce((s, id) => s + preisFuer(id), 0);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          {texte.badge}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {gewaehlt.size === 0
            ? texte.leer
            : texte.gewaehlt
                .replace("{n}", String(gewaehlt.size))
                .replace("{preis}", (summe / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" }))}
        </span>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full bg-[#1c1d20]">
        {scale > 0 && (
          <SitzplanCanvas
            konfiguration={konfig}
            modus="buchung"
            renderScale={scale}
            belegteSitze={new Set(BELEGT)}
            barrierefreieSitze={new Set(["C-1", "C-10"])}
            ausgewaehlteSitze={gewaehlt}
            onSitzKlicken={(id) =>
              setGewaehlt((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            texte={{
              zoneFrei: texte.zoneFrei,
              zoneGewaehlt: texte.zoneGewaehlt,
              zoneHinzufuegen: texte.zoneHinzufuegen,
              zoneAusverkauft: texte.zoneAusverkauft,
              canvasAria: texte.canvasAria,
              barrierefrei: texte.barrierefrei,
              stehplatz: texte.stehplatz,
              zoomVergroessern: texte.zoomVergroessern,
              zoomVerkleinern: texte.zoomVerkleinern,
              zoomReset: texte.zoomReset,
            }}
          />
        )}
      </div>

      {/* Fußzeile */}
      {gewaehlt.size > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex justify-end">
          <button
            type="button"
            onClick={() => setGewaehlt(new Set())}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
            {texte.zuruecksetzen}
          </button>
        </div>
      )}
    </div>
  );
}
