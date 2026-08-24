import { describe, it, expect } from "vitest";
import { floorSitzId, sitzAnzeige, sitzGehoertZuFloor } from "@/types/sitzplan";

const FLOOR_A = "11111111-1111-1111-1111-111111111111";
const FLOOR_B = "22222222-2222-2222-2222-222222222222";

describe("floorSitzId", () => {
  it("prefixes with floor id when given", () => {
    expect(floorSitzId(FLOOR_A, "A-1")).toBe(`${FLOOR_A}:A-1`);
  });

  it("returns plain id for single-floor events (null)", () => {
    expect(floorSitzId(null, "A-1")).toBe("A-1");
  });
});

describe("sitzAnzeige", () => {
  it("strips floor prefix", () => {
    expect(sitzAnzeige(`${FLOOR_A}:A-1`)).toBe("A-1");
  });

  it("passes through legacy unprefixed ids", () => {
    expect(sitzAnzeige("A-1")).toBe("A-1");
  });
});

describe("sitzGehoertZuFloor", () => {
  it("matches seats of the same floor", () => {
    expect(sitzGehoertZuFloor(`${FLOOR_A}:A-1`, FLOOR_A)).toBe(true);
  });

  it("does not match seats of another floor — the collision bug", () => {
    // Reihe "A" existiert auf beiden Ebenen: A-1 auf Floor B darf
    // Floor A nicht blockieren
    expect(sitzGehoertZuFloor(`${FLOOR_B}:A-1`, FLOOR_A)).toBe(false);
  });

  it("legacy unprefixed ids block on all floors (safe default)", () => {
    expect(sitzGehoertZuFloor("A-1", FLOOR_A)).toBe(true);
    expect(sitzGehoertZuFloor("A-1", FLOOR_B)).toBe(true);
  });
});
