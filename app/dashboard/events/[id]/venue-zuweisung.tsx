"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/components/i18n-provider";

type Venue = { id: string; name: string };

// Radix Select erlaubt keinen leeren String als Item-Value.
const KEIN_VENUE = "__kein_venue__";

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
  const t = useT();
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
      toast.error(t.common.speichernFehlgeschlagen, error.message);
      return;
    }
    toast.success(
      venueId ? t.venueZuweisung.zugeordnet : t.venueZuweisung.entfernt,
      venueGewechselt ? t.venueZuweisung.resetHinweis : undefined
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t.eventDetailPage.veranstaltungsort}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {venues.length === 0 ? (
          <div className="text-xs text-muted-foreground space-y-2">
            <p>{t.eventForm.keinVenue}</p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/venues/new">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> {t.venues.venueAnlegen}
              </Link>
            </Button>
          </div>
        ) : gesperrt ? (
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              {t.venueZuweisung.gesperrtHinweis}
            </p>
          </div>
        ) : (
          <>
            <Select
              value={venueId || KEIN_VENUE}
              onValueChange={(v) => setVenueId(v === KEIN_VENUE ? "" : v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={KEIN_VENUE}>{t.venueZuweisung.keinVenueOption}</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {venueGewechselt && (
              <p className="text-[11px] text-amber-600">
                {t.venueZuweisung.wechselHinweis}
              </p>
            )}
            <Button size="sm" onClick={speichern} disabled={speichert || !geaendert}>
              {speichert ? t.common.speichernLaeuft : t.common.speichern}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
