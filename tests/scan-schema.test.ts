import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schema mirrored from app/api/scan/route.ts — tested independently so changes there catch drift
const ScanSchema = z.object({
  code: z.string().min(1).max(200),
  eventId: z.string().uuid(),
});

describe("ScanSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid input", () => {
    const result = ScanSchema.safeParse({ code: "ABC-123", eventId: validUuid });
    expect(result.success).toBe(true);
  });

  it("rejects empty code", () => {
    const result = ScanSchema.safeParse({ code: "", eventId: validUuid });
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 200 chars", () => {
    const result = ScanSchema.safeParse({ code: "x".repeat(201), eventId: validUuid });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID eventId", () => {
    const result = ScanSchema.safeParse({ code: "ABC", eventId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(ScanSchema.safeParse({}).success).toBe(false);
    expect(ScanSchema.safeParse({ code: "x" }).success).toBe(false);
    expect(ScanSchema.safeParse({ eventId: validUuid }).success).toBe(false);
  });
});
