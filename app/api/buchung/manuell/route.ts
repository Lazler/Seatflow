import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { eventId, sitzplaetze, gaestName, gaestEmail, status } = await req.json() as {
    eventId: string;
    sitzplaetze: { sitzId: string; bezeichnung?: string; preisCent: number }[];
    gaestName: string;
    gaestEmail: string;
    status: "bezahlt" | "ausstehend";
  };

  if (!eventId || !Array.isArray(sitzplaetze) || !sitzplaetze.length || !gaestName || !gaestEmail) {
    return NextResponse.json({ error: "Fehlende Felder" }, { status: 400 });
  }

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from("events")
    .select("id, service_gebuehr_cent, veranstalter_id")
    .eq("id", eventId)
    .single();

  if (!event || event.veranstalter_id !== user.id) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const serviceGebuehrCent: number = event.service_gebuehr_cent ?? 0;
  const gesamtCent = sitzplaetze.reduce((s, p) => s + p.preisCent, 0) + sitzplaetze.length * serviceGebuehrCent;

  const { data: buchung, error: buchungsFehler } = await supabase
    .from("buchungen")
    .insert({
      event_id: eventId,
      gaest_name: gaestName.trim(),
      gaest_email: gaestEmail.trim(),
      gesamt_cent: gesamtCent,
      status,
      notiz: "Manuell angelegt",
    })
    .select("id")
    .single();

  if (buchungsFehler || !buchung) {
    return NextResponse.json({ error: "Buchung konnte nicht angelegt werden" }, { status: 500 });
  }

  const { error: ticketFehler } = await supabase.from("tickets").insert(
    sitzplaetze.map((p) => ({
      buchung_id: buchung.id,
      event_id: eventId,
      sitzplatz_id: p.sitzId,
      sitzplatz_bezeichnung: p.bezeichnung ?? p.sitzId,
      preis_cent: p.preisCent,
    }))
  );

  if (ticketFehler) {
    await supabase.from("buchungen").delete().eq("id", buchung.id);
    const konflikt = ticketFehler.code === "23505";
    return NextResponse.json(
      { error: konflikt ? "Ein Platz ist bereits vergeben." : "Tickets konnten nicht gespeichert werden." },
      { status: konflikt ? 409 : 500 }
    );
  }

  return NextResponse.json({ id: buchung.id });
}
