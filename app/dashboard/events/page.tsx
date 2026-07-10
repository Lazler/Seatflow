import { createClient } from "@/lib/supabase/server";
import { getServerDict, getServerLocale } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n/buchung";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Plus } from "@phosphor-icons/react/dist/ssr";
import EventDuplizieren from "./event-duplizieren";

export default async function EventsSeite() {
  const [t, supabase, locale] = await Promise.all([getServerDict(), createClient(), getServerLocale()]);
  const dateLocale = intlLocale(locale);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, titel, datum, status, ticket_preis_cent")
    .eq("veranstalter_id", user!.id)
    .order("datum", { ascending: false });

  const STATUS_LABEL: Record<string, string> = {
    entwurf: t.status.entwurf,
    veroeffentlicht: t.status.veroeffentlicht,
    abgesagt: t.status.abgesagt,
    beendet: t.status.beendet,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{t.events.title}</h1>
          <p className="text-muted-foreground">{t.events.subtitle}</p>
        </div>
        <Button asChild className="self-start sm:self-auto shrink-0">
          <Link href="/dashboard/events/neu">
            <Plus className="h-4 w-4 mr-1" /> {t.events.neuesEvent}
          </Link>
        </Button>
      </div>

      {(events ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">{t.events.nochKeineEvents}</p>
            <p className="text-sm text-muted-foreground mb-4">{t.events.erstelleErstesEvent}</p>
            <Button asChild>
              <Link href="/dashboard/events/neu">
                <Plus className="h-4 w-4 mr-1" /> {t.events.eventErstellen}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events?.map((event) => (
            <Card key={event.id}>
              <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium truncate">{event.titel}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.datum).toLocaleDateString(dateLocale, {
                      weekday: "short", day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                    {" · "}
                    {(event.ticket_preis_cent / 100).toLocaleString(dateLocale, { style: "currency", currency: "EUR" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <Badge
                    variant={event.status === "veroeffentlicht" ? "default" : event.status === "abgesagt" ? "destructive" : "secondary"}
                  >
                    {STATUS_LABEL[event.status] ?? event.status}
                  </Badge>
                  <EventDuplizieren eventId={event.id} eventTitel={event.titel} />
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/events/${event.id}`}>{t.events.details}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
