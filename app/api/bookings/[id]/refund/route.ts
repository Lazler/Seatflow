import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { demoBlockiert } from "@/lib/demo";
import { z } from "zod";
import { protokolliereEreignis } from "@/lib/buchungs-historie";

const ErstattenSchema = z.object({
  betrag_cent: z.number().int().positive().optional(), // partial refund; omit = full
  grund: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const demo = demoBlockiert(user.id); if (demo) return demo;

  const parsed = ErstattenSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    console.error("[erstatten] SUPABASE_SERVICE_ROLE_KEY fehlt im Deployment");
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY fehlt im Deployment — setze die Variable in deinem Hosting und deploye neu. Details unter /api/health." },
      { status: 503 },
    );
  }

  const { data: buchung } = await admin
    .from("buchungen")
    .select("id, gesamt_cent, status, stripe_payment_intent, event_id")
    .eq("id", id)
    .single();

  if (!buchung) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  if (buchung.status === "erstattet") return NextResponse.json({ error: "Buchung bereits erstattet" }, { status: 409 });
  if (buchung.status !== "bezahlt") return NextResponse.json({ error: "Nur bezahlte Buchungen können erstattet werden" }, { status: 409 });

  // Verify organizer owns the event
  const { data: event } = await supabase
    .from("events")
    .select("id, veranstalter_id")
    .eq("id", buchung.event_id)
    .single();

  if (!event || event.veranstalter_id !== user.id) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  if (!buchung.stripe_payment_intent) {
    return NextResponse.json({ error: "Kein Stripe Payment Intent gefunden. Bitte manuell über das Stripe-Dashboard erstatten." }, { status: 422 });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: buchung.stripe_payment_intent,
      ...(parsed.data.betrag_cent ? { amount: parsed.data.betrag_cent } : {}),
      reason: "requested_by_customer",
      metadata: { buchung_id: id, grund: parsed.data.grund ?? "" },
    });

    const { error: updateFehler } = await admin
      .from("buchungen")
      .update({ status: "erstattet" })
      .eq("id", id);

    if (updateFehler) {
      // Geld ist zurück, aber der Status konnte nicht gesetzt werden — das
      // muss der Admin wissen (sonst erscheint die Buchung weiter als bezahlt)
      console.error("[erstatten] Status-Update nach Refund fehlgeschlagen:", updateFehler, "refund:", refund.id);
      return NextResponse.json(
        { error: "Die Erstattung wurde bei Stripe ausgelöst, aber der Buchungsstatus konnte nicht aktualisiert werden. Bitte Support kontaktieren.", refund_id: refund.id },
        { status: 500 },
      );
    }

    await protokolliereEreignis(id, "erstattet", `${(refund.amount / 100).toFixed(2)} €${parsed.data.grund ? ` — ${parsed.data.grund}` : ""}`, { typ: "veranstalter", name: user.email });

    return NextResponse.json({ refund_id: refund.id, status: refund.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe-Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
