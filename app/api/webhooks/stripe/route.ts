import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendTicketMail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";
import type { TicketDesign } from "@/types/ticket-design";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Keine Signatur" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Ungültige Webhook-Signatur" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const buchungId = session.metadata?.buchung_id;
  const eventId = session.metadata?.event_id;

  if (!buchungId || !eventId) {
    return NextResponse.json({ error: "Fehlende Metadaten" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: buchung } = await supabase
    .from("buchungen")
    .update({ status: "bezahlt" })
    .eq("id", buchungId)
    .select("id, gaest_name, gaest_email, gesamt_cent")
    .single();

  if (!buchung) return NextResponse.json({ received: true });

  const [{ data: tickets }, { data: ev }, { data: buchungDetail }] = await Promise.all([
    supabase
      .from("tickets")
      .select("sitzplatz_id, sitzplatz_bezeichnung, preis_cent, qr_code")
      .eq("buchung_id", buchungId),
    supabase
      .from("events")
      .select("titel, datum, ticket_design, ticket_template_id, venues(name)")
      .eq("id", eventId)
      .single(),
    supabase
      .from("buchungen")
      .select("ticket_typ")
      .eq("id", buchungId)
      .single(),
  ]);

  if (!ev || !tickets?.length) return NextResponse.json({ received: true });

  // Resolve template design
  let design: TicketDesign = (ev.ticket_design as TicketDesign | null) ?? DEFAULT_TICKET_DESIGN;
  if (ev.ticket_template_id) {
    const { data: tmpl } = await supabase
      .from("ticket_templates")
      .select("design")
      .eq("id", ev.ticket_template_id)
      .single();
    if (tmpl?.design) design = tmpl.design as TicketDesign;
  }

  const venue = ev.venues
    ? !Array.isArray(ev.venues) ? (ev.venues as unknown as { name: string }).name : undefined
    : undefined;

  const ticketTyp = buchungDetail?.ticket_typ as { name: string } | null;

  await sendTicketMail({
    to: buchung.gaest_email,
    guestName: buchung.gaest_name,
    eventTitel: ev.titel,
    eventDatum: new Date(ev.datum),
    venue,
    buchungId,
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

  return NextResponse.json({ received: true });
}
