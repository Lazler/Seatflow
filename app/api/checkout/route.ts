import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { preisNachRegel } from "@/types/ticket-typ";
import type { SitzplanKonfiguration, Preiskategorie } from "@/types/sitzplan";
import type { TicketTyp, PreisRegel } from "@/types/ticket-typ";
import { rateLimit } from "@/lib/rate-limit";
import { PLAN_SERVICE_FEE_CENT, effectivePlan } from "@/lib/plan";
import { HOLD_MINUTEN } from "@/lib/belegte-sitze";
import { fruehbucherAktiv, fruehbucherPreis, type Fruehbucher, type EventAddon } from "@/types/event-extras";
import { istDemo } from "@/lib/demo";
import { protokolliereEreignis } from "@/lib/buchungs-historie";

const SitzplatzSchema = z.object({
  sitzId: z.string().min(1).max(100),
  kategorieId: z.string().uuid(),
  preisCent: z.number().int().nonnegative(),
  kategorieName: z.string().min(1).max(200),
  bezeichnung: z.string().max(300).optional(),
  ticketTyp: z.object({
    id: z.string().uuid(),
    name: z.string().max(100),
    extra_felder: z.record(z.string(), z.string()),
  }).nullable().optional(),
});

const CheckoutSchema = z.object({
  eventId: z.string().uuid(),
  sitzplaetze: z.array(SitzplatzSchema).min(1).max(20),
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(300),
  sprache: z.enum(["de", "en", "hu"]).optional(),
  addons: z.array(z.object({
    id: z.string().min(1).max(100),
    anzahl: z.number().int().min(1).max(20),
  })).max(10).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limiting: 10 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limited = rateLimit(`checkout:${ip}`, 10, 60);
  if (limited) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte kurz warten." }, { status: 429 });
  }

  // Input validation
  const parsed = CheckoutSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe", details: parsed.error.flatten() }, { status: 400 });
  }
  const { eventId, sitzplaetze, name, email, sprache, addons: addonWuensche } = parsed.data;

  const supabase = await createClient();

  // Load event with sitzplan data for server-side price calculation
  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum, status, success_url, cancel_url, sitzplan_id, etagen, ticket_typen, veranstalter_id")
    .eq("id", eventId)
    .eq("status", "veroeffentlicht")
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  // Demo-Events sind öffentlich sichtbar, aber nicht wirklich kaufbar.
  if (istDemo(event.veranstalter_id)) {
    return NextResponse.json(
      { error: "Dies ist ein Demo-Event — hier kann nicht wirklich gebucht werden. Registriere dich kostenlos für dein eigenes." },
      { status: 403 },
    );
  }

  // Determine service fee from organizer's plan + Stripe Connect status
  const admin = createAdminClient();
  const { data: profil } = await admin
    .from("veranstalter_profile")
    .select("plan, abo_bis, stripe_account_id, stripe_connect_onboarded")
    .eq("id", event.veranstalter_id)
    .single();
  const plan = effectivePlan(profil?.plan ?? "free", profil?.abo_bis ?? null);
  const serviceGebuehrCent = PLAN_SERVICE_FEE_CENT[plan];
  const connectAccountId = (profil?.stripe_connect_onboarded && profil?.stripe_account_id)
    ? (profil.stripe_account_id as string)
    : null;

  // ─── Server-side price calculation ────────────────────────────────────────
  // Load all sitzplaene to build a server-authoritative category price map
  const sitzplanIds: string[] = [];
  if (event.sitzplan_id) sitzplanIds.push(event.sitzplan_id);
  const etagen = event.etagen as { sitzplan_id: string }[] | null;
  etagen?.forEach((e) => { if (e.sitzplan_id) sitzplanIds.push(e.sitzplan_id); });

  const kategorienMap = new Map<string, Preiskategorie>();
  if (sitzplanIds.length > 0) {
    const { data: sitzplaene } = await supabase
      .from("sitzplaene")
      .select("konfiguration")
      .in("id", sitzplanIds);
    sitzplaene?.forEach((sp) => {
      const konf = sp.konfiguration as SitzplanKonfiguration;
      konf.kategorien?.forEach((k) => kategorienMap.set(k.id, k));
    });
  }

  const ticketTypenMap = new Map<string, TicketTyp>();
  ((event.ticket_typen as TicketTyp[] | null) ?? []).forEach((t) => ticketTypenMap.set(t.id, t));

  // Frühbucher + Add-ons + Verkaufsregeln (fehler-tolerant — Spalten evtl. noch nicht migriert)
  const { data: extras, error: extrasFehler } = await admin
    .from("events")
    .select("fruehbucher, addons, verkauf_ab, verkauf_bis, max_pro_buchung")
    .eq("id", eventId)
    .maybeSingle();

  // Verkaufsfenster + Buchungslimit server-seitig durchsetzen
  if (!extrasFehler && extras) {
    const jetztMs = Date.now();
    if (extras.verkauf_ab && jetztMs < new Date(extras.verkauf_ab as string).getTime()) {
      return NextResponse.json({ error: "Der Vorverkauf hat noch nicht begonnen." }, { status: 403 });
    }
    if (extras.verkauf_bis && jetztMs > new Date(extras.verkauf_bis as string).getTime()) {
      return NextResponse.json({ error: "Der Online-Vorverkauf ist beendet." }, { status: 403 });
    }
    const maxProBuchung = (extras.max_pro_buchung as number | null) ?? 8;
    if (sitzplaetze.length > maxProBuchung) {
      return NextResponse.json(
        { error: `Maximal ${maxProBuchung} Plätze pro Buchung.` },
        { status: 400 }
      );
    }
  }
  const fruehbucher = !extrasFehler && fruehbucherAktiv(extras?.fruehbucher as Fruehbucher | null)
    ? (extras!.fruehbucher as Fruehbucher)
    : null;
  const eventAddons = !extrasFehler
    ? (((extras?.addons as EventAddon[] | null) ?? []).filter((a) => a.aktiv))
    : [];

  // Calculate authoritative price per seat
  const validatedSitzplaetze = sitzplaetze.map((p) => {
    const kategorie = kategorienMap.get(p.kategorieId);
    const basisCent = kategorie?.preis_cent ?? p.preisCent; // fallback if no sitzplan loaded
    let preisCent = basisCent;
    if (p.ticketTyp) {
      const typ = ticketTypenMap.get(p.ticketTyp.id);
      if (typ?.aktiv) {
        preisCent = preisNachRegel(basisCent, typ.preis_regel as PreisRegel);
      }
    }
    // Frühbucher-Rabatt greift nach der Ticket-Typ-Regel (server-autoritativ)
    if (fruehbucher) preisCent = fruehbucherPreis(preisCent, fruehbucher);
    return { ...p, preisCent, kategorieName: kategorie?.name ?? p.kategorieName };
  });

  // Add-ons gegen Event-Konfiguration validieren; Preise server-autoritativ
  const validierteAddons = (addonWuensche ?? [])
    .map((w) => {
      const a = eventAddons.find((x) => x.id === w.id);
      return a ? { name: a.name, preisCent: a.preis_cent, anzahl: w.anzahl } : null;
    })
    .filter((a): a is { name: string; preisCent: number; anzahl: number } => a !== null);
  const addonSummeCent = validierteAddons.reduce((s, a) => s + a.preisCent * a.anzahl, 0);

  const gesamtCent = validatedSitzplaetze.reduce((s, p) => s + p.preisCent, 0) +
    validatedSitzplaetze.length * serviceGebuehrCent +
    addonSummeCent;

  // ─── Stale-Hold-Cleanup ────────────────────────────────────────────────────
  // Abgelaufene unbezahlte Checkouts (älter als HOLD_MINUTEN) blockieren die
  // gewünschten Sitze sonst über den Unique-Constraint dauerhaft.
  const angefragteSitzIds = sitzplaetze.map((p) => p.sitzId);
  const { data: bestehende } = await admin
    .from("tickets")
    .select("id, buchung_id, buchungen!inner(status, erstellt_am)")
    .eq("event_id", eventId)
    .in("sitzplatz_id", angefragteSitzIds);

  const holdCutoff = Date.now() - HOLD_MINUTEN * 60_000;
  const staleBuchungIds = new Set<string>();
  (bestehende ?? []).forEach((t) => {
    const b = t.buchungen as unknown as { status: string; erstellt_am: string | null } | null;
    if (b?.status === "ausstehend" && b.erstellt_am && new Date(b.erstellt_am).getTime() < holdCutoff) {
      staleBuchungIds.add(t.buchung_id as string);
    }
  });
  if (staleBuchungIds.size > 0) {
    const ids = [...staleBuchungIds];
    await admin.from("tickets").delete().in("buchung_id", ids);
    await admin.from("buchungen").update({ status: "abgelaufen" }).in("id", ids);
  }

  // ─── Create booking via admin client (bypasses RLS — writes are server-only) ──
  const firstTicketTyp = validatedSitzplaetze.find((p) => p.ticketTyp)?.ticketTyp ?? null;

  const { data: buchung, error: buchungsFehler } = await admin
    .from("buchungen")
    .insert({
      event_id: eventId,
      gaest_name: name,
      gaest_email: email,
      gesamt_cent: gesamtCent,
      status: "ausstehend",
      sprache: sprache ?? "de",
      ...(firstTicketTyp ? { ticket_typ: firstTicketTyp } : {}),
    })
    .select("id")
    .single();

  if (buchungsFehler || !buchung) {
    return NextResponse.json({ error: "Buchung konnte nicht angelegt werden" }, { status: 500 });
  }
  await protokolliereEreignis(buchung.id, "erstellt", "Online-Checkout");

  const { error: ticketFehler } = await admin.from("tickets").insert(
    validatedSitzplaetze.map((p) => ({
      buchung_id: buchung.id,
      event_id: eventId,
      sitzplatz_id: p.sitzId,
      sitzplatz_bezeichnung: p.bezeichnung ?? `${p.kategorieName} · ${p.sitzId}`,
      preis_cent: p.preisCent,
      ...(p.ticketTyp ? { ticket_typ: p.ticketTyp } : {}),
    }))
  );

  if (ticketFehler) {
    await admin.from("buchungen").delete().eq("id", buchung.id);
    const konflikt = ticketFehler.code === "23505";
    return NextResponse.json(
      { error: konflikt ? "Ein gewählter Platz wurde soeben von jemand anderem gebucht. Bitte neu wählen." : "Fehler beim Speichern der Tickets" },
      { status: konflikt ? 409 : 500 }
    );
  }

  // ─── Stripe line items (use server-validated prices) ──────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = [];
  const gruppenMap = new Map<string, { name: string; preisCent: number; anzahl: number }>();
  for (const p of validatedSitzplaetze) {
    const key = `${p.kategorieId}:${p.preisCent}`;
    const g = gruppenMap.get(key);
    if (g) g.anzahl++;
    else gruppenMap.set(key, { name: p.kategorieName, preisCent: p.preisCent, anzahl: 1 });
  }
  for (const g of gruppenMap.values()) {
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
      price_data: { currency: "eur", product_data: { name: "Servicegebühr" }, unit_amount: serviceGebuehrCent },
      quantity: validatedSitzplaetze.length,
    });
  }
  for (const a of validierteAddons) {
    if (a.preisCent <= 0) continue;
    lineItems.push({
      price_data: { currency: "eur", product_data: { name: `${a.name} — ${event.titel}` }, unit_amount: a.preisCent },
      quantity: a.anzahl,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const successUrl = event.success_url
    ? `${event.success_url}${event.success_url.includes("?") ? "&" : "?"}buchung_id=${buchung.id}`
    : `${appUrl}/book/${eventId}/confirmation?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = event.cancel_url ?? `${appUrl}/book/${eventId}`;

  const applicationFeeCent = serviceGebuehrCent * validatedSitzplaetze.length;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: email,
    metadata: { buchung_id: buchung.id, event_id: eventId, sprache: sprache ?? "de" },
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Sitze sind 30 Min. reserviert; danach räumt checkout.session.expired auf
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    payment_method_types: ["card", "sepa_debit", "sofort"],
    allow_promotion_codes: true,
    locale: "de",
    ...(connectAccountId ? {
      payment_intent_data: {
        application_fee_amount: applicationFeeCent,
        transfer_data: { destination: connectAccountId },
      },
    } : {}),
  });

  return NextResponse.json({ url: session.url });
}
