import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, MapPin, Ticket, TrendingUp, Plus } from "lucide-react";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profil }, { data: events }, { data: venues }] = await Promise.all([
    supabase.from("veranstalter_profile").select("*").eq("id", user!.id).single(),
    supabase
      .from("events")
      .select("id, titel, datum, status")
      .eq("veranstalter_id", user!.id)
      .order("datum", { ascending: true })
      .limit(5),
    supabase
      .from("venues")
      .select("id, name")
      .eq("veranstalter_id", user!.id),
  ]);

  const naechsteEvents = (events ?? []).filter(
    (e) => new Date(e.datum) >= new Date() && e.status === "veroeffentlicht"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Willkommen, {profil?.name ?? "Veranstalter"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Hier ist deine Übersicht für heute.
        </p>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Events gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Kommende Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{naechsteEvents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Venues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{venues?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="capitalize">
              {profil?.plan ?? "starter"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Nächste Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nächste Events</h2>
          <Button size="sm" asChild>
            <Link href="/dashboard/events/neu">
              <Plus className="h-4 w-4 mr-1" /> Neues Event
            </Link>
          </Button>
        </div>

        {(events ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Noch keine Events</p>
              <p className="text-sm text-muted-foreground mb-4">
                Erstelle dein erstes Event und fange an Tickets zu verkaufen.
              </p>
              <Button asChild>
                <Link href="/dashboard/events/neu">
                  <Plus className="h-4 w-4 mr-1" /> Erstes Event erstellen
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {events?.map((event) => (
              <Card key={event.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.titel}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.datum).toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        event.status === "veroeffentlicht"
                          ? "default"
                          : event.status === "abgesagt"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {event.status === "veroeffentlicht"
                        ? "Veröffentlicht"
                        : event.status === "entwurf"
                        ? "Entwurf"
                        : event.status === "abgesagt"
                        ? "Abgesagt"
                        : "Beendet"}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/events/${event.id}`}>Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Venues Schnellzugriff */}
      {(venues ?? []).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Noch kein Venue angelegt</p>
            <p className="text-sm text-muted-foreground mb-4">
              Lege deinen Veranstaltungsort an, bevor du Events erstellst.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/venues/neu">
                <Plus className="h-4 w-4 mr-1" /> Venue anlegen
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
