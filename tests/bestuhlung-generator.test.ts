import { describe, it, expect } from "vitest";
import {
  erzeugeReihenbestuhlung,
  erzeugeRundtischGruppe,
  SITZ_ABSTAND_GEN,
} from "@/lib/bestuhlung-generator";
import { alleSitze, doppelteSitzIds, LEERE_KONFIGURATION } from "@/types/sitzplan";
import type { SitzplanKonfiguration } from "@/types/sitzplan";

// Deterministische, kollisionsfreie IDs statt crypto.randomUUID()
const uuidFactory = () => {
  let n = 0;
  return () => `id-${n++}`;
};
const konfig = (o: Partial<SitzplanKonfiguration> = {}): SitzplanKonfiguration => ({
  ...LEERE_KONFIGURATION, ...o,
});

describe("erzeugeReihenbestuhlung", () => {
  it("ohne Mittelgang: eine Reihe pro Zeile, exakte Sitzzahl", () => {
    const { neu } = erzeugeReihenbestuhlung(konfig(), 3, 10, false, uuidFactory());
    expect(neu).toHaveLength(3); // 3 Reihen, je 1 Element
    const alle = neu.flatMap((el) => alleSitze({ ...LEERE_KONFIGURATION, elemente: [el] }));
    expect(alle).toHaveLength(30); // 3 × 10
  });

  it("mit Mittelgang: geteilte Reihen, durchlaufende Nummerierung, keine ID-Kollision", () => {
    const { neu } = erzeugeReihenbestuhlung(konfig(), 2, 12, true, uuidFactory());
    expect(neu).toHaveLength(4); // 2 Reihen × (links + rechts)
    // Reihe A: links 6 + rechts 6, Nummern 1..12 durchlaufend
    const reiheA = neu.filter((e) => e.bezeichnung === "A");
    const idsA = reiheA.flatMap((el) => alleSitze({ ...LEERE_KONFIGURATION, elemente: [el] }).map((s) => s.sitzId));
    expect(idsA.sort()).toEqual(
      ["A-1", "A-10", "A-11", "A-12", "A-2", "A-3", "A-4", "A-5", "A-6", "A-7", "A-8", "A-9"].sort()
    );
    // Rechte Hälfte hat Label ausgeblendet + nummerStart 7
    const rechts = reiheA.find((e) => e.typ === "reihe" && e.labelAusblenden);
    expect(rechts).toBeDefined();
    expect(rechts && rechts.typ === "reihe" && rechts.nummerStart).toBe(7);
    // Insgesamt keine doppelten Sitz-IDs
    expect(doppelteSitzIds(neu)).toEqual([]);
  });

  it("Mittelgang wird bei < 4 Sitzen pro Reihe ignoriert (eine Reihe)", () => {
    const { neu } = erzeugeReihenbestuhlung(konfig(), 1, 3, true, uuidFactory());
    expect(neu).toHaveLength(1);
  });

  it("Reihen bekommen aufeinanderfolgende Buchstaben ohne Kollision", () => {
    const { neu } = erzeugeReihenbestuhlung(konfig(), 3, 10, false, uuidFactory());
    expect(neu.map((e) => e.bezeichnung)).toEqual(["A", "B", "C"]);
    expect(doppelteSitzIds(neu)).toEqual([]);
  });

  it("berücksichtigt bestehende Reihen bei der Benennung (setzt fort)", () => {
    const bestehend = konfig({
      elemente: [{ typ: "reihe", id: "x", bezeichnung: "A", x: 0, y: 0, winkel: 0, kategorie_id: "kat-1", anzahlSitze: 5, sitzAbstand: 30 }],
    });
    const { neu } = erzeugeReihenbestuhlung(bestehend, 2, 10, false, uuidFactory());
    expect(neu.map((e) => e.bezeichnung)).toEqual(["B", "C"]);
  });

  it("wächst die Leinwand mit der Reihenzahl", () => {
    const wenig = erzeugeReihenbestuhlung(konfig(), 2, 10, false, uuidFactory());
    const viel = erzeugeReihenbestuhlung(konfig(), 20, 10, false, uuidFactory());
    expect(viel.hoeheNoetig).toBeGreaterThan(wenig.hoeheNoetig);
  });

  it("verwendet die erste Kategorie der Konfiguration", () => {
    const k = konfig({ kategorien: [{ id: "kat-x", name: "X", preis_cent: 1000, farbe: "#000" }] });
    const { neu } = erzeugeReihenbestuhlung(k, 1, 8, false, uuidFactory());
    expect(neu[0].kategorie_id).toBe("kat-x");
  });

  it("Sitzabstand entspricht der Generator-Konstante", () => {
    const { neu } = erzeugeReihenbestuhlung(konfig(), 1, 5, false, uuidFactory());
    expect(neu[0].typ === "reihe" && neu[0].sitzAbstand).toBe(SITZ_ABSTAND_GEN);
  });
});

describe("erzeugeRundtischGruppe", () => {
  it("erzeugt die angeforderte Tischanzahl mit korrekter Sitzzahl je Tisch", () => {
    const { neu } = erzeugeRundtischGruppe(konfig(), 6, 8, 90, uuidFactory());
    expect(neu).toHaveLength(6);
    expect(neu.every((e) => e.typ === "rundtisch" && e.anzahlSitze === 8)).toBe(true);
    const gesamt = alleSitze({ ...LEERE_KONFIGURATION, elemente: neu });
    expect(gesamt).toHaveLength(48); // 6 × 8
    expect(doppelteSitzIds(neu)).toEqual([]);
  });

  it("benennt Tische R1, R2, … (Präfix R) ohne Kollision", () => {
    const { neu } = erzeugeRundtischGruppe(konfig(), 4, 6, 90, uuidFactory());
    expect(neu.map((e) => e.bezeichnung)).toEqual(["R1", "R2", "R3", "R4"]);
  });

  it("ordnet in Zeilen zu je 3 an (4 Tische → 2 Zeilen)", () => {
    const { neu } = erzeugeRundtischGruppe(konfig(), 4, 6, 90, uuidFactory());
    const ys = [...new Set(neu.map((e) => e.y))];
    expect(ys).toHaveLength(2); // 2 verschiedene Zeilen-Y
  });

  it("anzahl 0 liefert nichts (kein Division-durch-Null)", () => {
    const { neu } = erzeugeRundtischGruppe(konfig(), 0, 6, 90, uuidFactory());
    expect(neu).toEqual([]);
  });
});
