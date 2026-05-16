import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BuchungsSeiteClient from "@/components/buchung/buchungs-seite-client";
import { migrierteKonfiguration } from "@/types/sitzplan";
import type { TicketTyp } from "@/types/ticket-typ";

type EtageRaw = { id: string; name: string; sitzplan_id: string };

export default async function BuchungsSeite({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, titel, beschreibung, datum, service_gebuehr_cent, status, sitzplan_id, etagen, ticket_typen, cancel_url, venues(name, adresse)"
    )
    .eq("id", eventId)
    .eq("status", "veroeffentlicht")
    .single();

  if (!event) notFound();

  const cancelUrl = event.cancel_url ?? null;
  const venue = event.venues && !Array.isArray(event.venues)
    ? (event.venues as unknown as { name: string; adresse?: string })
    : null;

  // Resolve which floors to show
  const etagen = (event.etagen as EtageRaw[] | null)?.filter((e) => e.sitzplan_id) ?? null;
  const sitzplanIds: string[] = etagen
    ? etagen.map((e) => e.sitzplan_id)
    : event.sitzplan_id
      ? [event.sitzplan_id]
      : [];

  // Load all sitzplaene in parallel
  const [sitzplaeneResults, belegteTicketsResult] = await Promise.all([
    Promise.all(
      sitzplanIds.map((id) =>
        supabase.from("sitzplaene").select("id, konfiguration").eq("id", id).single()
      )
    ),
    supabase.from("tickets").select("sitzplatz_id").eq("event_id", eventId),
  ]);

  const belegteSitzIds = (belegteTicketsResult.data ?? []).map((t) => t.sitzplatz_id);

  // Build floor data
  const floors = sitzplanIds
    .map((id, i) => {
      const plan = sitzplaeneResults[i]?.data;
      if (!plan) return null;
      const etageName = etagen ? etagen[i]?.name : null;
      return {
        id: etagen ? etagen[i].id : id,
        name: etageName ?? null,
        sitzplanId: id,
        konfiguration: migrierteKonfiguration(plan.konfiguration),
      };
    })
    .filter(Boolean) as {
      id: string;
      name: string | null;
      sitzplanId: string;
      konfiguration: ReturnType<typeof migrierteKonfiguration>;
    }[];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Nav */}
      <nav className="border-b border-border bg-background sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {cancelUrl ? (
            <a
              href={cancelUrl}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
          ) : (
            <Link
              href={`/buchen/${eventId}`}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              aria-label="Zurück"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-[10px]">SF</span>
            </div>
            <span className="font-semibold text-sm truncate">{event.titel}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Event-Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1.5">{event.titel}</h1>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
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
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{venue.name}{venue.adresse ? `, ${venue.adresse}` : ""}</span>
              </span>
            )}
          </div>
          {event.beschreibung && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{event.beschreibung}</p>
          )}
        </div>

        {/* Sitzplan + Checkout */}
        {floors.length > 0 ? (
          <BuchungsSeiteClient
            eventId={event.id}
            eventTitel={event.titel}
            eventDatum={event.datum}
            venueName={venue?.name}
            floors={floors}
            belegteSitzIds={belegteSitzIds}
            serviceGebuehrCent={event.service_gebuehr_cent ?? 50}
            ticketTypen={((event.ticket_typen as TicketTyp[] | null) ?? []).filter((t) => t.aktiv)}
          />
        ) : (
          <div className="rounded-xl border border-border bg-background p-12 text-center text-muted-foreground text-sm">
            Für dieses Event wurde noch kein Sitzplan zugewiesen.
          </div>
        )}
      </div>
    </div>
  );
}
