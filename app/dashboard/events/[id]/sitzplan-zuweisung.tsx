"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

type Sitzplan = { id: string; name: string };

export default function SitzplanZuweisung({
  eventId,
  aktuellerSitzplanId,
  sitzplaene,
}: {
  eventId: string;
  aktuellerSitzplanId: string | null;
  sitzplaene: Sitzplan[];
}) {
  const router = useRouter();
  const [ausgewaehlt, setAusgewaehlt] = useState(aktuellerSitzplanId ?? "");
  const [laedt, setLaedt] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);

  async function speichern() {
    setLaedt(true);
    setGespeichert(false);
    const supabase = createClient();
    await supabase
      .from("events")
      .update({ sitzplan_id: ausgewaehlt || null })
      .eq("id", eventId);
    setLaedt(false);
    setGespeichert(true);
    router.refresh();
  }

  if (sitzplaene.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Map className="h-4 w-4" /> Sitzplan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={ausgewaehlt}
          onChange={(e) => { setAusgewaehlt(e.target.value); setGespeichert(false); }}
        >
          <option value="">— Kein Sitzplan —</option>
          {sitzplaene.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={speichern} disabled={laedt}>
            {laedt ? "Wird gespeichert…" : "Speichern"}
          </Button>
          {gespeichert && <span className="text-xs text-green-600">✓ Gespeichert</span>}
        </div>
      </CardContent>
    </Card>
  );
}
