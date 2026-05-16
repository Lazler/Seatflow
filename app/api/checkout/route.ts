import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { eventId, sitzplaetze, name, email } = await req.json() as {
    eventId: string;
    sitzplaetze: { sitzId: string; kategorieId: string; preisCent: number; kategorieName: string; bezeichnung?: string }[];
    name: string;
    email: string;
  };

  if (!eventId || !sitzplaetze?.length || !name || !email) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum, service_gebuehr_cent, status, success_url, cancel_url")
    .eq("id", eventId)
    .eq("status", "veroeffentlicht")
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const serviceGebuehrCent: number = event.service_gebuehr_cent ?? 50;
  const gesamtCent = sitzplaetze.reduce((s, p) => s + p.preisCent, 0) + sitzplaetze.length * serviceGebuehrCent;

  // Buchung anlegen (status: ausstehend)
  const { data: buchung, error: buchungsFehler } = await supabase
    .from("buchungen")
    .insert({
      event_id: eventId,
      gaest_name: name,
      gaest_email: email,
      gesamt_cent: gesamtCent,
      status: "ausstehend",
    })
    .select("id")
    .single();

  if (buchungsFehler || !buchung) {
    return NextResponse.json({ error: "Buchung konnte nicht angelegt werden" }, { status: 500 });
  }

  // Tickets pro Sitz (verhindert Doppelbuchung via UNIQUE constraint)
  const { error: ticketFehler } = await supabase.from("tickets").insert(
    sitzplaetze.map((p) => ({
      buchung_id: buchung.id,
      event_id: eventId,
      sitzplatz_id: p.sitzId,
      sitzplatz_bezeichnung: p.bezeichnung ?? `${p.kategorieName} · ${p.sitzId}`,
      preis_cent: p.preisCent,
    }))
  );

  if (ticketFehler) {
    await supabase.from("buchungen").delete().eq("id", buchung.id);
    const konflikt = ticketFehler.code === "23505";
    return NextResponse.json(
      { error: konflikt ? "Ein gewählter Platz wurde soeben von jemand anderem gebucht. Bitte neu wählen." : "Fehler beim Speichern der Tickets" },
      { status: konflikt ? 409 : 500 }
    );
  }

  // Stripe Checkout Session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = [];

  // Tickets pro Kategorie gruppieren
  const katGruppen = new Map<string, { name: string; preisCent: number; anzahl: number }>();
  for (const p of sitzplaetze) {
    const g = katGruppen.get(p.kategorieId);
    if (g) g.anzahl++;
    else katGruppen.set(p.kategorieId, { name: p.kategorieName, preisCent: p.preisCent, anzahl: 1 });
  }
  for (const g of katGruppen.values()) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: `Ticket ${g.name} — ${event.titel}` },
        unit_amount: g.preisCent,
      },
      quantity: g.anzahl,
    });
  }
  if (serviceGebuehrCent > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Servicegebühr" },
        unit_amount: serviceGebuehrCent,
      },
      quantity: sitzplaetze.length,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const internalSuccessUrl = `${appUrl}/buchen/${eventId}/bestaetigung?session_id={CHECKOUT_SESSION_ID}`;
  const internalCancelUrl = `${appUrl}/buchen/${eventId}`;

  // Custom success_url: Buchungs-ID als Query-Parameter anhängen
  const successUrl = event.success_url
    ? `${event.success_url}${event.success_url.includes("?") ? "&" : "?"}buchung_id=${buchung.id}`
    : internalSuccessUrl;
  const cancelUrl = event.cancel_url ?? internalCancelUrl;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: email,
    metadata: { buchung_id: buchung.id, event_id: eventId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: ["card", "sepa_debit", "sofort"],
    locale: "de",
  });

  return NextResponse.json({ url: session.url });
}
