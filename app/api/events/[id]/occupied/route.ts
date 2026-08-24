import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { belegteSitzIdsLaden } from "@/lib/belegte-sitze";

// Öffentlich: liefert nur Sitzplatz-IDs, keine Gastdaten.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Ungültige Event-ID" }, { status: 400 });
  }
  const belegte = await belegteSitzIdsLaden(id);
  return NextResponse.json(
    { belegte },
    { headers: { "Cache-Control": "no-store" } },
  );
}
