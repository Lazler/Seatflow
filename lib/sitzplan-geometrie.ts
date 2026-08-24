// Reine Sitz-Positions-Geometrie für Reihen und Rundtische. Aus der Konva-
// Render-Komponente (sitzplan-canvas.tsx) extrahiert, damit die Koordinaten-
// und Nummerierungs-Logik ohne Canvas testbar ist und es nur EINE Quelle der
// Wahrheit gibt (der Canvas importiert diese Funktionen).
import { SITZ_RADIUS } from "@/types/sitzplan";
import type { ReiheElement, RundtischElement } from "@/types/sitzplan";

export type SitzPosition = { sitzId: string; nummer: number; x: number; y: number };

// Breite einer Reihe (Mittelpunkt erster → letzter Sitz).
export function reihenBreite(el: ReiheElement): number {
  return Math.max(0, el.anzahlSitze - 1) * el.sitzAbstand;
}

// Lokale Sitzpositionen einer Reihe (relativ zum Gruppen-Ursprung, vor
// Rotation). Bogen = Parabel-Approximation eines Kreisbogens: Mitte bei 0,
// Enden bei +bogen (von der Bühne weg gewölbt). Nummerierung respektiert
// nummerStart und Richtung (ltr/rtl — „Hausrechte" Zählweise).
export function reihenSitzPositionen(el: ReiheElement): SitzPosition[] {
  const bogen = el.bogen ?? 0;
  const bogenY = (i: number) => {
    if (bogen === 0 || el.anzahlSitze < 2) return 0;
    const t = (2 * i) / (el.anzahlSitze - 1) - 1; // -1 … 1
    return bogen * t * t;
  };
  const start = el.nummerStart ?? 1;
  return Array.from({ length: el.anzahlSitze }, (_, i) => {
    const nummer = el.nummerRichtung === "rtl"
      ? start + (el.anzahlSitze - 1 - i)
      : start + i;
    return { sitzId: `${el.bezeichnung}-${nummer}`, nummer, x: i * el.sitzAbstand, y: bogenY(i) };
  });
}

// Radius des Sitzrings eines Rundtischs (Mittelpunkt → Sitzmittelpunkt).
export function rundtischSitzRadius(el: RundtischElement): number {
  return el.tischRadius + SITZ_RADIUS + 8;
}

// Lokale Sitzpositionen um einen Rundtisch, gleichmäßig verteilt, erster Sitz
// oben (−90°), im Uhrzeigersinn nummeriert 1..n.
export function rundtischSitzPositionen(el: RundtischElement): SitzPosition[] {
  const radius = rundtischSitzRadius(el);
  return Array.from({ length: el.anzahlSitze }, (_, i) => {
    const w = (2 * Math.PI * i) / el.anzahlSitze - Math.PI / 2;
    return {
      sitzId: `${el.bezeichnung}-${i + 1}`,
      nummer: i + 1,
      x: Math.cos(w) * radius,
      y: Math.sin(w) * radius,
    };
  });
}
