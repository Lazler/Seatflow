import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MapPin, Plus } from "@phosphor-icons/react/dist/ssr";
import { getServerDict } from "@/lib/i18n/server";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{t.venues.title}</h1>
          <p className="text-muted-foreground">{t.venues.subtitle}</p>
        </div>
        <Button asChild className="self-start sm:self-auto shrink-0">
          <Link href="/dashboard/venues/neu">
            <Plus className="h-4 w-4 mr-1" /> {t.venues.neuesVenue}
          </Link>
        </Button>
      </div>

      {(venues ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">{t.venues.nochKeineVenues}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {t.venues.ersteVenue}
            </p>
            <Button asChild>
              <Link href="/dashboard/venues/neu">
                <Plus className="h-4 w-4 mr-1" /> {t.venues.venueAnlegen}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues?.map((venue) => (
            <Card key={venue.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{venue.name}</CardTitle>
                {venue.adresse && (
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {venue.adresse}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/venues/${venue.id}`}>{t.venues.verwalten}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
