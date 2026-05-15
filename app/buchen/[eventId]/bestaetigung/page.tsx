import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { notFound } from "next/navigation";
import { CheckCircle, Calendar, MapPin, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import QRCode from "qrcode";
import Image from "next/image";

export default async function BestaetigungsSeite({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { eventId } = await params;
  const { session_id } = await searchParams;

  if (!session_id) notFound();

  let buchungId: string | null = null;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") notFound();
    buchungId = session.metadata?.buchung_id ?? null;
  } catch {
    notFound();
  }

  if (!buchungId) notFound();

  const supabase = await createClient();

  const [{ data: buchung }, { data: ev }] = await Promise.all([
    supabase
      .from("buchungen")
      .select("id, gaest_name, gesamt_cent")
      .eq("id", buchungId)
      .single(),
    supabase
      .from("events")
      .select("titel, datum, venues(name, adresse)")
      .eq("id", eventId)
      .single(),
  ]);

  if (!buchung || !ev) notFound();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("sitz_id")
    .eq("buchung_id", buchungId);

  const qrDataUrl = await QRCode.toDataURL(buchungId, { width: 240, margin: 1 });

  const venue = ev.venues && !Array.isArray(ev.venues)
    ? (ev.venues as unknown as { name: string; adresse?: string })
    : null;

  return (
    <div className="min-h-screen bg-muted/40">
      <nav className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-[10px]">SF</span>
          </div>
          <span className="font-semibold text-sm">SeatFlow</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-xl sm:text-2xl font-bold">Zahlung bestätigt!</h1>
          <p className="text-muted-foreground text-sm">
            Deine Tickets wurden per E-Mail verschickt, {buchung.gaest_name}.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="font-semibold text-lg">{ev.titel}</p>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {new Date(ev.datum).toLocaleDateString("de-DE", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                {venue && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {venue.name}{venue.adresse ? `, ${venue.adresse}` : ""}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 shrink-0" />
                  {tickets?.map((t) => t.sitz_id).join(", ")}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground">QR-Code beim Einlass vorzeigen:</p>
              <Image
                src={qrDataUrl}
                alt="Ticket QR-Code"
                width={200}
                height={200}
                className="rounded-lg border border-border"
              />
              <p className="text-xs text-muted-foreground font-mono">{buchungId}</p>
            </div>

            <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
              <span>Gesamt bezahlt</span>
              <span>{(buchung.gesamt_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
