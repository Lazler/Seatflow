import { describe, it, expect } from "vitest";
import {
  elementSitzIds,
  tischreiheBreite,
  naechsteBezeichnung,
  alleSitze,
  inhaltsGrenzen,
  aufInhaltZugeschnitten,
  zentriereInhalt,
  migrierteKonfiguration,
  LEERE_KONFIGURATION,
} from "@/types/sitzplan";
import type {
  ReiheElement,
  TischreiheElement,
  StehplatzElement,
  TextElement,
  RundtischElement,
  SitzplanElement,
  SitzplanKonfiguration,
} from "@/types/sitzplan";

// ── Fixtures ──────────────────────────────────────────────────────────────
const reihe = (o: Partial<ReiheElement> = {}): ReiheElement => ({
  typ: "reihe", id: o.id ?? "r1", bezeichnung: "A", x: 100, y: 100, winkel: 0,
  kategorie_id: "kat-1", anzahlSitze: 3, sitzAbstand: 30, ...o,
});
const tischreihe = (o: Partial<TischreiheElement> = {}): TischreiheElement => ({
  typ: "tischreihe", id: "t1", bezeichnung: "T", x: 100, y: 100, winkel: 0,
  kategorie_id: "kat-1", sitzeProSeite: 4, sitzeOben: true, sitzeUnten: true, ...o,
});
const stehplatz = (o: Partial<StehplatzElement> = {}): StehplatzElement => ({
  typ: "stehplatz", id: "s1", bezeichnung: "S", x: 100, y: 100, winkel: 0,
  kategorie_id: "kat-1", breite: 120, hoehe: 80, kapazitaet: 5, ...o,
});
const textEl = (o: Partial<TextElement> = {}): TextElement => ({
  typ: "text", id: "x1", bezeichnung: "X", x: 100, y: 100, winkel: 0,
  kategorie_id: "kat-1", text: "Bar", fontSize: 16, ...o,
});
const rundtisch = (o: Partial<RundtischElement> = {}): RundtischElement => ({
  typ: "rundtisch", id: "rt1", bezeichnung: "R", x: 100, y: 100, winkel: 0,
  kategorie_id: "kat-2", anzahlSitze: 6, tischRadius: 32, ...o,
});
const konfig = (elemente: SitzplanElement[]): SitzplanKonfiguration => ({
  ...LEERE_KONFIGURATION, elemente,
});

// ── elementSitzIds edge cases ──────────────────────────────────────────────
describe("elementSitzIds — Zonen-/Sonderfälle", () => {
  it("Stehplatz erzeugt so viele IDs wie kapazitaet", () => {
    expect(elementSitzIds(stehplatz({ kapazitaet: 4 }))).toEqual(["S-1", "S-2", "S-3", "S-4"]);
  });
  it("Text-Element erzeugt keine Plätze", () => {
    expect(elementSitzIds(textEl())).toEqual([]);
  });
  it("Reihe mit nummerStart nummeriert ab dem Offset", () => {
    expect(elementSitzIds(reihe({ bezeichnung: "A", anzahlSitze: 3, nummerStart: 7 })))
      .toEqual(["A-7", "A-8", "A-9"]);
  });
  it("Tischreihe: nur sitzeOben zählt die untere Reihe nicht", () => {
    expect(elementSitzIds(tischreihe({ sitzeProSeite: 2, sitzeUnten: false })))
      .toEqual(["T-1", "T-2"]);
  });
  it("Tischreihe: sitzeUnten setzt die Nummerierung hinter sitzeOben fort", () => {
    expect(elementSitzIds(tischreihe({ sitzeProSeite: 2 })))
      .toEqual(["T-1", "T-2", "T-3", "T-4"]);
  });
});

// ── tischreiheBreite ───────────────────────────────────────────────────────
describe("tischreiheBreite", () => {
  it("ist sitzeProSeite * Sitzabstand (32px)", () => {
    expect(tischreiheBreite(tischreihe({ sitzeProSeite: 4 }))).toBe(128);
    expect(tischreiheBreite(tischreihe({ sitzeProSeite: 1 }))).toBe(32);
  });
});

