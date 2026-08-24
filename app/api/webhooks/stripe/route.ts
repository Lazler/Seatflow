import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sendTicketMail, sendeVerkaufsBenachrichtigung } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/plan";
import type Stripe from "stripe";
import type { TicketDesign } from "@/types/ticket-design";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";
import { sitzAnzeige } from "@/types/sitzplan";

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

  const admin = createAdminClient();

  // ── Subscription lifecycle ────────────────────────────────────────────────
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end;
    const aboBis = new Date(periodEnd * 1000).toISOString();
    const isActive = sub.status === "active" || sub.status === "trialing";

    await admin
      .from("veranstalter_profile")
      .update({
        plan: isActive ? "pro" : "free",
        abo_bis: isActive ? aboBis : null,
        stripe_subscription_id: sub.id,
      })
      .eq("stripe_customer_id", customerId);

    return NextResponse.json({ received: true });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    await admin
      .from("veranstalter_profile")
      .update({ plan: "free", abo_bis: null, stripe_subscription_id: null })
      .eq("stripe_customer_id", customerId);

    return NextResponse.json({ received: true });
  }

  // ── Subscription payment failed → downgrade to free ───────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (customerId && invoice.billing_reason === "subscription_cycle") {
      await admin
        .from("veranstalter_profile")
        .update({ plan: "free", abo_bis: null })
        .eq("stripe_customer_id", customerId);
    }
    return NextResponse.json({ received: true });
  }

  // ── Stripe Connect: account onboarding completed ──────────────────────────
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    if (account.charges_enabled) {
      await admin
        .from("veranstalter_profile")
        .update({ stripe_connect_onboarded: true })
        .eq("stripe_account_id", account.id);
    }
    return NextResponse.json({ received: true });
  }

  // ── Abgelaufener Checkout → Sitze wieder freigeben ────────────────────────
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const buchungId = session.metadata?.buchung_id;
    if (buchungId) {
      const { data: b } = await admin
        .from("buchungen")
        .select("status")
        .eq("id", buchungId)
        .single();
      if (b?.status === "ausstehend") {
        await admin.from("tickets").delete().eq("buchung_id", buchungId);
        await admin.from("buchungen").update({ status: "abgelaufen" }).eq("id", buchungId);
      }
    }
    return NextResponse.json({ received: true });
  }

  // ── Ticket purchase ───────────────────────────────────────────────────────
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Subscription checkout — already handled above via subscription events
  if (session.mode === "subscription") {
    return NextResponse.json({ received: true });
  }

  const buchungId = session.metadata?.buchung_id;
  const eventId = session.metadata?.event_id;
  const sprache = (session.metadata?.sprache ?? "de") as "de" | "en" | "hu";

  if (!buchungId || !eventId) {
    return NextResponse.json({ error: "Fehlende Metadaten" }, { status: 400 });
  }

  const paymentIntent = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;

  const { data: buchung } = await admin
    .from("buchungen")
    .update({
      status: "bezahlt",
      rechnung_nummer: `RE-${Date.now()}`,
      rechnung_datum: new Date().toISOString(),
      ...(paymentIntent ? { stripe_payment_intent: paymentIntent } : {}),
    })
    .eq("id", buchungId)
    .select("id, gaest_name, gaest_email, gesamt_cent, rechnung_nummer, rechnung_datum")
    .single();

  if (!buchung) return NextResponse.json({ received: true });

  const [{ data: tickets }, { data: ev }, { data: buchungDetail }] = await Promise.all([
    admin
      .from("tickets")
      .select("sitzplatz_id, sitzplatz_bezeichnung, preis_cent, qr_code")
      .eq("buchung_id", buchungId),
    admin
      .from("events")
      .select("titel, datum, ticket_design, ticket_template_id, veranstalter_id, venues(name)")
      .eq("id", eventId)
      .single(),
    admin
      .from("buchungen")
      .select("ticket_typ")
      .eq("id", buchungId)
      .single(),
  ]);

  if (!ev || !tickets?.length) return NextResponse.json({ received: true });

  // Check organizer plan for email branding
  const { data: profil } = await admin
    .from("veranstalter_profile")
    .select("plan, abo_bis, benachrichtigung_verkauf")
    .eq("id", ev.veranstalter_id)
    .single();
  const plan = effectivePlan(profil?.plan ?? "free", profil?.abo_bis ?? null);

  let design: TicketDesign = (ev.ticket_design as TicketDesign | null) ?? DEFAULT_TICKET_DESIGN;
  if (ev.ticket_template_id) {
    const { data: tmpl } = await admin
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
      sitzId: sitzAnzeige(t.sitzplatz_id),
      kategorieName: t.sitzplatz_bezeichnung,
      preisCent: t.preis_cent,
      qrCode: t.qr_code,
    })),
    gesamtCent: buchung.gesamt_cent,
    ticketTypName: ticketTyp?.name,
    design,
    sprache,
    poweredBySeatflow: plan === "free",
  });

  // Verkaufs-Benachrichtigung an den Veranstalter (best effort, abschaltbar)
  if (profil?.benachrichtigung_verkauf !== false) {
    try {
      const { data: veranstalter } = await admin.auth.admin.getUserById(ev.veranstalter_id);
      const veranstalterEmail = veranstalter?.user?.email;
      if (veranstalterEmail) {
        const { count: verkauftGesamt } = await admin
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seatflow.app";
        await sendeVerkaufsBenachrichtigung({
          to: veranstalterEmail,
          eventTitel: ev.titel,
          gastName: buchung.gaest_name,
          anzahlTickets: tickets.length,
          gesamtCent: buchung.gesamt_cent,
          verkauftGesamt: verkauftGesamt ?? tickets.length,
          dashboardLink: `${appUrl}/dashboard/bookings/${buchungId}`,
        });
      }
    } catch {
      // Benachrichtigung darf die Ticket-Zustellung nie gefährden
    }
  }

  return NextResponse.json({ received: true });
}
