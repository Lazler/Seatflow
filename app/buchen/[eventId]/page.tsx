import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import BuchungsSeiteClient from "@/components/buchung/buchungs-seite-client";
import { migrierteKonfiguration } from "@/types/sitzplan";

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
      "id, titel, beschreibung, datum, service_gebuehr_cent, status, sitzplan_id, venues(name, adresse)"
    )
    .eq("id", eventId)
    .eq("status", "veroeffentlicht")
    .single();

  if (!event) notFound();

  // Sitzplan laden (entweder direkt am Event oder ersten des Venue)
  let konfigurationRaw: unknown = null;
  let sitzplanId: string | null = event.sitzplan_id ?? null;

  if (sitzplanId) {
    const { data: plan } = await supabase
      .from("sitzplaene")
      .select("id, konfiguration")
      .eq("id", sitzplanId)
      .single();
    konfigurationRaw = plan?.konfiguration ?? null;
  }

  // Fallback: ersten Sitzplan des Venue nehmen
  if (!konfigurationRaw && event.venues) {
    const venue = event.venues as unknown as { name: string; adresse?: string };
    void venue; // venue info already used below
  }

  // Bereits belegte Sitze laden
  const { data: belegteTickets } = await supabase
    .from("tickets")
    .select("sitz_id")
    .eq("event_id", eventId);

  const belegteSitzIds = (belegteTickets ?? []).map((t) => t.sitz_id);

  const venue = event.venues
    ? !Array.isArray(event.venues)
      ? (event.venues as unknown as { name: string; adresse?: string })
      : null
    : null;

  return (
    <div className="min-h-screen bg-muted/40">
      <nav className="border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">SF</span>
            </div>
            <span className="font-semibold text-sm">SeatFlow</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{event.titel}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
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
                <MapPin className="h-4 w-4" />
                {venue.name}
                {venue.adresse ? `, ${venue.adresse}` : ""}
              </span>
            )}
          </div>
          {event.beschreibung && (
            <p className="text-muted-foreground mt-3 text-sm">{event.beschreibung}</p>
          )}
        </div>

        {konfigurationRaw && sitzplanId ? (
          <BuchungsSeiteClient
            eventId={event.id}
            sitzplanId={sitzplanId}
            konfiguration={migrierteKonfiguration(konfigurationRaw)}
            belegteSitzIds={belegteSitzIds}
            serviceGebuehrCent={event.service_gebuehr_cent ?? 50}
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
