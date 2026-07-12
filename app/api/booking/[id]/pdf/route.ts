import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { generiereBuchungsPdf } from "@/lib/buchung-pdf";

// Gast-Self-Service: PDF-Download über die (unerratbare) Buchungs-UUID.
// Nur bezahlte Buchungen; keine personenbezogenen Daten über die
// Buchung hinaus abrufbar.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Ungültige Buchung" }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimit(`gast-pdf:${ip}`, 20, 60)) {
    return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 });
  }

  const ergebnis = await generiereBuchungsPdf(id, { nurBezahlte: true });
  if (!ergebnis) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  return new NextResponse(new Uint8Array(ergebnis.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ergebnis.dateiname}"`,
      "Cache-Control": "no-store",
    },
  });
}
