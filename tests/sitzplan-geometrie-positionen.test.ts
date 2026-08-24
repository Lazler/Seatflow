import { describe, it, expect } from "vitest";
import {
  reihenBreite,
  reihenSitzPositionen,
  rundtischSitzRadius,
  rundtischSitzPositionen,
} from "@/lib/sitzplan-geometrie";
import { SITZ_RADIUS } from "@/types/sitzplan";
import type { ReiheElement, RundtischElement } from "@/types/sitzplan";

const reihe = (o: Partial<ReiheElement> = {}): ReiheElement => ({
  typ: "reihe", id: "r", bezeichnung: "A", x: 0, y: 0, winkel: 0,
  kategorie_id: "kat-1", anzahlSitze: 5, sitzAbstand: 30, ...o,
});
const rundtisch = (o: Partial<RundtischElement> = {}): RundtischElement => ({
  typ: "rundtisch", id: "rt", bezeichnung: "R", x: 0, y: 0, winkel: 0,
  kategorie_id: "kat-1", anzahlSitze: 6, tischRadius: 32, ...o,
});

describe("reihenBreite", () => {
  it("ist (Sitze-1) * Abstand", () => {
    expect(reihenBreite(reihe({ anzahlSitze: 5, sitzAbstand: 30 }))).toBe(120);
  });
  it("ist 0 bei einem einzelnen Sitz", () => {
    expect(reihenBreite(reihe({ anzahlSitze: 1 }))).toBe(0);
  });
});

describe("reihenSitzPositionen — gerade Reihe", () => {
  it("verteilt Sitze gleichmäßig auf einer Linie (y=0)", () => {
    const p = reihenSitzPositionen(reihe({ anzahlSitze: 4, sitzAbstand: 30 }));
    expect(p.map((s) => s.x)).toEqual([0, 30, 60, 90]);
    expect(p.every((s) => s.y === 0)).toBe(true);
  });
  it("nummeriert ltr ab nummerStart und bildet die Sitz-ID", () => {
    const p = reihenSitzPositionen(reihe({ bezeichnung: "B", anzahlSitze: 3, nummerStart: 7 }));
    expect(p.map((s) => s.nummer)).toEqual([7, 8, 9]);
    expect(p.map((s) => s.sitzId)).toEqual(["B-7", "B-8", "B-9"]);
  });
});

describe("reihenSitzPositionen — Nummerierungsrichtung", () => {
  it("rtl kehrt die Nummern um, Positionen bleiben links→rechts", () => {
    const p = reihenSitzPositionen(reihe({ anzahlSitze: 4, nummerRichtung: "rtl" }));
    // Sitz ganz links (x=0) trägt die höchste Nummer
    expect(p.map((s) => s.nummer)).toEqual([4, 3, 2, 1]);
    expect(p.map((s) => s.x)).toEqual([0, 30, 60, 90]);
  });
  it("rtl respektiert nummerStart", () => {
    const p = reihenSitzPositionen(reihe({ anzahlSitze: 3, nummerStart: 10, nummerRichtung: "rtl" }));
    expect(p.map((s) => s.nummer)).toEqual([12, 11, 10]);
  });
});

describe("reihenSitzPositionen — gebogene Reihe", () => {
  it("bogen=0 lässt alle Sitze auf einer Geraden", () => {
    expect(reihenSitzPositionen(reihe({ bogen: 0 })).every((s) => s.y === 0)).toBe(true);
  });
  it("wölbt die Enden nach hinten (Enden = +bogen, Mitte ~0)", () => {
    const p = reihenSitzPositionen(reihe({ anzahlSitze: 5, bogen: 40 }));
    expect(p[0].y).toBeCloseTo(40, 5); // linkes Ende
    expect(p[4].y).toBeCloseTo(40, 5); // rechtes Ende
    expect(p[2].y).toBeCloseTo(0, 5);  // Mitte
    // symmetrisch + monoton zur Mitte hin fallend
    expect(p[1].y).toBeCloseTo(p[3].y, 5);
    expect(p[1].y).toBeLessThan(p[0].y);
  });
  it("ignoriert Bogen bei einem einzelnen Sitz (kein NaN)", () => {
    expect(reihenSitzPositionen(reihe({ anzahlSitze: 1, bogen: 40 }))[0].y).toBe(0);
  });
});

describe("rundtischSitzRadius", () => {
  it("ist tischRadius + Sitzradius + 8", () => {
    expect(rundtischSitzRadius(rundtisch({ tischRadius: 32 }))).toBe(32 + SITZ_RADIUS + 8);
  });
});

describe("rundtischSitzPositionen", () => {
  it("erster Sitz sitzt oben (−90°), IDs laufen 1..n", () => {
    const p = rundtischSitzPositionen(rundtisch({ anzahlSitze: 4 }));
    const radius = rundtischSitzRadius(rundtisch({ anzahlSitze: 4 }));
    expect(p.map((s) => s.sitzId)).toEqual(["R-1", "R-2", "R-3", "R-4"]);
    // Sitz 1 oben: x≈0, y≈-radius
    expect(p[0].x).toBeCloseTo(0, 5);
    expect(p[0].y).toBeCloseTo(-radius, 5);
    // Sitz 2 rechts: x≈+radius, y≈0
    expect(p[1].x).toBeCloseTo(radius, 5);
    expect(p[1].y).toBeCloseTo(0, 5);
  });
  it("alle Sitze liegen auf dem Sitzring (Abstand = radius)", () => {
    const el = rundtisch({ anzahlSitze: 8 });
    const radius = rundtischSitzRadius(el);
    for (const s of rundtischSitzPositionen(el)) {
      expect(Math.hypot(s.x, s.y)).toBeCloseTo(radius, 5);
    }
  });
  it("verteilt n Sitze gleichmäßig (Winkelabstand 2π/n)", () => {
    const p = rundtischSitzPositionen(rundtisch({ anzahlSitze: 6 }));
    const winkel = p.map((s) => Math.atan2(s.y, s.x));
    const d = ((winkel[1] - winkel[0]) + 2 * Math.PI) % (2 * Math.PI);
    expect(d).toBeCloseTo((2 * Math.PI) / 6, 5);
  });
});
