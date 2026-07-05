import { describe, it, expect } from "vitest";
import { elementSitzIds, doppelteSitzIds, migrierteKonfiguration } from "@/types/sitzplan";
import type { ReiheElement, TischreiheElement, RundtischElement } from "@/types/sitzplan";

describe("elementSitzIds", () => {
  it("returns seat IDs for a Reihe element", () => {
    const el: ReiheElement = {
      typ: "reihe",
      id: "r1",
      bezeichnung: "A",
      x: 0, y: 0, winkel: 0,
      anzahlSitze: 5,
      sitzAbstand: 40,
      kategorie_id: "default",
    };
    const ids = elementSitzIds(el);
    expect(ids).toHaveLength(5);
    expect(ids[0]).toBe("A-1");
    expect(ids[4]).toBe("A-5");
  });

  it("returns seat IDs for a Tischreihe with sitzeOben + sitzeUnten", () => {
    const el: TischreiheElement = {
      typ: "tischreihe",
      id: "t1",
      bezeichnung: "T",
      x: 0, y: 0, winkel: 0,
      sitzeProSeite: 3,
      sitzeOben: true,
      sitzeUnten: true,
      kategorie_id: "default",
    };
    const ids = elementSitzIds(el);
    // 3 oben (T-1..T-3) + 3 unten (T-4..T-6)
    expect(ids).toHaveLength(6);
    expect(ids[0]).toBe("T-1");
    expect(ids[5]).toBe("T-6");
  });

  it("only counts sitzeOben when sitzeUnten is false", () => {
    const el: TischreiheElement = {
      typ: "tischreihe",
      id: "t2",
      bezeichnung: "T",
      x: 0, y: 0, winkel: 0,
      sitzeProSeite: 4,
      sitzeOben: true,
      sitzeUnten: false,
      kategorie_id: "default",
    };
    expect(elementSitzIds(el)).toHaveLength(4);
  });

  it("returns seat IDs for a Rundtisch", () => {
    const el: RundtischElement = {
      typ: "rundtisch",
      id: "rt1",
      bezeichnung: "R",
      x: 0, y: 0, winkel: 0,
      anzahlSitze: 4,
      tischRadius: 60,
      kategorie_id: "default",
    };
    const ids = elementSitzIds(el);
    expect(ids).toHaveLength(4);
    expect(ids[0]).toBe("R-1");
  });
});

describe("migrierteKonfiguration", () => {
  it("returns default config for empty object", () => {
    const result = migrierteKonfiguration({});
    expect(result.elemente).toEqual([]);
    expect(result.breite).toBeGreaterThan(0);
    expect(result.hoehe).toBeGreaterThan(0);
  });

  it("preserves valid breite/hoehe", () => {
    const result = migrierteKonfiguration({ breite: 1200, hoehe: 800, elemente: [] });
    expect(result.breite).toBe(1200);
    expect(result.hoehe).toBe(800);
  });

  it("always returns a kategorien array", () => {
    const result = migrierteKonfiguration({ breite: 800, hoehe: 600 });
    expect(Array.isArray(result.kategorien)).toBe(true);
  });

  it("preserves elemente array", () => {
    const result = migrierteKonfiguration({
      breite: 800, hoehe: 600,
      elemente: [{ typ: "reihe", id: "r1", bezeichnung: "A", x: 0, y: 0, winkel: 0, anzahlSitze: 3, sitzAbstand: 40, kategorie_id: null }],
    });
    expect(result.elemente).toHaveLength(1);
  });
});

describe("nummerStart + doppelteSitzIds (geteilte Reihen)", () => {
  const linkeHaelfte: ReiheElement = {
    typ: "reihe", id: "l", bezeichnung: "A", x: 0, y: 0, winkel: 0,
    anzahlSitze: 6, sitzAbstand: 32, kategorie_id: "k",
  };
  const rechteHaelfte: ReiheElement = {
    typ: "reihe", id: "r", bezeichnung: "A", x: 300, y: 0, winkel: 0,
    anzahlSitze: 6, sitzAbstand: 32, kategorie_id: "k",
    nummerStart: 7, labelAusblenden: true,
  };

  it("continues numbering across the aisle", () => {
    const ids = elementSitzIds(rechteHaelfte);
    expect(ids[0]).toBe("A-7");
    expect(ids[5]).toBe("A-12");
  });

  it("split rows with disjoint ranges do not collide", () => {
    expect(doppelteSitzIds([linkeHaelfte, rechteHaelfte])).toEqual([]);
  });

  it("same bezeichnung with overlapping ranges IS a collision", () => {
    const kollision: ReiheElement = { ...rechteHaelfte, id: "r2", nummerStart: 6 };
    const dupes = doppelteSitzIds([linkeHaelfte, kollision]);
    expect(dupes).toContain("A-6");
  });
});
