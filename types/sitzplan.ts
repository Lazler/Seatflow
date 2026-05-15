export type SitzKategorie = "standard" | "premium";

export type Reihe = {
  id: string;
  bezeichnung: string; // "A", "B", "C" ...
  y: number;           // vertikale Position auf dem Canvas
  anzahlSitze: number;
  sitzAbstand: number; // Abstand zwischen Sitzmittelpunkten in px
  kategorie: SitzKategorie;
};

export type SitzplanKonfiguration = {
  breite: number;
  hoehe: number;
  buehne: {
    label: string;
    breite: number;
  };
  reihen: Reihe[];
};

export const LEERE_KONFIGURATION: SitzplanKonfiguration = {
  breite: 800,
  hoehe: 580,
  buehne: { label: "BÜHNE", breite: 500 },
  reihen: [],
};

export const SITZ_RADIUS = 13;
export const SITZ_FARBE: Record<SitzKategorie, string> = {
  standard: "#3b82f6",
  premium: "#8b5cf6",
};
export const SITZ_FARBE_AUSGEWAEHLT = "#f59e0b";

// Berechnet die X-Startposition einer Reihe so, dass sie zentriert ist
export function reiheStartX(reihe: Reihe, canvasBreite: number): number {
  const reiheBreite = (reihe.anzahlSitze - 1) * reihe.sitzAbstand;
  return (canvasBreite - reiheBreite) / 2;
}

// Gibt alle Sitz-IDs einer Reihe zurück
export function sitzIds(reihe: Reihe): string[] {
  return Array.from(
    { length: reihe.anzahlSitze },
    (_, i) => `${reihe.bezeichnung}-${i + 1}`
  );
}

// Nächste freie Reihen-Bezeichnung ("A", "B", ... "Z", "AA", ...)
export function naechsteBezeichnung(reihen: Reihe[]): string {
  const vorhanden = new Set(reihen.map((r) => r.bezeichnung));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const buchstabe of alphabet) {
    if (!vorhanden.has(buchstabe)) return buchstabe;
  }
  return `R${reihen.length + 1}`;
}