// ── naechsteBezeichnung ────────────────────────────────────────────────────
describe("naechsteBezeichnung", () => {
  it("startet bei A für einen leeren Plan", () => {
    expect(naechsteBezeichnung([])).toBe("A");
  });
  it("überspringt vergebene Buchstaben", () => {
    expect(naechsteBezeichnung([reihe({ bezeichnung: "A" }), reihe({ bezeichnung: "B" })])).toBe("C");
  });
  it("fällt nach Z auf R{n} zurück", () => {
    const alle = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((b, i) => reihe({ id: `r${i}`, bezeichnung: b }));
    expect(naechsteBezeichnung(alle)).toBe("R27");
  });
  it("mit Präfix nummeriert T1, T2, …", () => {
    expect(naechsteBezeichnung([], "T")).toBe("T1");
    expect(naechsteBezeichnung([rundtisch({ bezeichnung: "T1" })], "T")).toBe("T2");
  });
});

// ── alleSitze (Kapazität + Preiszuordnung) ─────────────────────────────────
describe("alleSitze", () => {
  it("summiert Sitze über alle Elementtypen mit korrekter Kategorie", () => {
    const sitze = alleSitze(konfig([
      reihe({ id: "a", bezeichnung: "A", anzahlSitze: 2, kategorie_id: "kat-1" }),
      stehplatz({ id: "s", bezeichnung: "S", kapazitaet: 3, kategorie_id: "kat-3" }),
      textEl({ id: "x" }),
    ]));
    expect(sitze).toHaveLength(5); // 2 + 3 + 0
    expect(sitze.filter((s) => s.kategorieId === "kat-1")).toHaveLength(2);
    expect(sitze.filter((s) => s.kategorieId === "kat-3")).toHaveLength(3);
    expect(sitze.map((s) => s.sitzId)).toEqual(["A-1", "A-2", "S-1", "S-2", "S-3"]);
  });
  it("leerer Plan hat keine Sitze", () => {
    expect(alleSitze(konfig([]))).toEqual([]);
  });
});

// ── inhaltsGrenzen ─────────────────────────────────────────────────────────
describe("inhaltsGrenzen", () => {
  it("liefert endliche, positive Grenzen auch ohne Elemente (nur Bühne)", () => {
    const g = inhaltsGrenzen(konfig([]));
    expect(Number.isFinite(g.x)).toBe(true);
    expect(g.breite).toBeGreaterThan(0);
    expect(g.hoehe).toBeGreaterThan(0);
  });
  it("dehnt sich um ein weit entferntes Element aus", () => {
    const nah = inhaltsGrenzen(konfig([reihe({ x: 200, y: 200 })]));
    const fern = inhaltsGrenzen(konfig([reihe({ x: 2000, y: 2000 })]));
    expect(fern.breite).toBeGreaterThan(nah.breite);
    expect(fern.hoehe).toBeGreaterThan(nah.hoehe);
  });
});

// ── aufInhaltZugeschnitten ─────────────────────────────────────────────────
describe("aufInhaltZugeschnitten", () => {
  it("verschiebt den Inhalt so, dass die obere linke Ecke beim Rand liegt", () => {
    const k = konfig([reihe({ x: 500, y: 500 }), rundtisch({ x: 900, y: 700 })]);
    const zug = aufInhaltZugeschnitten(k, 28);
    const g = inhaltsGrenzen(zug);
    expect(g.x).toBeCloseTo(28, 5);
    expect(g.y).toBeCloseTo(28, 5);
  });
  it("setzt die Leinwand auf Inhaltsausdehnung + 2*Rand", () => {
    const k = konfig([reihe({ x: 500, y: 500 })]);
    const g0 = inhaltsGrenzen(k);
    const zug = aufInhaltZugeschnitten(k, 28);
    expect(zug.breite).toBe(Math.ceil(g0.breite + 56));
    expect(zug.hoehe).toBe(Math.ceil(g0.hoehe + 56));
  });
  it("lässt die Sitz-IDs unverändert (nur Positionen verschieben sich)", () => {
    const k = konfig([reihe({ x: 500, y: 500, bezeichnung: "A", anzahlSitze: 4 })]);
    const vorher = alleSitze(k).map((s) => s.sitzId);
    const nachher = alleSitze(aufInhaltZugeschnitten(k, 28)).map((s) => s.sitzId);
    expect(nachher).toEqual(vorher);
  });
});

