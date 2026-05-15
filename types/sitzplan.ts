export type SitzKategorie = "standard" | "premium";
export type ElementTyp = "reihe" | "tischreihe" | "rundtisch";

// Gemeinsame Basis aller Elemente
type BasisElement = {
  id: string;
  bezeichnung: string;
  x: number; // Mittelpunkt X
  y: number; // Mittelpunkt Y
  winkel: number; // Rotation in Grad
  kategorie: SitzKategorie;
};

// Klassische Sitzreihe
export type ReiheElement = BasisElement & {
  typ: "reihe";
  anzahlSitze: number;
  sitzAbstand: number;
};

// Rechteckige Tische in einer Reihe, Sitze davor
export type TischreiheElement = BasisElement & {
  typ: "tischreihe";
  anzahlTische: number;
  sitzeProTisch: number;
  tischAbstand: number; // Abstand zwischen Tischen
};

// Runder Tisch mit Sitzen ringsum
export type RundtischElement = BasisElement & {
  typ: "rundtisch";
  anzahlSitze: number;
  tischRadius: number;
};

export type SitzplanElement = ReiheElement | TischreiheElement | RundtischElement;

export type Buehne = {
  x: number;
  y: number;
  breite: number;
  hoehe: number;
  winkel: number;
  label: string;
};

export type SitzplanKonfiguration = {
  breite: number;
  hoehe: number;
  buehne: Buehne;
  elemente: SitzplanElement[];
};

// --- Konstanten ---
export const SITZ_RADIUS = 13;
export const TISCH_HOEHE = 18;
export const TISCH_SITZ_ABSTAND = 32; // px zwischen Sitzmittelpunkten bei Tischreihe
export const TISCH_SEAT_GAP = 8;      // Abstand Tischkante → Sitzmittelpunkt

export const SITZ_FARBE: Record<SitzKategorie, string> = {
  standard: "#3b82f6",
  premium: "#8b5cf6",
};
export const SITZ_FARBE_AUSGEWAEHLT = "#f59e0b";
export const TISCH_FARBE: Record<SitzKategorie, string> = {
  standard: "#93c5fd",
  premium: "#c4b5fd",
};

// --- Hilfsfunktionen ---

// Alle Sitz-IDs eines Elements (für Buchungen)
export function elementSitzIds(el: SitzplanElement): string[] {
  switch (el.typ) {
    case "reihe":
      return Array.from({ length: el.anzahlSitze }, (_, i) => `${el.bezeichnung}-${i + 1}`);
    case "tischreihe":
      return Array.from(
        { length: el.anzahlTische * el.sitzeProTisch },
        (_, i) => `${el.bezeichnung}-${i + 1}`
      );
    case "rundtisch":
      return Array.from({ length: el.anzahlSitze }, (_, i) => `${el.bezeichnung}-${i + 1}`);
  }
}

// Nächste freie Bezeichnung
export function naechsteBezeichnung(elemente: SitzplanElement[], prefix = ""): string {
  const vorhanden = new Set(elemente.map((e) => e.bezeichnung));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (prefix) {
    for (let i = 1; i <= 99; i++) {
      const name = `${prefix}${i}`;
      if (!vorhanden.has(name)) return name;
    }
    return `${prefix}${elemente.length + 1}`;
  }
  for (const b of alphabet) {
    if (!vorhanden.has(b)) return b;
  }
  return `R${elemente.length + 1}`;
}

// Breite einer Tischreihe (für Zentrierung)
export function tischreiheBreite(el: TischreiheElement): number {
  const tischBreite = el.sitzeProTisch * TISCH_SITZ_ABSTAND;
  return el.anzahlTische * tischBreite + (el.anzahlTische - 1) * el.tischAbstand;
}

// Standard-Leerkonfiguration
export const LEERE_KONFIGURATION: SitzplanKonfiguration = {
  breite: 900,
  hoehe: 620,
  buehne: {
    x: 450,
    y: 50,
    breite: 500,
    hoehe: 44,
    winkel: 0,
    label: "BÜHNE",
  },
  elemente: [],
};

// Migration alter Pläne (altes Format hatte "reihen" statt "elemente")
export function migrierteKonfiguration(raw: unknown): SitzplanKonfiguration {
  const k = raw as Record<string, unknown>;
  if (k.elemente) return k as unknown as SitzplanKonfiguration;
  return {
    ...LEERE_KONFIGURATION,
    breite: (k.breite as number) || LEERE_KONFIGURATION.breite,
    hoehe: (k.hoehe as number) || LEERE_KONFIGURATION.hoehe,
  };
}
