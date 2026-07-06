"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarBlank as CalendarClock, Check } from "@phosphor-icons/react";

// timestamptz → Wert für <input type="datetime-local"> (lokale Zeit)
function zuLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventVerkauf({
  eventId,
  initialVerkaufAb,
  initialVerkaufBis,
  initialMaxProBuchung,
}: {
  eventId: string;
  initialVerkaufAb: string | null;
  initialVerkaufBis: string | null;
  initialMaxProBuchung: number | null;
}) {
  const router = useRouter();
  const [verkaufAb, setVerkaufAb] = useState(zuLocalInput(initialVerkaufAb));
  const [verkaufBis, setVerkaufBis] = useState(zuLocalInput(initialVerkaufBis));
  const [maxProBuchung, setMaxProBuchung] = useState<number | "">(initialMaxProBuchung ?? "");
  const [speichert, setSpeichert] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern() {
    if (verkaufAb && verkaufBis && new Date(verkaufAb) >= new Date(verkaufBis)) {
      setFehler("Verkaufsstart muss vor dem Verkaufsende liegen.");
      return;
    }
    setSpeichert(true);
    setFehler(null);
    setGespeichert(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({
        verkauf_ab: verkaufAb ? new Date(verkaufAb).toISOString() : null,
        verkauf_bis: verkaufBis ? new Date(verkaufBis).toISOString() : null,
        max_pro_buchung: maxProBuchung === "" ? null : maxProBuchung,
      })
      .eq("id", eventId);
    setSpeichert(false);
    if (error) { setFehler(`Speichern fehlgeschlagen: ${error.message}`); return; }
    setGespeichert(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          Verkauf & Limits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Verkaufsstart (optional)</Label>
          <Input type="datetime-local" value={verkaufAb}
            onChange={(e) => setVerkaufAb(e.target.value)} className="h-9 text-sm" />
          <p className="text-[11px] text-muted-foreground">
            Vorher zeigt die Buchungsseite „Vorverkauf startet am …".
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Verkaufsende (optional)</Label>
          <Input type="datetime-local" value={verkaufBis}
            onChange={(e) => setVerkaufBis(e.target.value)} className="h-9 text-sm" />
          <p className="text-[11px] text-muted-foreground">
            Danach ist online keine Buchung mehr möglich — z. B. 2 h vor Einlass.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Max. Plätze pro Buchung</Label>
          <Input type="number" min={1} max={20} placeholder="8 (Standard)"
            value={maxProBuchung}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setMaxProBuchung(isNaN(v) ? "" : Math.min(20, Math.max(1, v)));
            }}
            className="h-9 text-sm w-32" />
        </div>

        {fehler && <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fehler}</p>}

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={speichern} disabled={speichert}>
            {speichert ? "Speichern…" : "Speichern"}
          </Button>
          {gespeichert && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Gespeichert
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
