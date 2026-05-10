import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";

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
      "id, titel, beschreibung, datum, ticket_preis_cent, service_gebuehr_cent, status, venues(name, adresse)"
    )
    .eq("id", eventId)
    .eq("status", "veroeffentlicht")
    .single();

  if (!event) {
    notFound();
  }

  const preis = event.ticket_preis_cent / 100;
  const gebuehr = event.service_gebuehr_cent / 100;

  return (
    <div className="min-h-screen bg-muted/40">
      <nav className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">SF</span>
            </div>
            <span className="font-semibold text-sm">SeatFlow</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Event-Info */}
          <div className="lg:col-span-2 space-y-4">
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
                {event.venues && !Array.isArray(event.venues) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {(event.venues as unknown as { name: string; adresse?: string }).name}
                    {(event.venues as unknown as { name: string; adresse?: string }).adresse
                      ? `, ${(event.venues as unknown as { name: string; adresse?: string }).adresse}`
                      : ""}
                  </span>
                )}
              </div>
            </div>

            {event.beschreibung && (
              <p className="text-muted-foreground">{event.beschreibung}</p>
            )}

            {/* Sitzplan-Platzhalter */}
            <Card>
              <CardContent className="py-16 text-center">
                <div className="text-muted-foreground">
                  <div className="w-full h-8 bg-muted rounded mb-8 flex items-center justify-center text-xs">
                    BÜHNE
                  </div>
                  <div className="space-y-2">
                    {[6, 7, 8, 8, 7].map((anzahl, reihe) => (
                      <div key={reihe} className="flex justify-center gap-1.5">
                        {Array.from({ length: anzahl }).map((_, sitz) => (
                          <div
                            key={sitz}
                            className="w-7 h-7 rounded-t-full bg-secondary hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors flex items-center justify-center text-xs"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-sm">
                    Interaktiver Sitzplan — wähle deinen Platz
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bestellübersicht */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">Bestellübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticketpreis</span>
                    <span>
                      {preis.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicegebühr</span>
                    <span>
                      {gebuehr.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Gesamt</span>
                    <span>
                      {(preis + gebuehr).toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </div>

                <Badge variant="secondary" className="w-full justify-center py-1.5">
                  Bitte wähle zuerst einen Sitzplatz
                </Badge>

                <p className="text-xs text-muted-foreground text-center">
                  Sichere Zahlung via Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
