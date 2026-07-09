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
export type ElementTyp = "reihe" | "tischreihe" | "rundtisch" | "stehplatz" | "text";

type BasisElement = {
  id: string;
  bezeichnung: string;
  x: number;
  y: number;
  winkel: number;
  kategorie_id: string;
  nummerAusblenden?: boolean;
};

export type ReiheElement = BasisElement & {
  typ: "reihe";
  anzahlSitze: number;
  sitzAbstand: number;
  // Erste Sitznummer (Default 1) — erlaubt geteilte Reihen mit Mittelgang:
  // links "A" 1–6, rechts "A" ab 7. Sitz-IDs bleiben eindeutig.
  nummerStart?: number;
  // Reihen-Label-Chip ausblenden (rechte Hälfte einer geteilten Reihe)
  labelAusblenden?: boolean;
  // Krümmung als Pfeilhöhe in px (0 = gerade): Reihen-Enden biegen sich
  // von der Bühne weg — wie im echten Theater-Halbrund
  bogen?: number;
  // Nummerierungsrichtung (Default ltr): manche Häuser zählen von rechts
  nummerRichtung?: "ltr" | "rtl";
};

export type TischreiheElement = BasisElement & {
  typ: "tischreihe";
  sitzeProSeite: number;  // seats along each long side
  sitzeOben: boolean;     // enable top row of seats
  sitzeUnten: boolean;    // enable bottom row of seats
};

export type RundtischElement = BasisElement & {
  typ: "rundtisch";
  anzahlSitze: number;
  tischRadius: number;
};

// Freie Zone ohne feste Plätze — verkauft `kapazitaet` Stehplätze
export type StehplatzElement = BasisElement & {
  typ: "stehplatz";
  breite: number;
  hoehe: number;
  kapazitaet: number;
};

// Reine Beschriftung (Eingang, Bar, WC, Notausgang …) — keine Plätze
export type TextElement = BasisElement & {
  typ: "text";
  text: string;
  fontSize: number;
};

export type SitzplanElement = ReiheElement | TischreiheElement | RundtischElement | StehplatzElement | TextElement;

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
  // Einzeln gesperrte Plätze (Technik, Kamera, defekt) — nicht buchbar
  gesperrteSitze?: string[];
  // Barrierefreie Plätze (Rollstuhl) — buchbar, mit Symbol gekennzeichnet
  barrierefreieSitze?: string[];
};

// --- Konstanten ---
export const SITZ_RADIUS = 13;
export const TISCH_HOEHE = 28;
export const TISCH_SITZ_ABSTAND = 32;
export const TISCH_SEAT_GAP = 8;
export const FARBE_BELEGT             = "#94a3b8";
export const FARBE_AUSGEWAEHLT        = "#10b981";
export const FARBE_ELEMENT_SELEKTIERT = "#f59e0b";

// --- Hilfsfunktionen ---

export function elementSitzIds(el: SitzplanElement): string[] {
  switch (el.typ) {
    case "tischreihe": {
      const ids: string[] = [];
      if (el.sitzeOben)
        for (let i = 0; i < el.sitzeProSeite; i++) ids.push(`${el.bezeichnung}-${i + 1}`);
      if (el.sitzeUnten)
        for (let i = 0; i < el.sitzeProSeite; i++) ids.push(`${el.bezeichnung}-${el.sitzeProSeite + i + 1}`);
      return ids;
    }
    case "text":
      return [];
    case "stehplatz":
      return Array.from({ length: el.kapazitaet }, (_, i) => `${el.bezeichnung}-${i + 1}`);
    case "reihe": {
      const start = el.nummerStart ?? 1;
      return Array.from({ length: el.anzahlSitze }, (_, i) => `${el.bezeichnung}-${start + i}`);
    }
    default:
      return Array.from({ length: el.anzahlSitze }, (_, i) => `${el.bezeichnung}-${i + 1}`);
  }
}

// Kollidierende Sitz-IDs über alle Elemente (statt bloßem Bezeichnungs-
// Vergleich — geteilte Reihen teilen sich legitim eine Bezeichnung)
export function doppelteSitzIds(elemente: SitzplanElement[]): string[] {
  const gesehen = new Set<string>();
  const doppelt = new Set<string>();
  for (const el of elemente) {
    for (const id of elementSitzIds(el)) {
      if (gesehen.has(id)) doppelt.add(id);
      else gesehen.add(id);
    }
  }
  return [...doppelt];
}

