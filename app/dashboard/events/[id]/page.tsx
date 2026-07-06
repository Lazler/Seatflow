import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Ticket, ArrowSquareOut as ExternalLink, Users, Gear as Settings } from "@phosphor-icons/react/dist/ssr";
import EventStatusAktion from "./event-status-aktion";

const STATUS_LABEL: Record<string, string> = {
  entwurf: "Entwurf",
  veroeffentlicht: "Veröffentlicht",
  abgesagt: "Abgesagt",
  beendet: "Beendet",
};

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

  const buchungsUrl = `/buchen/${event.id}`;
  const bezahlteBuchungen = (buchungen ?? []).filter((b) => b.status === "bezahlt");
  const gesamteinnahmenCent = bezahlteBuchungen.reduce((s, b) => s + b.gesamt_cent, 0);

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
              {STATUS_LABEL[event.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(event.datum).toLocaleDateString("de-DE", {
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
              {(event.ticket_preis_cent / 100).toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              + €0,50 Servicegebühr
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Kennzahlen */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{bezahlteBuchungen.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Buchungen</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {(buchungen ?? []).reduce((s, b) => {
                    return s; // Ticket-Zählung kommt mit Sitzplan
                  }, 0) || "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {(gesamteinnahmenCent / 100).toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Einnahmen</p>
              </CardContent>
            </Card>
          </div>

          {/* Buchungsliste */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Buchungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(buchungen ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Buchungen für dieses Event.
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
                          {(buchung.gesamt_cent / 100).toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                        <Badge
                          variant={buchung.status === "bezahlt" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {buchung.status}
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
          {/* Aktionen */}
          <EventStatusAktion eventId={event.id} status={event.status} bezahlteAnzahl={bezahlteBuchungen.length} />

          {/* Einstellungen */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Einstellungen</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/events/${event.id}/einstellungen`}>
                  <Settings className="h-3.5 w-3.5 mr-1.5" /> Event konfigurieren
                </Link>
              </Button>
              {event.status === "veroeffentlicht" && (
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={buchungsUrl} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Buchungsseite öffnen
                  </Link>
                </Button>
              )}
              {event.status === "veroeffentlicht" && (
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/scan/${event.id}`} target="_blank">
                    <Ticket className="h-3.5 w-3.5 mr-1.5" /> Ticket-Scanner öffnen
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Event-Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {event.beschreibung && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Beschreibung</p>
                  <p>{event.beschreibung}</p>
                </div>
              )}
              {event.einlass_datum && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Einlass</p>
                  <p>
                    {new Date(event.einlass_datum).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    Uhr
                  </p>
                </div>
              )}
              {event.max_tickets && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Max. Tickets</p>
                  <p>{event.max_tickets}</p>
                </div>
              )}
              {venue && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Venue</p>
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
