import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

export default async function VenuesSeite() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Venues</h1>
          <p className="text-muted-foreground">Deine Veranstaltungsorte verwalten</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/venues/neu">
            <Plus className="h-4 w-4 mr-1" /> Neues Venue
          </Link>
        </Button>
      </div>

      {(venues ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Noch keine Venues</p>
            <p className="text-sm text-muted-foreground mb-4">
              Lege deinen ersten Veranstaltungsort an.
            </p>
            <Button asChild>
              <Link href="/dashboard/venues/neu">
                <Plus className="h-4 w-4 mr-1" /> Venue anlegen
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
                  <Link href={`/dashboard/venues/${venue.id}`}>Verwalten</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
