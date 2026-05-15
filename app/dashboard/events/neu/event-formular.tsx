"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

type Venue = { id: string; name: string };

export default function NeuesEventFormular({
  venues,
  vorausgewaehlteVenueId,
}: {
  venues: Venue[];
  vorausgewaehlteVenueId?: string;
}) {
  const router = useRouter();

  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [venueId, setVenueId] = useState(vorausgewaehlteVenueId ?? "");
  const [datum, setDatum] = useState("");
  const [einlassDatum, setEinlassDatum] = useState("");
  const [preisEuro, setPreisEuro] = useState("");
  const [maxTickets, setMaxTickets] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/anmelden");
      return;
    }

    const preisInCent = Math.round(parseFloat(preisEuro.replace(",", ".")) * 100);
    if (isNaN(preisInCent) || preisInCent < 0) {
      setFehler("Ungültiger Ticketpreis.");
      setLaedt(false);
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        veranstalter_id: user.id,
        venue_id: venueId || null,
        titel,
        beschreibung: beschreibung || null,
        datum: new Date(datum).toISOString(),
        einlass_datum: einlassDatum ? new Date(einlassDatum).toISOString() : null,
        ticket_preis_cent: preisInCent,
        max_tickets: maxTickets ? parseInt(maxTickets) : null,
        status: "entwurf",
      })
      .select("id")
      .single();

    if (error) {
      setFehler("Event konnte nicht gespeichert werden.");
      setLaedt(false);
      return;
    }

    router.push(`/dashboard/events/${data.id}`);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Neues Event</h1>
          <p className="text-muted-foreground text-sm">Veranstaltung anlegen</p>
        </div>
      </div>

      {venues.length === 0 && (
        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <p>
            Du hast noch kein Venue angelegt.{" "}
            <Link href="/dashboard/venues/neu" className="text-primary hover:underline">
              Venue zuerst anlegen
            </Link>{" "}
            um es hier auswählen zu können.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event-Details</CardTitle>
          <CardDescription>
            Das Event wird als Entwurf gespeichert — du kannst es danach veröffentlichen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titel">Titel *</Label>
              <Input
                id="titel"
                placeholder="z.B. Kabarettabend mit Max Müller"
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beschreibung">Beschreibung</Label>
              <textarea
                id="beschreibung"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Kurzbeschreibung der Veranstaltung (wird auf der Buchungsseite angezeigt)"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <select
                id="venue"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
              >
                <option value="">— Kein Venue zugeordnet —</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="datum">Datum & Uhrzeit *</Label>
                <Input
                  id="datum"
                  type="datetime-local"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="einlass">Einlass</Label>
                <Input
                  id="einlass"
                  type="datetime-local"
                  value={einlassDatum}
                  onChange={(e) => setEinlassDatum(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="preis">Ticketpreis (€) *</Label>
                <Input
                  id="preis"
                  type="text"
                  inputMode="decimal"
                  placeholder="z.B. 18,00"
                  value={preisEuro}
                  onChange={(e) => setPreisEuro(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  + €0,50 Servicegebühr pro Ticket
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTickets">Max. Tickets</Label>
                <Input
                  id="maxTickets"
                  type="number"
                  min="1"
                  placeholder="z.B. 120"
                  value={maxTickets}
                  onChange={(e) => setMaxTickets(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leer = unbegrenzt
                </p>
              </div>
            </div>

            {fehler && <p className="text-sm text-destructive">{fehler}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={laedt}>
                {laedt ? "Wird gespeichert..." : "Event anlegen"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/events">Abbrechen</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
