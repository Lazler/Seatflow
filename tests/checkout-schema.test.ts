import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas mirrored from app/api/checkout/route.ts
const SitzplatzSchema = z.object({
  sitzId: z.string().min(1).max(100),
  kategorieId: z.string().uuid(),
  preisCent: z.number().int().nonnegative(),
  kategorieName: z.string().min(1).max(200),
  bezeichnung: z.string().max(300).optional(),
  ticketTyp: z.object({
    id: z.string().uuid(),
    name: z.string().max(100),
    extra_felder: z.record(z.string(), z.string()),
  }).nullable().optional(),
});

const CheckoutSchema = z.object({
  eventId: z.string().uuid(),
  sitzplaetze: z.array(SitzplatzSchema).min(1).max(20),
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(300),
  sprache: z.enum(["de", "en", "hu"]).optional(),
});

const uuid = () => "550e8400-e29b-41d4-a716-446655440000";

const validSitz = () => ({
  sitzId: "A-1",
  kategorieId: uuid(),
  preisCent: 1500,
  kategorieName: "Standard",
});

const validCheckout = () => ({
  eventId: uuid(),
  sitzplaetze: [validSitz()],
  name: "Max Mustermann",
  email: "max@example.com",
});

describe("CheckoutSchema", () => {
  it("accepts valid checkout", () => {
    expect(CheckoutSchema.safeParse(validCheckout()).success).toBe(true);
  });

  it("rejects negative preisCent", () => {
    const data = validCheckout();
    data.sitzplaetze[0].preisCent = -1;
    expect(CheckoutSchema.safeParse(data).success).toBe(false);
  });

  it("rejects empty sitzplaetze array", () => {
    expect(CheckoutSchema.safeParse({ ...validCheckout(), sitzplaetze: [] }).success).toBe(false);
  });

  it("rejects more than 20 sitzplaetze", () => {
    const data = { ...validCheckout(), sitzplaetze: Array(21).fill(validSitz()) };
    expect(CheckoutSchema.safeParse(data).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(CheckoutSchema.safeParse({ ...validCheckout(), email: "kein-email" }).success).toBe(false);
  });

  it("rejects empty name", () => {
    expect(CheckoutSchema.safeParse({ ...validCheckout(), name: "" }).success).toBe(false);
  });

  it("rejects invalid sprache", () => {
    expect(CheckoutSchema.safeParse({ ...validCheckout(), sprache: "fr" }).success).toBe(false);
  });

  it("accepts all valid sprache values", () => {
    for (const sprache of ["de", "en", "hu"] as const) {
      expect(CheckoutSchema.safeParse({ ...validCheckout(), sprache }).success).toBe(true);
    }
  });

  it("trims whitespace from name", () => {
    const result = CheckoutSchema.safeParse({ ...validCheckout(), name: "  Max  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Max");
  });
});
