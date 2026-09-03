import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Ticket, ArrowSquareOut as ExternalLink, Users, Gear as Settings , ListChecks } from "@phosphor-icons/react/dist/ssr";
import EventStatusAktion from "./event-status-aktion";
import ScannerPinVerwaltung from "./scanner-pin-verwaltung";
import EventRundmail from "./event-rundmail";
import { VeroeffentlichungsCheck } from "@/components/events/veroeffentlichungs-check";
import { pruefeVeroeffentlichung } from "@/lib/event-bereitschaft";
import { zaehleBuchbarePlaetze } from "@/lib/event-plaetze";
import { effectivePlan, PLAN_SEAT_LIMIT } from "@/lib/plan";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  entwurf: "secondary",
  veroeffentlicht: "default",
  abgesagt: "destructive",
  beendet: "outline",
};

export default async function EventDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: event }, { data: buchungen }] = await Promise.all([
    supabase
      .from("events")
      .select("*, venues(id, name, adresse)")
      .eq("id", id)
      .eq("veranstalter_id", user!.id)
      .single(),
    supabase
      .from("buchungen")
      .select("id, gaest_name, gaest_email, gesamt_cent, status, erstellt_am")
      .eq("event_id", id)
      .order("erstellt_am", { ascending: false })
      .limit(50),
  ]);

  if (!event) notFound();

  const venue = event.venues as { id: string; name: string; adresse: string | null } | null;

  const buchungsUrl = `/book/${event.id}`;
  const bezahlteBuchungen = (buchungen ?? []).filter((b) => b.status === "bezahlt");
  const gesamteinnahmenCent = bezahlteBuchungen.reduce((s, b) => s + b.gesamt_cent, 0);

  // ── Veröffentlichungs-Bereitschaft ──────────────────────────────────────────
  const { data: profil } = await supabase
    .from("veranstalter_profile")
    .select("plan, abo_bis, sprache")
    .eq("id", user!.id)
    .single();
  const plan = effectivePlan(profil?.plan ?? "free", profil?.abo_bis ?? null);

  // Sprache: Cookie > Profil > de (wie im Dashboard-Layout)
  const jar = await cookies();
  const cookieLang = jar.get("dashboard_lang")?.value;
  let locale: Locale = "de";
  if (cookieLang && isLocale(cookieLang)) {
    locale = cookieLang;
  } else if (profil?.sprache && isLocale(profil.sprache)) {
    locale = profil.sprache as Locale;
  }
  const dict = await getDictionary(locale);
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";

  const { hatSaalplan, plaetze: buchbarePlaetze } = await zaehleBuchbarePlaetze(
    supabase,
    (event.sitzplan_id as string | null) ?? null,
    (event.etagen as { sitzplan_id: string }[] | null) ?? null,
  );

  const { anforderungen, harteBlocker } = pruefeVeroeffentlichung({
    eventId: event.id,
    hatVenue: !!venue,
    hatSaalplan,
    buchbarePlaetze,
    hatBild: !!event.bild_url,
    plan,
    sitzLimit: PLAN_SEAT_LIMIT[plan],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{event.titel}</h1>
            <Badge variant={STATUS_VARIANT[event.status]}>
              {dict.status[event.status as keyof typeof dict.status] ?? event.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(event.datum).toLocaleDateString(dateLocale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {venue.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Ticket className="h-3.5 w-3.5" />
              {(event.ticket_preis_cent / 100).toLocaleString(dateLocale, {
                style: "currency",
                currency: "EUR",
              })}{" "}
              {dict.eventDetail.servicegebuehr}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Kennzahlen */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="min-w-0">
              <CardContent className="pt-4 px-3 sm:px-6">
                <div className="text-lg sm:text-2xl font-bold tabular-nums">{bezahlteBuchungen.length}</div>
                <p className="text-xs text-muted-foreground mt-1">{dict.eventDetail.buchungen}</p>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardContent className="pt-4 px-3 sm:px-6">
                <div className="text-lg sm:text-2xl font-bold tabular-nums">
                  {(buchungen ?? []).reduce((s) => {
                    return s; // Ticket-Zählung kommt mit Sitzplan
                  }, 0) || "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{dict.eventDetail.tickets}</p>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardContent className="pt-4 px-3 sm:px-6">
                <div className="text-lg sm:text-2xl font-bold tabular-nums truncate">
                  {(gesamteinnahmenCent / 100).toLocaleString(dateLocale, {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{dict.eventDetail.einnahmen}</p>
              </CardContent>
            </Card>
          </div>

          {/* Buchungsliste */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> {dict.eventDetail.buchungen}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(buchungen ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {dict.eventDetail.keineBuchungen}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {buchungen?.map((buchung) => (
                    <div key={buchung.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{buchung.gaest_name}</p>
                        <p className="text-xs text-muted-foreground">{buchung.gaest_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {(buchung.gesamt_cent / 100).toLocaleString(dateLocale, {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                        <Badge
                          variant={buchung.status === "bezahlt" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {dict.status[buchung.status as keyof typeof dict.status] ?? buchung.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seitenleiste */}
        <div className="space-y-4">
          {/* Bereitschaft vor dem Veröffentlichen */}
          {event.status === "entwurf" && (
            <VeroeffentlichungsCheck anforderungen={anforderungen} />
          )}

          {/* Aktionen */}
          <EventStatusAktion
            eventId={event.id}
            status={event.status}
            bezahlteAnzahl={bezahlteBuchungen.length}
            harteBlocker={event.status === "entwurf" ? harteBlocker : 0}
          />

          {/* Einstellungen */}
          <Card>
            <CardHeader><CardTitle className="text-sm">{dict.events.einstellungen}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/events/${event.id}/settings`}>
                  <Settings className="h-3.5 w-3.5 mr-1.5" /> {dict.eventDetail.eventKonfigurieren}
                </Link>
              </Button>
              {event.status === "veroeffentlicht" && (
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={buchungsUrl} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> {dict.eventDetail.buchungsseiteOeffnen}
                  </Link>
                </Button>
              )}
              {event.status === "veroeffentlicht" && (
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/scan/${event.id}`} target="_blank">
                    <Ticket className="h-3.5 w-3.5 mr-1.5" /> {dict.eventDetail.ticketScanner}
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/events/${event.id}/guest-list`}>
                  <ListChecks className="h-3.5 w-3.5 mr-1.5" /> {dict.eventDetailPage.gaestelisteExport}
                </Link>
              </Button>
              <EventRundmail
                eventId={event.id}
                anzahlGaeste={new Set(bezahlteBuchungen.map((b) => b.gaest_email?.toLowerCase?.() ?? "")).size}
              />
              {event.status === "veroeffentlicht" && (
                <ScannerPinVerwaltung
                  eventId={event.id}
                  initialPin={(event.scanner_pin as string | null) ?? null}
                />
              )}
            </CardContent>
          </Card>

          {/* Event-Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{dict.eventDetail.details}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {event.beschreibung && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{dict.events.beschreibung}</p>
                  <p>{event.beschreibung}</p>
                </div>
              )}
              {event.einlass_datum && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{dict.events.einlass}</p>
                  <p>
                    {new Date(event.einlass_datum).toLocaleTimeString(dateLocale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {dict.common.uhr}
                  </p>
                </div>
              )}
              {event.max_tickets && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{dict.events.maxTickets}</p>
                  <p>{event.max_tickets}</p>
                </div>
              )}
              {venue && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{dict.eventDetailPage.veranstaltungsort}</p>
                  <Link
                    href={`/dashboard/venues/${venue.id}`}
                    className="text-primary hover:underline"
                  >
                    {venue.name}
                  </Link>
                  {venue.adresse && (
                    <p className="text-muted-foreground text-xs mt-0.5">{venue.adresse}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
