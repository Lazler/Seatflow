"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, PencilSimple as Pencil } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";

type Venue = {
  id: string;
  name: string;
  adresse: string | null;
  beschreibung: string | null;
};

export default function VenueBearbeiten({ venue }: { venue: Venue }) {
  const router = useRouter();
  const dict = useT();
  const t = dict.venueBearbeiten;
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
      setFehler(t.fehlerSpeichern);
      return;
    }

    setBearbeiten(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t.stammdaten}</CardTitle>
        {!bearbeiten && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setBearbeiten(true)}
          >
            <Pencil className="h-4 w-4 mr-1" /> {dict.common.bearbeiten}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {bearbeiten ? (
          <>
            <div className="space-y-2">
              <Label>{t.nameLabel}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t.adresse}</Label>
              <Input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder={t.adressePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.beschreibung}</Label>
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
                {laedt ? dict.common.speichernLaeuft : dict.common.speichern}
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
                {dict.common.abbrechen}
              </Button>
            </div>
          </>
        ) : (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t.name}</dt>
              <dd className="font-medium mt-0.5">{venue.name}</dd>
            </div>
            {venue.adresse && (
              <div>
                <dt className="text-muted-foreground">{t.adresse}</dt>
                <dd className="mt-0.5">{venue.adresse}</dd>
              </div>
            )}
            {venue.beschreibung && (
              <div>
                <dt className="text-muted-foreground">{t.beschreibung}</dt>
                <dd className="mt-0.5">{venue.beschreibung}</dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
