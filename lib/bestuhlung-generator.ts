// Reine (seiteneffektfreie) Bestuhlungs-Generatoren für den Saalplan-Editor.
// Aus der Editor-Komponente extrahiert, damit die – für SeatFlow zentrale –
// Auto-Bestuhlung testbar ist: gegebene Parameter → exakte Elemente, ohne
// React/Konva/State. Die UUID-Erzeugung ist injizierbar, damit Tests
// deterministisch bleiben.
import { naechsteBezeichnung, DEFAULT_KATEGORIEN } from "@/types/sitzplan";
import type {
  SitzplanKonfiguration,
  SitzplanElement,
  ReiheElement,
  RundtischElement,
} from "@/types/sitzplan";

export const SITZ_ABSTAND_GEN = 32;
export const REIHEN_ABSTAND_GEN = 46;

export type UUID = () => string;
const defaultUUID: UUID = () => crypto.randomUUID();

export type Bestuhlung = {
  neu: SitzplanElement[];
  hoeheNoetig: number;
  breiteNoetig: number;
};

// Reihenbestuhlung (optional mit Mittelgang → geteilte Reihen mit
// durchlaufender Nummerierung über den Gang hinweg).
export function erzeugeReihenbestuhlung(
  konfig: SitzplanKonfiguration,
  reihen: number,
  sitzeProReihe: number,
  mittelgang: boolean,
  uuid: UUID = defaultUUID,
): Bestuhlung {
  const kat = konfig.kategorien[0]?.id ?? DEFAULT_KATEGORIEN[0].id;
  const startY = konfig.buehne.y + konfig.buehne.hoehe / 2 + 90;
  const mitteX = konfig.breite / 2;
  const gangHalb = 28;
  const neu: SitzplanElement[] = [];
  const basisElemente = [...konfig.elemente];

  for (let r = 0; r < reihen; r++) {
    const y = startY + r * REIHEN_ABSTAND_GEN;
    const bez = naechsteBezeichnung([...basisElemente, ...neu], "");
    const gemeinsam = { winkel: 0, kategorie_id: kat };
    if (mittelgang && sitzeProReihe >= 4) {
      const links = Math.ceil(sitzeProReihe / 2);
      const rechts = sitzeProReihe - links;
      const wLinks = (links - 1) * SITZ_ABSTAND_GEN;
      const wRechts = (rechts - 1) * SITZ_ABSTAND_GEN;
      neu.push({
        ...gemeinsam, typ: "reihe", id: uuid(), bezeichnung: bez,
        x: Math.round(mitteX - gangHalb - wLinks / 2), y,
        anzahlSitze: links, sitzAbstand: SITZ_ABSTAND_GEN,
      } satisfies ReiheElement);
      neu.push({
        ...gemeinsam, typ: "reihe", id: uuid(), bezeichnung: bez,
        x: Math.round(mitteX + gangHalb + wRechts / 2), y,
        anzahlSitze: rechts, sitzAbstand: SITZ_ABSTAND_GEN,
        nummerStart: links + 1, labelAusblenden: true,
      } satisfies ReiheElement);
    } else {
      neu.push({
        ...gemeinsam, typ: "reihe", id: uuid(), bezeichnung: bez,
        x: Math.round(mitteX), y,
        anzahlSitze: sitzeProReihe, sitzAbstand: SITZ_ABSTAND_GEN,
      } satisfies ReiheElement);
    }
  }

  const hoeheNoetig = Math.ceil(startY + reihen * REIHEN_ABSTAND_GEN + 60);
  const breiteNoetig = Math.ceil(sitzeProReihe * SITZ_ABSTAND_GEN + (mittelgang ? 56 : 0) + 160);
  return { neu, hoeheNoetig, breiteNoetig };
}

// Rundtisch-Gruppe: Raster mit max. 3 Tischen pro Zeile, mittig ausgerichtet.
export function erzeugeRundtischGruppe(
  konfig: SitzplanKonfiguration,
  anzahl: number,
  sitzeProTisch: number,
  startYOffset = 90,
  uuid: UUID = defaultUUID,
): Bestuhlung {
  if (anzahl <= 0) return { neu: [], hoeheNoetig: konfig.hoehe, breiteNoetig: konfig.breite };
  const kat = konfig.kategorien[0]?.id ?? DEFAULT_KATEGORIEN[0].id;
  const startY = konfig.buehne.y + konfig.buehne.hoehe / 2 + startYOffset;
  const proZeile = Math.min(3, anzahl);
  const dx = 200, dy = 180, radius = 32;
  const mitteX = konfig.breite / 2;
  const neu: SitzplanElement[] = [];
  const basisElemente = [...konfig.elemente];

  for (let i = 0; i < anzahl; i++) {
    const spalte = i % proZeile;
    const zeile = Math.floor(i / proZeile);
    const zeilenBreite = (Math.min(proZeile, anzahl - zeile * proZeile) - 1) * dx;
    neu.push({
      typ: "rundtisch", id: uuid(),
      bezeichnung: naechsteBezeichnung([...basisElemente, ...neu], "R"),
      x: Math.round(mitteX - zeilenBreite / 2 + spalte * dx),
      y: Math.round(startY + 70 + zeile * dy),
      winkel: 0, kategorie_id: kat,
      anzahlSitze: sitzeProTisch, tischRadius: radius,
    } satisfies RundtischElement);
  }

  const zeilen = Math.ceil(anzahl / proZeile);
  const hoeheNoetig = Math.ceil(startY + 70 + zeilen * dy + 80);
  return { neu, hoeheNoetig, breiteNoetig: konfig.breite };
}
