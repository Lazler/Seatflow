"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarBlank as CalendarClock } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/components/i18n-provider";

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
  const t = useT();
  const router = useRouter();
  const [verkaufAb, setVerkaufAb] = useState(zuLocalInput(initialVerkaufAb));
  const [verkaufBis, setVerkaufBis] = useState(zuLocalInput(initialVerkaufBis));
  const [maxProBuchung, setMaxProBuchung] = useState<number | "">(initialMaxProBuchung ?? "");
  const [speichert, setSpeichert] = useState(false);

  async function speichern() {
    if (verkaufAb && verkaufBis && new Date(verkaufAb) >= new Date(verkaufBis)) {
      toast.error(t.eventVerkauf.ungueltigerZeitraum, t.eventVerkauf.zeitraumHinweis);
      return;
    }
    setSpeichert(true);
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
    if (error) { toast.error(t.common.speichernFehlgeschlagen, error.message); return; }
    toast.success(t.common.gespeichert, t.eventVerkauf.toastText);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          {t.eventVerkauf.titel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t.eventVerkauf.verkaufsstart}</Label>
          <Input type="datetime-local" value={verkaufAb}
            onChange={(e) => setVerkaufAb(e.target.value)} className="h-9 text-sm" />
          <p className="text-[11px] text-muted-foreground">
            {t.eventVerkauf.verkaufsstartHinweis}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t.eventVerkauf.verkaufsende}</Label>
          <Input type="datetime-local" value={verkaufBis}
            onChange={(e) => setVerkaufBis(e.target.value)} className="h-9 text-sm" />
          <p className="text-[11px] text-muted-foreground">
            {t.eventVerkauf.verkaufsendeHinweis}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t.eventVerkauf.maxProBuchung}</Label>
          <Input type="number" min={1} max={20} placeholder={t.eventVerkauf.maxPlaceholder}
            value={maxProBuchung}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setMaxProBuchung(isNaN(v) ? "" : Math.min(20, Math.max(1, v)));
            }}
            className="h-9 text-sm w-32" />
        </div>

        <Button size="sm" onClick={speichern} disabled={speichert}>
          {speichert ? t.common.speichernLaeuft : t.common.speichern}
        </Button>
      </CardContent>
    </Card>
  );
}
