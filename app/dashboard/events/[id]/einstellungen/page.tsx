import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getServerDict } from "@/lib/i18n/server";
import SitzplanZuweisung, { type Etage } from "../sitzplan-zuweisung";
import VenueZuweisung from "../venue-zuweisung";
import TicketTypen from "../ticket-typen";
import TicketTemplateSelector from "../ticket-template-selector";
import EventWeiterleitungen from "../event-weiterleitungen";
import EventExtras from "../event-extras";
import EventVerkauf from "../event-verkauf";
import EventBild from "../event-bild";
import type { Fruehbucher, EventAddon } from "@/types/event-extras";
import EventSprachen from "../event-sprachen";
import type { TicketTyp } from "@/types/ticket-typ";
import type { TicketDesign } from "@/types/ticket-design";

export default async function EventEinstellungen({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getServerDict();

  const [{ data: event }, { data: templates }, { data: alleVenues }] = await Promise.all([
    supabase
      .from("events")
      .select("*, venues(id, name, adresse)")
      .eq("id", id)
      .eq("veranstalter_id", user!.id)
      .single(),
    supabase
      .from("ticket_templates")
      .select("id, name, design")
      .eq("veranstalter_id", user!.id)
      .order("erstellt_am", { ascending: false }),
    supabase
      .from("venues")
      .select("id, name")
      .eq("veranstalter_id", user!.id)
      .order("name"),
  ]);

  if (!event) notFound();

  const venue = event.venues as { id: string; name: string; adresse: string | null } | null;

  // Venue-Wechsel sperren, sobald bezahlte Buchungen existieren (verkaufte
  // Sitzplätze dürfen nicht ins Leere zeigen)
  const { count: bezahlteAnzahl } = await supabase
    .from("buchungen")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("status", "bezahlt");

  const { data: sitzplaene } = venue
    ? await supabase
        .from("sitzplaene")
        .select("id, name")
        .eq("venue_id", venue.id)
        .order("erstellt_am", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/events/${event.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{t.eventEinstellungen.title}</h1>
          <p className="text-sm text-muted-foreground truncate">{event.titel}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VenueZuweisung
            eventId={event.id}
            venues={alleVenues ?? []}
            aktuelleVenueId={venue?.id ?? null}
            gesperrt={(bezahlteAnzahl ?? 0) > 0}
          />
          <SitzplanZuweisung
            eventId={event.id}
            venueId={venue?.id ?? null}
            aktuellerSitzplanId={event.sitzplan_id ?? null}
            aktuelleEtagen={(event.etagen as Etage[] | null) ?? null}
            sitzplaene={sitzplaene ?? []}
            eventSprachen={(event.sprachen as string[] | null) ?? ["de"]}
          />
          <TicketTypen
            eventId={event.id}
            initialTypen={(event.ticket_typen as TicketTyp[] | null) ?? []}
            eventSprachen={(event.sprachen as string[] | null) ?? ["de"]}
          />
          <EventExtras
            eventId={event.id}
            initialFruehbucher={(event.fruehbucher as Fruehbucher | null) ?? null}
            initialAddons={(event.addons as EventAddon[] | null) ?? []}
          />
        </div>

        <div className="space-y-4">
          <EventBild
            eventId={event.id}
            userId={user!.id}
            initialBildUrl={(event.bild_url as string | null) ?? null}
          />
          <EventVerkauf
            eventId={event.id}
            initialVerkaufAb={(event.verkauf_ab as string | null) ?? null}
            initialVerkaufBis={(event.verkauf_bis as string | null) ?? null}
            initialMaxProBuchung={(event.max_pro_buchung as number | null) ?? null}
          />
          <EventSprachen
            eventId={event.id}
            initialSprachen={(event.sprachen as string[] | null) ?? ["de"]}
            initialTranslations={
              (event.translations as Record<
                string,
                { titel: string; beschreibung: string }
              > | null) ?? {}
            }
            deTitel={event.titel}
            deBeschreibung={event.beschreibung ?? null}
          />
          <TicketTemplateSelector
            eventId={event.id}
            templates={
              (templates ?? []) as { id: string; name: string; design: TicketDesign }[]
            }
            initialTemplateId={(event.ticket_template_id as string | null) ?? null}
          />
          <EventWeiterleitungen
            eventId={event.id}
            initialSuccessUrl={event.success_url ?? null}
            initialCancelUrl={event.cancel_url ?? null}
          />
        </div>
      </div>
    </div>
  );
}