// ── zentriereInhalt ──────────────────────────────────────────────────────
describe("zentriereInhalt", () => {
  it("zentriert den Inhalt in der bestehenden Leinwand, statt sie zu verkleinern", () => {
    const k = { ...konfig([reihe({ x: 100, y: 100 })]), breite: 900, hoehe: 620 };
    const zentriert = zentriereInhalt(k);
    expect(zentriert.breite).toBe(k.breite);
    expect(zentriert.hoehe).toBe(k.hoehe);
    const g = inhaltsGrenzen(zentriert);
    expect(g.x + g.breite / 2).toBeCloseTo(k.breite / 2, 5);
    expect(g.y + g.hoehe / 2).toBeCloseTo(k.hoehe / 2, 5);
  });
  it("ist ein No-Op, wenn der Inhalt schon zentriert ist", () => {
    const k = { ...konfig([reihe({ x: 100, y: 100 })]), breite: 900, hoehe: 620 };
    const einmal = zentriereInhalt(k);
    const zweimal = zentriereInhalt(einmal);
    expect(zweimal).toBe(einmal);
  });
  it("lässt die Sitz-IDs unverändert (nur Positionen verschieben sich)", () => {
    const k = { ...konfig([reihe({ x: 100, y: 100, bezeichnung: "A", anzahlSitze: 4 })]), breite: 900, hoehe: 620 };
    const vorher = alleSitze(k).map((s) => s.sitzId);
    const nachher = alleSitze(zentriereInhalt(k)).map((s) => s.sitzId);
    expect(nachher).toEqual(vorher);
  });
});

// ── migrierteKonfiguration Migrationspfade ─────────────────────────────────
describe("migrierteKonfiguration — Legacy-Pfade", () => {
  it("mappt legacy 'sitzeProTisch' auf sitzeProSeite (+ beide Seiten an)", () => {
    const m = migrierteKonfiguration({
      elemente: [{ typ: "tischreihe", id: "t", bezeichnung: "T", x: 0, y: 0, winkel: 0, sitzeProTisch: 6 }],
    });
    const t = m.elemente[0] as TischreiheElement;
    expect(t.sitzeProSeite).toBe(6);
    expect(t.sitzeOben).toBe(true);
    expect(t.sitzeUnten).toBe(true);
  });
  it("übersetzt legacy kategorie 'premium' → kat-2, sonst kat-1", () => {
    const m = migrierteKonfiguration({
      elemente: [
        { typ: "reihe", id: "a", bezeichnung: "A", x: 0, y: 0, winkel: 0, anzahlSitze: 2, sitzAbstand: 30, kategorie: "premium" },
        { typ: "reihe", id: "b", bezeichnung: "B", x: 0, y: 0, winkel: 0, anzahlSitze: 2, sitzAbstand: 30, kategorie: "standard" },
      ],
    });
    expect(m.elemente[0].kategorie_id).toBe("kat-2");
    expect(m.elemente[1].kategorie_id).toBe("kat-1");
  });
  it("füllt fehlende Bühnen-Felder mit Defaults", () => {
    const m = migrierteKonfiguration({ buehne: { x: 10, y: 20 } });
    expect(m.buehne).toMatchObject({ x: 10, y: 20, winkel: 0, label: "BÜHNE" });
    expect(m.buehne.breite).toBeGreaterThan(0);
  });
  it("garantiert Arrays für gesperrte/barrierefreie Sitze", () => {
    const m = migrierteKonfiguration({});
    expect(Array.isArray(m.gesperrteSitze)).toBe(true);
    expect(Array.isArray(m.barrierefreieSitze)).toBe(true);
  });
});
