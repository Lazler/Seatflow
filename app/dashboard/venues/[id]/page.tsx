import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
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

  // Sprache: Cookie > Profil > de (wie im Dashboard-Layout)
  const jar = await cookies();
  const cookieLang = jar.get("dashboard_lang")?.value;
  let locale: Locale = "de";
  if (cookieLang && isLocale(cookieLang)) {
    locale = cookieLang;
  } else {
    const { data: profil } = await supabase
      .from("veranstalter_profile")
      .select("sprache")
      .eq("id", user!.id)
      .single();
    if (profil?.sprache && isLocale(profil.sprache)) locale = profil.sprache as Locale;
  }
  const dict = await getDictionary(locale);
  const t = dict.venueDetail;
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";

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
                  <Map className="h-4 w-4" /> {t.saalplaeneTitel}
                </CardTitle>
                <CardDescription>
                  {t.saalplaeneBeschreibung}
                </CardDescription>
              </div>
              {(sitzplaene ?? []).length > 0 && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/venues/${id}/raumplan/neu`}>
                    <Plus className="h-4 w-4 mr-1" /> {t.neuerPlan}
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {(sitzplaene ?? []).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm font-medium">{t.naechsterSchritt}</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {t.naechsterSchrittText}
                  </p>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/venues/${id}/raumplan/neu`}>
                      <Plus className="h-4 w-4 mr-1.5" /> {t.saalplanErstellen}
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
                <Calendar className="h-4 w-4" /> {t.eventsHier}
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
                  <p className="text-sm text-muted-foreground mb-3">{t.keineEventsHier}</p>
                  {(sitzplaene ?? []).length > 0 && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/events/neu?venue=${id}`}>
                        <Plus className="h-4 w-4 mr-1.5" /> {t.eventHierAnlegen}
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
                            {new Date(event.datum).toLocaleDateString(dateLocale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {event.status === "veroeffentlicht"
                              ? dict.status.live
                              : event.status === "entwurf"
                              ? dict.status.entwurf
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
