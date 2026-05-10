import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  entwurf: "Entwurf",
  veroeffentlicht: "Veröffentlicht",
  abgesagt: "Abgesagt",
  beendet: "Beendet",
};

export default async function EventsSeite() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, titel, datum, status, ticket_preis_cent")
    .eq("veranstalter_id", user!.id)
    .order("datum", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">Alle deine Veranstaltungen</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/neu">
            <Plus className="h-4 w-4 mr-1" /> Neues Event
          </Link>
        </Button>
      </div>

      {(events ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Noch keine Events</p>
            <p className="text-sm text-muted-foreground mb-4">
              Erstelle dein erstes Event und verkaufe Tickets mit Sitzplatzwahl.
            </p>
            <Button asChild>
              <Link href="/dashboard/events/neu">
                <Plus className="h-4 w-4 mr-1" /> Event erstellen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events?.map((event) => (
            <Card key={event.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex-1">
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
                    {" · "}
                    {(event.ticket_preis_cent / 100).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge
                    variant={
                      event.status === "veroeffentlicht"
                        ? "default"
                        : event.status === "abgesagt"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {STATUS_LABEL[event.status] ?? event.status}
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
  );
}
