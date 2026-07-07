import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Calendar, Plus, MapTrifold as Map } from "@phosphor-icons/react/dist/ssr";
import VenueBearbeiten from "./venue-bearbeiten";
import SitzplanListe from "./sitzplan-liste";

export default async function VenueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: venue }, { data: events }, { data: sitzplaene }] =
    await Promise.all([
      supabase
        .from("venues")
        .select("*")
        .eq("id", id)
        .eq("veranstalter_id", user!.id)
        .single(),
      supabase
        .from("events")
        .select("id, titel, datum, status")
        .eq("venue_id", id)
        .order("datum", { ascending: false })
        .limit(10),
      supabase
        .from("sitzplaene")
        .select("id, name, erstellt_am")
        .eq("venue_id", id)
        .order("erstellt_am", { ascending: false }),
    ]);

  if (!venue) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/venues">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{venue.name}</h1>
          {venue.adresse && (
            <p className="text-muted-foreground text-sm">{venue.adresse}</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stammdaten bearbeiten */}
        <div className="lg:col-span-2 space-y-6">
          <VenueBearbeiten venue={venue} />

          {/* Saalpläne */}
          <Card className={(sitzplaene ?? []).length === 0 ? "border-primary/30 bg-primary/[0.02]" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="h-4 w-4" /> Saalpläne
                </CardTitle>
                <CardDescription>
                  Sitzplan-Layouts für diesen Veranstaltungsort
                </CardDescription>
              </div>
              {(sitzplaene ?? []).length > 0 && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/venues/${id}/raumplan/neu`}>
                    <Plus className="h-4 w-4 mr-1" /> Neuer Plan
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {(sitzplaene ?? []).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm font-medium">Nächster Schritt: Saalplan erstellen</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Platziere Reihen, Tische oder Stehplatz-Zonen — erst danach kannst du Tickets verkaufen.
                  </p>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/venues/${id}/raumplan/neu`}>
                      <Plus className="h-4 w-4 mr-1.5" /> Saalplan erstellen
                    </Link>
                  </Button>
                </div>
              ) : (
                <SitzplanListe venueId={id} plaene={sitzplaene ?? []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events an diesem Venue */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Events hier
              </CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link href={`/dashboard/events/neu?venue=${id}`}>
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {(events ?? []).length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Noch keine Events hier.</p>
                  {(sitzplaene ?? []).length > 0 && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/events/neu?venue=${id}`}>
                        <Plus className="h-4 w-4 mr-1.5" /> Event hier anlegen
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {events?.map((event) => (
                    <div key={event.id}>
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="block hover:bg-muted/50 rounded-md p-2 -mx-2 transition-colors"
                      >
                        <p className="text-sm font-medium">{event.titel}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.datum).toLocaleDateString("de-DE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {event.status === "veroeffentlicht"
                              ? "Live"
                              : event.status === "entwurf"
                              ? "Entwurf"
                              : event.status}
                          </Badge>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
