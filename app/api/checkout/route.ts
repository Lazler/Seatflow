import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { preisNachRegel } from "@/types/ticket-typ";
import type { SitzplanKonfiguration, Preiskategorie } from "@/types/sitzplan";
import type { TicketTyp, PreisRegel } from "@/types/ticket-typ";
import { rateLimit } from "@/lib/rate-limit";

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
  const { eventId, sitzplaetze, name, email } = parsed.data;

  const supabase = await createClient();

  // Load event with sitzplan data for server-side price calculation
  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum, service_gebuehr_cent, status, success_url, cancel_url, sitzplan_id, etagen, ticket_typen")
    .eq("id", eventId)
    .eq("status", "veroeffentlicht")
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

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
    return { ...p, preisCent, kategorieName: kategorie?.name ?? p.kategorieName };
  });

  const serviceGebuehrCent: number = event.service_gebuehr_cent ?? 50;
  const gesamtCent = validatedSitzplaetze.reduce((s, p) => s + p.preisCent, 0) +
    validatedSitzplaetze.length * serviceGebuehrCent;

  // ─── Create booking via admin client (bypasses RLS — writes are server-only) ──
  const admin = createAdminClient();
  const firstTicketTyp = validatedSitzplaetze.find((p) => p.ticketTyp)?.ticketTyp ?? null;

  const { data: buchung, error: buchungsFehler } = await admin
    .from("buchungen")
    .insert({
      event_id: eventId,
      gaest_name: name,
      gaest_email: email,
      gesamt_cent: gesamtCent,
      status: "ausstehend",
      ...(firstTicketTyp ? { ticket_typ: firstTicketTyp } : {}),
    })
    .select("id")
    .single();

  if (buchungsFehler || !buchung) {
    return NextResponse.json({ error: "Buchung konnte nicht angelegt werden" }, { status: 500 });
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const successUrl = event.success_url
    ? `${event.success_url}${event.success_url.includes("?") ? "&" : "?"}buchung_id=${buchung.id}`
    : `${appUrl}/buchen/${eventId}/bestaetigung?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = event.cancel_url ?? `${appUrl}/buchen/${eventId}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: email,
    metadata: { buchung_id: buchung.id, event_id: eventId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: ["card", "sepa_debit", "sofort"],
    allow_promotion_codes: true,
    locale: "de",
  });

  return NextResponse.json({ url: session.url });
}
