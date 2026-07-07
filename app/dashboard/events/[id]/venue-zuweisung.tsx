"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";

type Venue = { id: string; name: string };

// Ordnet einem bestehenden Event die Venue zu bzw. ändert sie. Ohne diese
// Karte könnte eine ohne Venue angelegte Veranstaltung nie einen Sitzplan
// bekommen — und damit nie verkaufen.
export default function VenueZuweisung({
  eventId,
  venues,
  aktuelleVenueId,
  gesperrt,
}: {
  eventId: string;
  venues: Venue[];
  aktuelleVenueId: string | null;
  // true, sobald bezahlte Buchungen existieren — ein Venue-Wechsel würde
  // die auf Tickets gespeicherten Sitzplätze ungültig machen
  gesperrt: boolean;
}) {
  const router = useRouter();
  const [venueId, setVenueId] = useState(aktuelleVenueId ?? "");
  const [speichert, setSpeichert] = useState(false);

  const geaendert = (venueId || null) !== (aktuelleVenueId ?? null);
  const venueGewechselt = geaendert && aktuelleVenueId !== null;

  async function speichern() {
    setSpeichert(true);
    const supabase = createClient();
    // Beim Wechsel der Venue verweisen der bisherige Sitzplan und die Etagen
    // auf Pläne der alten Venue → zurücksetzen, damit nichts Fremdes hängt.
    const patch: { venue_id: string | null; sitzplan_id?: null; etagen?: null } = {
      venue_id: venueId || null,
    };
    if (venueGewechselt) {
      patch.sitzplan_id = null;
      patch.etagen = null;
    }
    const { error } = await supabase.from("events").update(patch).eq("id", eventId);
    setSpeichert(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen", error.message);
      return;
    }
    toast.success(
      venueId ? "Veranstaltungsort zugeordnet" : "Veranstaltungsort entfernt",
      venueGewechselt ? "Sitzplan-Zuordnung wurde zurückgesetzt — bitte unten neu wählen." : undefined
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Veranstaltungsort
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {venues.length === 0 ? (
          <div className="text-xs text-muted-foreground space-y-2">
            <p>Du hast noch keinen Veranstaltungsort angelegt.</p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/venues/neu">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Veranstaltungsort anlegen
              </Link>
            </Button>
          </div>
        ) : gesperrt ? (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Der Veranstaltungsort ist festgelegt, weil es bereits bezahlte Buchungen gibt.
              Ein Wechsel würde die verkauften Sitzplätze ungültig machen.
            </p>
          </div>
        ) : (
          <>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
            >
              <option value="">— Kein Veranstaltungsort —</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {venueGewechselt && (
              <p className="text-[11px] text-amber-600">
                Beim Wechsel wird die bisherige Sitzplan-Zuordnung zurückgesetzt.
              </p>
            )}
            <Button size="sm" onClick={speichern} disabled={speichert || !geaendert}>
              {speichert ? "Speichern…" : "Speichern"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
