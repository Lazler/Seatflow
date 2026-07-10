import { notFound } from "next/navigation";
import { z } from "zod";
import QRCode from "qrcode";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { sitzAnzeige } from "@/types/sitzplan";
import { Calendar, MapPin, Ticket } from "@phosphor-icons/react/dist/ssr";
import TicketAktionen from "./ticket-aktionen";
import { BUCHUNG_STRINGS, fmt, intlLocale, type BuchungsSprache } from "@/lib/i18n/buchung";

// „Meine Tickets": dauerhafte Gast-Seite je Buchung. Die UUID im Link ist
// der Zugriffsschlüssel (unerratbar, wie ein Ticket-Code). Kein Login nötig.
export default async function MeineTickets({
  params,
}: {
  params: Promise<{ buchungId: string }>;
}) {
  const { buchungId } = await params;
  if (!z.string().uuid().safeParse(buchungId).success) notFound();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // Service-Key fehlt im Deployment → Seite nicht verfügbar statt 500
    notFound();
  }
  const { data: buchung } = await admin
    .from("buchungen")
    .select("id, gaest_name, gesamt_cent, status, event_id, sprache")
    .eq("id", buchungId)
    .single();
  if (!buchung || buchung.status !== "bezahlt") notFound();

  const sprache = ((buchung.sprache as string) ?? "de") as BuchungsSprache;
  const t = BUCHUNG_STRINGS[sprache];
  const loc = intlLocale(sprache);

  const [{ data: event }, { data: tickets }] = await Promise.all([
    admin
      .from("events")
      .select("titel, datum, einlass_datum, venues(name, adresse)")
      .eq("id", buchung.event_id)
      .single(),
    admin
      .from("tickets")
      .select("id, sitzplatz_id, sitzplatz_bezeichnung, preis_cent, qr_code, eingeloest_am")
      .eq("buchung_id", buchungId)
      .order("sitzplatz_id"),
  ]);
  if (!event || !tickets?.length) notFound();

  const venue = event.venues && !Array.isArray(event.venues)
    ? (event.venues as unknown as { name: string; adresse: string | null })
    : null;

  const qrCodes = await Promise.all(
    tickets.map((t) => QRCode.toDataURL(t.qr_code, { width: 240, margin: 1, errorCorrectionLevel: "M" }))
  );

  const datumText = new Date(event.datum).toLocaleDateString(loc, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <nav className="border-b border-border bg-background">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-[10px]">SF</span>
          </div>
          <span className="font-semibold text-sm">{t.meineTicketsTitel}</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Event-Karte */}
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4">
            <p className="font-semibold text-white text-lg leading-snug">{event.titel}</p>
            <div className="flex flex-col gap-1 mt-1.5">
              <span className="text-xs text-white/70 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {datumText}
              </span>
              {venue && (
                <span className="text-xs text-white/70 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {venue.name}{venue.adresse ? `, ${venue.adresse}` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="px-5 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{buchung.gaest_name}</span>
            <span className="font-semibold tabular-nums">
              {(buchung.gesamt_cent / 100).toLocaleString(loc, { style: "currency", currency: "EUR" })}
            </span>
          </div>
        </div>

        {/* Aktionen: PDF, erneut senden, Kalender */}
        <TicketAktionen buchungId={buchungId} sprache={sprache} />

        {/* Tickets mit QR-Codes */}
        <div className="space-y-3">
          {tickets.map((ticket, i) => (
            <div key={ticket.id} className="rounded-2xl border border-border bg-background p-5 flex items-center gap-5">
              <Image src={qrCodes[i]} alt={fmt(t.qrPlatzAlt, { platz: sitzAnzeige(ticket.sitzplatz_id) })}
                width={104} height={104} unoptimized
                className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-lg border border-border" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">
                  <Ticket className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono">{sitzAnzeige(ticket.sitzplatz_id)}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{ticket.sitzplatz_bezeichnung}</p>
                <p className="text-sm font-medium mt-1 tabular-nums">
                  {(ticket.preis_cent / 100).toLocaleString(loc, { style: "currency", currency: "EUR" })}
                </p>
                {ticket.eingeloest_am && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    {fmt(t.bereitsEingeloest, { zeit: new Date(ticket.eingeloest_am).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" }) })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed pb-6">
          {t.qrHandyHinweis}<br />
          {t.buchungsnummer} <span className="font-mono">{buchungId}</span>
        </p>
      </div>
    </div>
  );
}
