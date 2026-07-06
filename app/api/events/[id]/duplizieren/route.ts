import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  // 1 Termin = einfache Kopie, mehrere = Terminserie
  termine: z.array(z.string().datetime({ offset: true }).or(z.string().datetime())).min(1).max(30),
});

// Felder, die in Kopien übernommen werden. Bewusst NICHT kopiert:
// status (immer entwurf), verkauf_ab/bis (terminbezogen), scanner_pin.
const KOPIER_FELDER = [
  "veranstalter_id", "venue_id", "sitzplan_id", "titel", "beschreibung",
  "bild_url", "ticket_preis_cent", "service_gebuehr_cent", "max_tickets",
  "success_url", "cancel_url", "etagen", "ticket_typen", "ticket_design",
  "ticket_template_id", "sprachen", "translations", "fruehbucher", "addons",
  "max_pro_buchung",
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const { data: original } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("veranstalter_id", user.id)
    .single();

  if (!original) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });

  // Einlass-Zeit relativ zum Termin mitverschieben (z. B. immer 1 h vorher)
  const originalDatum = new Date(original.datum).getTime();
  const einlassOffsetMs = original.einlass_datum
    ? new Date(original.einlass_datum).getTime() - originalDatum
    : null;

  const basis: Record<string, unknown> = {};
  for (const feld of KOPIER_FELDER) basis[feld] = original[feld];

  const kopien = parsed.data.termine.map((termin) => {
    const datumMs = new Date(termin).getTime();
    return {
      ...basis,
      datum: new Date(datumMs).toISOString(),
      einlass_datum: einlassOffsetMs !== null
        ? new Date(datumMs + einlassOffsetMs).toISOString()
        : null,
      status: "entwurf",
    };
  });

  const { data: neue, error } = await supabase
    .from("events")
    .insert(kopien)
    .select("id, datum");

  if (error || !neue) {
    return NextResponse.json({ error: "Duplizieren fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ events: neue });
}