export function tischreiheBreite(el: TischreiheElement): number {
  return el.sitzeProSeite * TISCH_SITZ_ABSTAND;
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

// --- Multi-Floor Sitz-Namespacing ---
// Bei Events mit mehreren Ebenen wird die Sitz-ID mit der Floor-ID
// qualifiziert ("<floorId>:A-1"), damit gleichnamige Reihen auf
// verschiedenen Ebenen nicht kollidieren. Einzel-Floor-Events bleiben
// unpräfixiert (rückwärtskompatibel zu bestehenden Tickets).

export function floorSitzId(floorId: string | null, sitzId: string): string {
  return floorId ? `${floorId}:${sitzId}` : sitzId;
}

// Anzeige-Name: alles nach dem letzten ":" (unpräfixierte IDs unverändert)
export function sitzAnzeige(sitzplatzId: string): string {
  const i = sitzplatzId.lastIndexOf(":");
  return i === -1 ? sitzplatzId : sitzplatzId.slice(i + 1);
}

// Legacy-IDs ohne Präfix blockieren sicherheitshalber auf allen Ebenen
export function sitzGehoertZuFloor(sitzplatzId: string, floorId: string): boolean {
  return !sitzplatzId.includes(":") || sitzplatzId.startsWith(`${floorId}:`);
}

// Alle Sitze mit ihrer Kategorie
export function alleSitze(konfig: SitzplanKonfiguration): { sitzId: string; kategorieId: string }[] {
  return konfig.elemente.flatMap((el) =>
    elementSitzIds(el).map((sitzId) => ({ sitzId, kategorieId: el.kategorie_id }))
  );
}

// Achsenparallele Ausdehnung eines einzelnen Elements ab dessen Mittelpunkt
// (grob, inkl. Sitzradius/Labels). Rotation wird konservativ über den
// Diagonalradius abgedeckt, damit nie etwas abgeschnitten wird.
function elementHalbmasse(el: SitzplanElement): { hw: number; hh: number } {
  let hw = 0, hh = 0;
  switch (el.typ) {
    case "reihe": {
      const w = Math.max(0, el.anzahlSitze - 1) * el.sitzAbstand;
      hw = w / 2 + SITZ_RADIUS + 34; // + Reihen-Label-Chip links
      hh = SITZ_RADIUS + Math.abs(el.bogen ?? 0) + 8;
      break;
    }
    case "tischreihe": {
      hw = (el.sitzeProSeite * TISCH_SITZ_ABSTAND) / 2;
      hh = TISCH_HOEHE / 2 + TISCH_SEAT_GAP + SITZ_RADIUS * 2;
      break;
    }
    case "rundtisch": {
      hw = hh = el.tischRadius + SITZ_RADIUS * 2 + 16;
      break;
    }
    case "stehplatz": {
      hw = el.breite / 2;
      hh = el.hoehe / 2;
      break;
    }
    case "text": {
      hw = Math.max(48, el.text.length * el.fontSize * 0.78 + 12) / 2;
      hh = el.fontSize;
      break;
    }
  }
  if (el.winkel) { const r = Math.hypot(hw, hh); hw = hh = r; }
  return { hw, hh };
}

// Tatsächliche Inhaltsgrenzen (Bühne + alle Elemente). Anders als
// breite/hoehe beschreibt dies, wo der Inhalt WIRKLICH liegt — Basis dafür,
// den ganzen Plan im Buchungs-Canvas zu zeigen.
export function inhaltsGrenzen(k: SitzplanKonfiguration): { x: number; y: number; breite: number; hoehe: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (cx: number, cy: number, hw: number, hh: number) => {
    minX = Math.min(minX, cx - hw); maxX = Math.max(maxX, cx + hw);
    minY = Math.min(minY, cy - hh); maxY = Math.max(maxY, cy + hh);
  };
  const b = k.buehne;
  const t = (b.winkel * Math.PI) / 180;
  const bw = Math.abs(Math.cos(t)) * b.breite + Math.abs(Math.sin(t)) * b.hoehe;
  const bh = Math.abs(Math.sin(t)) * b.breite + Math.abs(Math.cos(t)) * b.hoehe;
  add(b.x, b.y, bw / 2, bh / 2);
  for (const el of k.elemente) {
    const { hw, hh } = elementHalbmasse(el);
    add(el.x, el.y, hw, hh);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, breite: k.breite, hoehe: k.hoehe };
  return { x: minX, y: minY, breite: maxX - minX, hoehe: maxY - minY };
}

// Verschiebt den Inhalt in den Ursprung (+ Rand) und setzt die Leinwandgröße
// auf die tatsächliche Ausdehnung. So zeigt der Buchungs-Canvas immer den
// ganzen Plan — auch wenn er außermittig oder auf einer zu großen Leinwand
// angelegt wurde. Sitz-IDs bleiben unverändert (nur x/y verschieben sich).
export function aufInhaltZugeschnitten(k: SitzplanKonfiguration, rand = 28): SitzplanKonfiguration {
  const g = inhaltsGrenzen(k);
  if (g.breite <= 0 || g.hoehe <= 0) return k;
  const dx = rand - g.x;
  const dy = rand - g.y;
  return {
    ...k,
    breite: Math.ceil(g.breite + rand * 2),
    hoehe: Math.ceil(g.hoehe + rand * 2),
    buehne: { ...k.buehne, x: k.buehne.x + dx, y: k.buehne.y + dy },
    elemente: k.elemente.map((el) => ({ ...el, x: el.x + dx, y: el.y + dy })),
  };
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
    gesperrteSitze: Array.isArray(k.gesperrteSitze) ? (k.gesperrteSitze as string[]) : [],
    barrierefreieSitze: Array.isArray(k.barrierefreieSitze) ? (k.barrierefreieSitze as string[]) : [],
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
    basis.elemente = (k.elemente as Record<string, unknown>[]).map((e) => {
      const base = {
        ...e,
        kategorie_id: (e.kategorie_id as string) ??
          ((e.kategorie as string) === "premium" ? "kat-2" : "kat-1"),
      };
      if (e.typ === "tischreihe") {
        return {
          ...base,
          sitzeProSeite: (e.sitzeProSeite as number) ?? (e.sitzeProTisch as number) ?? 4,
          sitzeOben: (e.sitzeOben as boolean) ?? true,
          sitzeUnten: (e.sitzeUnten as boolean) ?? true,
        };
      }
      return base;
    }) as SitzplanElement[];
  }
  return basis;
}
