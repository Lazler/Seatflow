import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const ScanSchema = z.object({
  code: z.string().min(1).max(200),
  eventId: z.string().uuid(),
  // Alternative zur Veranstalter-Session: Scanner-PIN fürs Einlasspersonal
  pin: z.string().regex(/^\d{6}$/).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const parsed = ScanSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });

  const { code, eventId, pin } = parsed.data;

  // Autorisierung: Veranstalter-Session ODER gültige Scanner-PIN
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, veranstalter_id, titel, scanner_pin")
    .eq("id", eventId)
    .single();

  if (!event) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });

  const istBesitzer = !!user && event.veranstalter_id === user.id;
  const pinGueltig = !!pin && !!event.scanner_pin && pin === event.scanner_pin;
  if (!istBesitzer && !pinGueltig) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  // The QR code is either the ticket's qr_code field or the buchung_id
  // Try qr_code first, then fall back to buchung_id lookup
  const [{ data: ticketByQr }, { data: ticketsByBuchung }] = await Promise.all([
    admin
      .from("tickets")
      .select("id, sitzplatz_bezeichnung, eingeloest_am, buchung_id")
      .eq("event_id", eventId)
      .eq("qr_code", code)
      .maybeSingle(),
    admin
      .from("tickets")
      .select("id, sitzplatz_bezeichnung, eingeloest_am, buchung_id")
      .eq("event_id", eventId)
      .eq("buchung_id", code),
  ]);

  // When scanning by buchung_id, take the first non-redeemed ticket
  const ticket = ticketByQr ?? (ticketsByBuchung?.find((t) => !t.eingeloest_am) ?? ticketsByBuchung?.[0] ?? null);

  if (!ticket) {
    return NextResponse.json({ status: "ungueltig", message: "Ticket nicht gefunden" });
  }

  // Check booking is paid
  const { data: buchung } = await admin
    .from("buchungen")
    .select("status, gaest_name")
    .eq("id", ticket.buchung_id)
    .single();

  if (!buchung || buchung.status !== "bezahlt") {
    return NextResponse.json({ status: "ungueltig", message: "Buchung nicht bezahlt oder storniert" });
  }

  if (ticket.eingeloest_am) {
    const zeit = new Date(ticket.eingeloest_am).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return NextResponse.json({
      status: "bereits_eingeloest",
      message: `Bereits um ${zeit} Uhr eingelöst`,
      guestName: buchung.gaest_name,
      sitzplatz: ticket.sitzplatz_bezeichnung,
    });
  }

  // Mark as redeemed
  await admin
    .from("tickets")
    .update({ eingeloest_am: new Date().toISOString() })
    .eq("id", ticket.id);

  return NextResponse.json({
    status: "ok",
    message: "Einlass gewährt",
    guestName: buchung.gaest_name,
    sitzplatz: ticket.sitzplatz_bezeichnung,
  });
}
