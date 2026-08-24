import { createClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { migrierteKonfiguration, elementSitzIds } from "@/types/sitzplan";
import EventsListe from "./events-liste";

export default async function EventsSeite() {
  const [t, supabase] = await Promise.all([getServerDict(), createClient()]);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, titel, datum, status, ticket_preis_cent, sitzplan_id")
    .eq("veranstalter_id", user!.id)
    .order("datum", { ascending: false });

  const eventIds = (events ?? []).map((e) => e.id);
  const sitzplanIds = [...new Set((events ?? []).map((e) => e.sitzplan_id).filter(Boolean) as string[])];

  const [ticketsRes, sitzplaeneRes] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("tickets").select("event_id").in("event_id", eventIds)
      : { data: [] },
    sitzplanIds.length > 0
      ? supabase.from("sitzplaene").select("id, konfiguration").in("id", sitzplanIds)
      : { data: [] },
  ]);

  const ticketsProEvent = new Map<string, number>();
  for (const tk of ticketsRes.data ?? []) {
    ticketsProEvent.set(tk.event_id, (ticketsProEvent.get(tk.event_id) ?? 0) + 1);
  }

  const kapazitaetProSitzplan = new Map<string, number>();
  for (const plan of sitzplaeneRes.data ?? []) {
    const konfig = migrierteKonfiguration(plan.konfiguration);
    kapazitaetProSitzplan.set(
      plan.id,
      konfig.elemente.reduce((s, e) => s + elementSitzIds(e).length, 0)
    );
  }

  const eventsMitBelegung = (events ?? []).map((e) => ({
    ...e,
    verkauft: ticketsProEvent.get(e.id) ?? 0,
    kapazitaet: e.sitzplan_id ? kapazitaetProSitzplan.get(e.sitzplan_id) ?? null : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight truncate">{t.events.title}</h1>
          <p className="text-muted-foreground mt-2">{t.events.subtitle}</p>
        </div>
        <Button asChild size="lg" className="self-start sm:self-auto shrink-0 gap-2">
          <Link href="/dashboard/events/new">
            <Plus className="h-4 w-4" /> {t.events.neuesEvent}
          </Link>
        </Button>
      </div>

      <EventsListe events={eventsMitBelegung} />
    </div>
  );
}
