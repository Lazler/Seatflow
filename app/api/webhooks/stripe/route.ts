import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendTicketMail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

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

  // Buchung auf bezahlt setzen
  const { data: buchung } = await supabase
    .from("buchungen")
    .update({ status: "bezahlt" })
    .eq("id", buchungId)
    .select("id, gaest_name, gaest_email, gesamt_cent")
    .single();

  if (!buchung) return NextResponse.json({ received: true });

  // Tickets und Event-Infos für die E-Mail laden
  const [{ data: tickets }, { data: ev }] = await Promise.all([
    supabase
      .from("tickets")
      .select("sitz_id, kategorie_id, preis_cent")
      .eq("buchung_id", buchungId),
    supabase
      .from("events")
      .select("titel, datum, sitzplan_id, venues(name)")
      .eq("id", eventId)
      .single(),
  ]);

  if (!ev || !tickets?.length) return NextResponse.json({ received: true });

  // Kategorienamen aus dem Sitzplan holen
  let kategorienMap = new Map<string, string>();
  if (ev.sitzplan_id) {
    const { data: plan } = await supabase
      .from("sitzplaene")
      .select("konfiguration")
      .eq("id", ev.sitzplan_id)
      .single();
    if (plan?.konfiguration) {
      const konfig = plan.konfiguration as { kategorien?: { id: string; name: string }[] };
      kategorienMap = new Map((konfig.kategorien ?? []).map((k) => [k.id, k.name]));
    }
  }

  const venue = ev.venues
    ? !Array.isArray(ev.venues)
      ? (ev.venues as unknown as { name: string }).name
      : undefined
    : undefined;

  await sendTicketMail({
    to: buchung.gaest_email,
    guestName: buchung.gaest_name,
    eventTitel: ev.titel,
    eventDatum: new Date(ev.datum),
    venue,
    buchungId,
    sitze: tickets.map((t) => ({
      sitzId: t.sitz_id,
      kategorieName: kategorienMap.get(t.kategorie_id) ?? t.kategorie_id,
      preisCent: t.preis_cent,
    })),
    gesamtCent: buchung.gesamt_cent,
  });

  return NextResponse.json({ received: true });
}
