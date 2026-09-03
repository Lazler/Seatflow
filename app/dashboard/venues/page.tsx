import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Plus } from "@phosphor-icons/react/dist/ssr";
import { getServerDict } from "@/lib/i18n/server";
import { migrierteKonfiguration, elementSitzIds } from "@/types/sitzplan";
import { VenueThumbnail } from "@/components/raumplan/venue-thumbnail";

export default async function VenuesSeite() {
  const t = await getServerDict();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, adresse, erstellt_am")
    .eq("veranstalter_id", user!.id)
    .order("erstellt_am", { ascending: false });

  const venueIds = (venues ?? []).map((v) => v.id);
  const { data: alleSitzplaene } = venueIds.length > 0
    ? await supabase
        .from("sitzplaene")
        .select("id, venue_id, konfiguration")
        .in("venue_id", venueIds)
        .order("erstellt_am", { ascending: true })
    : { data: [] };

  const plaeneProVenue = new Map<string, { id: string; konfiguration: unknown }[]>();
  for (const plan of alleSitzplaene ?? []) {
    const liste = plaeneProVenue.get(plan.venue_id) ?? [];
    liste.push(plan);
    plaeneProVenue.set(plan.venue_id, liste);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight truncate">{t.venues.title}</h1>
          <p className="text-muted-foreground mt-2">{t.venues.subtitle}</p>
        </div>
        <Button asChild size="lg" className="self-start sm:self-auto shrink-0 gap-2">
          <Link href="/dashboard/venues/new">
            <Plus className="h-4 w-4" /> {t.venues.neuesVenue}
          </Link>
        </Button>
      </div>

      {(venues ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">{t.venues.nochKeineVenues}</p>
          <p className="text-sm mt-1 mb-4">{t.venues.ersteVenue}</p>
          <Button asChild>
            <Link href="/dashboard/venues/new">
              <Plus className="h-4 w-4 mr-1" /> {t.venues.venueAnlegen}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {venues?.map((venue) => {
            const plaene = plaeneProVenue.get(venue.id) ?? [];
            const ersterPlan = plaene[0];
            const konfig = ersterPlan ? migrierteKonfiguration(ersterPlan.konfiguration) : null;
            const plaetze = konfig ? konfig.elemente.reduce((s, e) => s + elementSitzIds(e).length, 0) : 0;

            return (
              <Link
                key={venue.id}
                href={`/dashboard/venues/${venue.id}`}
                className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-foreground"
              >
                <VenueThumbnail konfiguration={konfig} />
                <div className="flex-1 p-5 flex flex-col gap-1">
                  <h3 className="text-xl font-bold leading-none">{venue.name}</h3>
                  {venue.adresse && <p className="text-sm text-muted-foreground">{venue.adresse}</p>}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border text-sm">
                    <span className="text-xs text-muted-foreground">{t.venues.plaetze}</span>
                    <span className="font-mono">{plaetze}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{t.venues.raumplaene}</span>
                    <span className="font-mono">{plaene.length}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          <Link
            href="/dashboard/venues/new"
            className="rounded-lg border border-dashed border-border p-8 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground min-h-[240px] transition-colors hover:border-foreground hover:text-foreground"
          >
            <Plus className="h-7 w-7" />
            <div>
              <p className="font-semibold text-foreground">{t.venues.venueAnlegen}</p>
              <p className="text-sm mt-1">{t.venues.ersteVenue}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
