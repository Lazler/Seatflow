import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTicketMail } from "@/lib/email";
import type { TicketDesign } from "@/types/ticket-design";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const admin = createAdminClient();

  const { data: buchung } = await admin
    .from("buchungen")
    .select("id, gaest_name, gaest_email, gesamt_cent, status, event_id, ticket_typ")
    .eq("id", id)
    .single();

  if (!buchung) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  if (buchung.status !== "bezahlt") {
    return NextResponse.json({ error: "Nur bezahlte Buchungen können erneut gesendet werden" }, { status: 409 });
  }

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from("events")
    .select("id, veranstalter_id, titel, datum, ticket_design, ticket_template_id, venues(name)")
    .eq("id", buchung.event_id)
    .single();

  if (!event || event.veranstalter_id !== user.id) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { data: tickets } = await admin
    .from("tickets")
    .select("sitzplatz_id, sitzplatz_bezeichnung, preis_cent, qr_code")
    .eq("buchung_id", id);

  if (!tickets?.length) return NextResponse.json({ error: "Keine Tickets gefunden" }, { status: 404 });

  // Resolve template design
  let design: TicketDesign = (event.ticket_design as TicketDesign | null) ?? DEFAULT_TICKET_DESIGN;
  if (event.ticket_template_id) {
    const { data: tmpl } = await admin
      .from("ticket_templates")
      .select("design")
      .eq("id", event.ticket_template_id)
      .single();
    if (tmpl?.design) design = tmpl.design as TicketDesign;
  }

  const venue = event.venues && !Array.isArray(event.venues)
    ? (event.venues as unknown as { name: string }).name
    : undefined;

  const ticketTyp = buchung.ticket_typ as { name: string } | null;

  await sendTicketMail({
    to: buchung.gaest_email,
    guestName: buchung.gaest_name,
    eventTitel: event.titel,
    eventDatum: new Date(event.datum),
    venue,
    buchungId: id,
    sitze: tickets.map((t) => ({
      sitzId: t.sitzplatz_id,
      kategorieName: t.sitzplatz_bezeichnung,
      preisCent: t.preis_cent,
      qrCode: t.qr_code,
    })),
    gesamtCent: buchung.gesamt_cent,
    ticketTypName: ticketTyp?.name,
    design,
  });

  return NextResponse.json({ ok: true });
}
