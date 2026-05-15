"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Pencil } from "lucide-react";

type Venue = {
  id: string;
  name: string;
  adresse: string | null;
  beschreibung: string | null;
};

export default function VenueBearbeiten({ venue }: { venue: Venue }) {
  const router = useRouter();
  const [bearbeiten, setBearbeiten] = useState(false);
  const [name, setName] = useState(venue.name);
  const [adresse, setAdresse] = useState(venue.adresse ?? "");
  const [beschreibung, setBeschreibung] = useState(venue.beschreibung ?? "");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern() {
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("venues")
      .update({
        name,
        adresse: adresse || null,
        beschreibung: beschreibung || null,
      })
      .eq("id", venue.id);

    setLaedt(false);

    if (error) {
      setFehler("Konnte nicht gespeichert werden.");
      return;
    }

    setBearbeiten(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Stammdaten</CardTitle>
        {!bearbeiten && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBearbeiten(true)}
          >
            <Pencil className="h-4 w-4 mr-1" /> Bearbeiten
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {bearbeiten ? (
          <>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="z.B. Marktplatz 1, 80331 München"
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <textarea
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
              />
            </div>
            {fehler && <p className="text-sm text-destructive">{fehler}</p>}
            <div className="flex gap-2">
              <Button onClick={speichern} disabled={laedt} size="sm">
                <Check className="h-4 w-4 mr-1" />
                {laedt ? "Speichern..." : "Speichern"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBearbeiten(false);
                  setName(venue.name);
                  setAdresse(venue.adresse ?? "");
                  setBeschreibung(venue.beschreibung ?? "");
                }}
              >
                Abbrechen
              </Button>
            </div>
          </>
        ) : (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium mt-0.5">{venue.name}</dd>
            </div>
            {venue.adresse && (
              <div>
                <dt className="text-muted-foreground">Adresse</dt>
                <dd className="mt-0.5">{venue.adresse}</dd>
              </div>
            )}
            {venue.beschreibung && (
              <div>
                <dt className="text-muted-foreground">Beschreibung</dt>
                <dd className="mt-0.5">{venue.beschreibung}</dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
