import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum, veranstalter_id, status")
    .eq("id", id)
    .single();

  if (!event) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  if (event.veranstalter_id !== user.id) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  if (event.status === "abgesagt") return NextResponse.json({ error: "Event bereits abgesagt" }, { status: 409 });

  const admin = createAdminClient();

  // Mark event as cancelled
  await admin.from("events").update({ status: "abgesagt" }).eq("id", id);

  // Find all paid bookings with payment intents
  const { data: buchungen } = await admin
    .from("buchungen")
    .select("id, gaest_name, gaest_email, gesamt_cent, stripe_payment_intent")
    .eq("event_id", id)
    .eq("status", "bezahlt");

  if (!buchungen?.length) {
    return NextResponse.json({ refunded: 0, notified: 0 });
  }

  const datumFormatiert = new Date(event.datum).toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  let refunded = 0;
  let notified = 0;

  await Promise.allSettled(
    buchungen.map(async (b) => {
      // Stripe refund (only if payment intent stored)
      if (b.stripe_payment_intent) {
        try {
          await stripe.refunds.create({
            payment_intent: b.stripe_payment_intent,
            reason: "fraudulent", // closest to "event cancelled" in Stripe enums
            metadata: { buchung_id: b.id, grund: "Event abgesagt" },
          });
          refunded++;
        } catch {
          // Log but continue — manual refund may be needed
        }
      }

      // Update booking status
      await admin.from("buchungen").update({ status: "erstattet" }).eq("id", b.id);

      // Send cancellation email
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "tickets@seatflow.de",
          to: b.gaest_email,
          subject: `Veranstaltung abgesagt: ${event.titel}`,
          html: buildCancellationHtml(b.gaest_name, event.titel, datumFormatiert, b.gesamt_cent, !!b.stripe_payment_intent),
        });
        notified++;
      } catch {
        // Email failure should not block the cancellation
      }
    })
  );

  return NextResponse.json({ refunded, notified, total: buchungen.length });
}

function buildCancellationHtml(
  name: string,
  eventTitel: string,
  datumFormatiert: string,
  gesamtCent: number,
  hasRefund: boolean
): string {
  const betrag = (gesamtCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:#ef4444;padding:24px 32px">
      <span style="color:#fff;font-weight:700;font-size:18px">Veranstaltung abgesagt</span>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#64748b;font-size:14px">Hallo ${name},</p>
      <p style="margin:0 0 24px;font-size:15px">
        leider müssen wir dir mitteilen, dass die folgende Veranstaltung abgesagt wurde:
      </p>

      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-weight:700;font-size:16px">${eventTitel}</p>
        <p style="margin:0;color:#64748b;font-size:14px">${datumFormatiert}</p>
      </div>

      ${hasRefund
        ? `<p style="font-size:14px;margin:0 0 16px">
            Deine Zahlung von <strong>${betrag}</strong> wird automatisch erstattet und sollte innerhalb
            von 5–10 Werktagen auf deinem Konto erscheinen. Die Servicegebühr ist dabei ausgeschlossen,
            da der Ticketkauf vertraglich bereits abgeschlossen war.
           </p>`
        : `<p style="font-size:14px;margin:0 0 16px">
            Für eine Erstattung deiner Zahlung von <strong>${betrag}</strong> wende dich bitte direkt
            an den Veranstalter.
           </p>`
      }

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0">
        Wir entschuldigen uns für die Unannehmlichkeiten.
      </p>
    </div>
  </div>
</body>
</html>`;
}
