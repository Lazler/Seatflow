// --- Preiskategorien ---
export type Preiskategorie = {
  id: string;
  name: string;       // z.B. "Parkett", "Loge", "Balkon"
  preis_cent: number;
  farbe: string;      // Hex-Farbe, z.B. "#3b82f6"
};

export const DEFAULT_KATEGORIEN: Preiskategorie[] = [
  { id: "kat-1", name: "Standard", preis_cent: 1500, farbe: "#3b82f6" },
  { id: "kat-2", name: "Premium",  preis_cent: 2500, farbe: "#8b5cf6" },
];

// --- Element-Typen ---
export type ElementTyp = "reihe" | "tischreihe" | "rundtisch";

type BasisElement = {
  id: string;
  bezeichnung: string;
  x: number;
  y: number;
  winkel: number;
  kategorie_id: string;
};

export type ReiheElement = BasisElement & {
  typ: "reihe";
  anzahlSitze: number;
  sitzAbstand: number;
};

export type TischreiheElement = BasisElement & {
  typ: "tischreihe";
  anzahlTische: number;
  sitzeProTisch: number;
  tischAbstand: number;
};

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
  kategorien: Preiskategorie[];
  elemente: SitzplanElement[];
};

// --- Konstanten ---
export const SITZ_RADIUS = 13;
export const TISCH_HOEHE = 18;
export const TISCH_SITZ_ABSTAND = 32;
export const TISCH_SEAT_GAP = 8;
export const FARBE_BELEGT             = "#94a3b8";
export const FARBE_AUSGEWAEHLT        = "#10b981";
export const FARBE_ELEMENT_SELEKTIERT = "#f59e0b";

// --- Hilfsfunktionen ---

export function elementSitzIds(el: SitzplanElement): string[] {
  const anzahl =
    el.typ === "reihe"      ? el.anzahlSitze :
    el.typ === "tischreihe" ? el.anzahlTische * el.sitzeProTisch :
                              el.anzahlSitze;
  return Array.from({ length: anzahl }, (_, i) => `${el.bezeichnung}-${i + 1}`);
}

export function tischreiheBreite(el: TischreiheElement): number {
  return el.anzahlTische * el.sitzeProTisch * TISCH_SITZ_ABSTAND +
         (el.anzahlTische - 1) * el.tischAbstand;
}

export function naechsteBezeichnung(elemente: SitzplanElement[], prefix = ""): string {
  const vorhanden = new Set(elemente.map((e) => e.bezeichnung));
  if (prefix) {
    for (let i = 1; i <= 99; i++) {
      const name = `${prefix}${i}`;
      if (!vorhanden.has(name)) return name;
    }
    return `${prefix}${elemente.length + 1}`;
  }
  for (const b of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (!vorhanden.has(b)) return b;
  }
  return `R${elemente.length + 1}`;
}

// Alle Sitze mit ihrer Kategorie
export function alleSitze(konfig: SitzplanKonfiguration): { sitzId: string; kategorieId: string }[] {
  return konfig.elemente.flatMap((el) =>
    elementSitzIds(el).map((sitzId) => ({ sitzId, kategorieId: el.kategorie_id }))
  );
}

export const LEERE_KONFIGURATION: SitzplanKonfiguration = {
  breite: 900,
  hoehe: 620,
  buehne: { x: 450, y: 50, breite: 500, hoehe: 44, winkel: 0, label: "BÜHNE" },
  kategorien: DEFAULT_KATEGORIEN,
  elemente: [],
};

// Migration älterer Pläne
export function migrierteKonfiguration(raw: unknown): SitzplanKonfiguration {
  const k = raw as Record<string, unknown>;
  const basis: SitzplanKonfiguration = {
    ...LEERE_KONFIGURATION,
    breite: (k.breite as number) || LEERE_KONFIGURATION.breite,
    hoehe:  (k.hoehe  as number) || LEERE_KONFIGURATION.hoehe,
    kategorien: (k.kategorien as Preiskategorie[]) || DEFAULT_KATEGORIEN,
  };
  if (k.buehne) {
    const b = k.buehne as Record<string, unknown>;
    basis.buehne = {
      x:      (b.x      as number)  ?? LEERE_KONFIGURATION.buehne.x,
      y:      (b.y      as number)  ?? LEERE_KONFIGURATION.buehne.y,
      breite: (b.breite as number)  ?? LEERE_KONFIGURATION.buehne.breite,
      hoehe:  (b.hoehe  as number)  ?? LEERE_KONFIGURATION.buehne.hoehe,
      winkel: (b.winkel as number)  ?? 0,
      label:  (b.label  as string)  ?? "BÜHNE",
    };
  }
  if (Array.isArray(k.elemente)) {
    basis.elemente = (k.elemente as Record<string, unknown>[]).map((e) => ({
      ...e,
      // alte "kategorie" → "kategorie_id"
      kategorie_id: (e.kategorie_id as string) ??
        ((e.kategorie as string) === "premium" ? "kat-2" : "kat-1"),
    })) as SitzplanElement[];
  }
  return basis;
}
