import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTicketMail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { effectivePlan } from "@/lib/plan";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";
import type { TicketDesign } from "@/types/ticket-design";
import { sitzAnzeige } from "@/types/sitzplan";

// Gast-Self-Service: Tickets erneut an die HINTERLEGTE Adresse senden.
// Keine E-Mail-Eingabe möglich — die Buchungs-UUID ist der Zugriffsschlüssel,
// versendet wird ausschließlich an die beim Kauf angegebene Adresse.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Ungültige Buchung" }, { status: 400 });
  }
  // Konservatives Limit: 3 Zustellungen pro Buchung pro Viertelstunde
  if (rateLimit(`gast-resend:${id}`, 3, 900)) {
    return NextResponse.json({ error: "Bitte warte einen Moment — die E-Mail wurde bereits versendet." }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: buchung } = await admin
    .from("buchungen")
    .select("id, gaest_name, gaest_email, gesamt_cent, status, event_id, ticket_typ")
    .eq("id", id)
    .single();
  if (!buchung || buchung.status !== "bezahlt") {
    return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  }

  const [{ data: tickets }, { data: event }] = await Promise.all([
    admin
      .from("tickets")
      .select("sitzplatz_id, sitzplatz_bezeichnung, preis_cent, qr_code")
      .eq("buchung_id", id),
    admin
      .from("events")
      .select("titel, datum, ticket_design, ticket_template_id, veranstalter_id, venues(name)")
      .eq("id", buchung.event_id)
      .single(),
  ]);
  if (!event || !tickets?.length) {
    return NextResponse.json({ error: "Tickets nicht gefunden" }, { status: 404 });
  }

  const { data: profil } = await admin
    .from("veranstalter_profile")
    .select("plan, abo_bis")
    .eq("id", event.veranstalter_id)
    .single();
  const plan = effectivePlan(profil?.plan ?? "free", profil?.abo_bis ?? null);

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
      sitzId: sitzAnzeige(t.sitzplatz_id),
      kategorieName: t.sitzplatz_bezeichnung,
      preisCent: t.preis_cent,
      qrCode: t.qr_code,
    })),
    gesamtCent: buchung.gesamt_cent,
    ticketTypName: ticketTyp?.name,
    design,
    sprache: "de",
    poweredBySeatflow: plan === "free",
  });

  // Adresse nur maskiert zurückgeben
  const [local, domain] = buchung.gaest_email.split("@");
  const maskiert = `${local.slice(0, 2)}***@${domain}`;
  return NextResponse.json({ ok: true, an: maskiert });
}
