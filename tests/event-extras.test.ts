import { describe, it, expect } from "vitest";
import { fruehbucherAktiv, fruehbucherPreis } from "@/types/event-extras";

describe("fruehbucherAktiv", () => {
  const jetzt = new Date("2026-07-05T12:00:00Z");

  it("active when deadline is in the future", () => {
    expect(fruehbucherAktiv({ prozent: 20, bis: "2026-08-01T23:59:59Z" }, jetzt)).toBe(true);
  });

  it("inactive when deadline has passed", () => {
    expect(fruehbucherAktiv({ prozent: 20, bis: "2026-06-01T23:59:59Z" }, jetzt)).toBe(false);
  });

  it("inactive for null / zero percent / invalid date", () => {
    expect(fruehbucherAktiv(null, jetzt)).toBe(false);
    expect(fruehbucherAktiv(undefined, jetzt)).toBe(false);
    expect(fruehbucherAktiv({ prozent: 0, bis: "2026-08-01" }, jetzt)).toBe(false);
    expect(fruehbucherAktiv({ prozent: 20, bis: "kein-datum" }, jetzt)).toBe(false);
  });
});

describe("fruehbucherPreis", () => {
  it("applies percentage discount with correct rounding", () => {
    expect(fruehbucherPreis(2000, { prozent: 20, bis: "" })).toBe(1600);
    expect(fruehbucherPreis(1500, { prozent: 15, bis: "" })).toBe(1275);
    // 999 * 0.9 = 899.1 → 899
    expect(fruehbucherPreis(999, { prozent: 10, bis: "" })).toBe(899);
  });

  it("clamps percentage to 0–90", () => {
    expect(fruehbucherPreis(1000, { prozent: 200, bis: "" })).toBe(100); // max 90 %
    expect(fruehbucherPreis(1000, { prozent: -5, bis: "" })).toBe(1000);
  });
});
