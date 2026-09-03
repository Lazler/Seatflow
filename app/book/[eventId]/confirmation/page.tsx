import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { notFound } from "next/navigation";
import { CheckCircle, Calendar, MapPin, Ticket, DownloadSimple as Download } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "@/components/ui/card";
import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";
import { BUCHUNG_STRINGS, fmt, intlLocale, type BuchungsSprache } from "@/lib/i18n/buchung";

export default async function BestaetigungsSeite({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ session_id?: string; buchung_id?: string }>;
}) {
  const { eventId } = await params;
  const { session_id, buchung_id: buchungIdParam } = await searchParams;

  if (!session_id && !buchungIdParam) notFound();

  let buchungId: string | null = buchungIdParam ?? null;

  // Resolve from Stripe session if no direct buchung_id
  if (!buchungId && session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== "paid") notFound();
      buchungId = session.metadata?.buchung_id ?? null;
    } catch {
      notFound();
    }
  }

  if (!buchungId) notFound();

  const supabase = await createClient();

  const [{ data: buchung }, { data: ev }] = await Promise.all([
    supabase
      .from("buchungen")
      .select("id, gaest_name, gaest_email, gesamt_cent, status, rechnung_nummer, sprache")
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
    .select("sitzplatz_id, sitzplatz_bezeichnung")
    .eq("buchung_id", buchungId);

  const qrDataUrl = await QRCode.toDataURL(buchungId, { width: 240, margin: 1 });

  const venue = ev.venues && !Array.isArray(ev.venues)
    ? (ev.venues as unknown as { name: string; adresse?: string })
    : null;

  const sprache = ((buchung.sprache as string) ?? "de") as BuchungsSprache;
  const t = BUCHUNG_STRINGS[sprache];
  const loc = intlLocale(sprache);

  const datumFormatiert = new Date(ev.datum).toLocaleDateString(loc, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const isPaid = buchung.status === "bezahlt";

  return (
    <div className="min-h-screen bg-muted/40">
      <nav className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V9z" />
              <line x1="9" y1="8" x2="9" y2="16" strokeDasharray="2 2" />
            </svg>
          </div>
          <span className="font-semibold text-sm">SeatFlow</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Status header */}
        <div className="text-center space-y-2">
          <CheckCircle className={`h-12 w-12 mx-auto ${isPaid ? "text-green-500" : "text-muted-foreground"}`} />
          <h1 className="text-xl sm:text-2xl font-bold">
            {isPaid ? t.zahlungBestaetigt : t.buchungErfasst}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isPaid
              ? fmt(t.ticketsPerMail, { email: buchung.gaest_email })
              : t.zahlungWirdVerarbeitet}
          </p>
        </div>

        {/* Event card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="font-semibold text-lg">{ev.titel}</p>
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {datumFormatiert}
                </span>
                {venue && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {venue.name}{venue.adresse ? `, ${venue.adresse}` : ""}
                  </span>
                )}
                {tickets && tickets.length > 0 && (
                  <span className="flex items-start gap-2">
                    <Ticket className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{tickets.map((t) => t.sitzplatz_bezeichnung || t.sitzplatz_id).join(", ")}</span>
                  </span>
                )}
                <span className="pt-2">
                  <a href={`/booking/${buchungId}`}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                    {t.ticketsOnlineAnsehen}
                  </a>
                </span>
              </div>
            </div>

            {/* QR code */}
            <div className="border-t border-border pt-4 flex flex-col items-center gap-3">
              <p className="text-xs text-muted-foreground">{t.qrEinlass}</p>
              <Image
                src={qrDataUrl}
                alt={t.qrAlt}
                width={200}
                height={200}
                className="rounded-lg border border-border"
              />
              <p className="text-xs text-muted-foreground font-mono">{buchungId}</p>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
              <span>{t.gesamtBezahlt}</span>
              <span>{(buchung.gesamt_cent / 100).toLocaleString(loc, { style: "currency", currency: "EUR" })}</span>
            </div>

            {buchung.rechnung_nummer && (
              <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                <span>{fmt(t.rechnungNr, { nr: buchung.rechnung_nummer })}</span>
                <a
                  href={`/api/tickets/pdf?buchungId=${buchungId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> {t.ticketsRechnungDownload}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {t.beiFragen} ·{" "}
          <Link href="/terms" className="underline hover:text-foreground">{t.agbFooter}</Link>
          {" · "}
          <Link href="/privacy" className="underline hover:text-foreground">{t.datenschutz}</Link>
        </p>

        <p className="text-center text-xs text-muted-foreground/60 pt-2">
          <Link href="https://seatflow.app?ref=ticket" className="hover:text-muted-foreground transition-colors">
            Powered by <strong className="font-medium">SeatFlow</strong>
          </Link>
        </p>
      </div>
    </div>
  );
}
