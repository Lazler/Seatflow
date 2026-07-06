"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, EyeSlash as EyeOff, XCircle, CircleNotch as Loader2 } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";

type Status = "entwurf" | "veroeffentlicht" | "abgesagt" | "beendet";

export default function EventStatusAktion({
  eventId,
  status,
  bezahlteAnzahl,
}: {
  eventId: string;
  status: string;
  bezahlteAnzahl?: number;
}) {
  const t = useT();
  const router = useRouter();
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [absageergebnis, setAbsageergebnis] = useState<{ refunded: number; notified: number; total: number } | null>(null);

  async function statusAendern(naechsterStatus: Status) {
    setFehler(null);
    setLaedt(true);

    if (naechsterStatus === "abgesagt") {
      const anzahl = bezahlteAnzahl ?? 0;
      const bestaetigung = confirm(
        anzahl > 0
          ? t.events.absageBestaetigung
              .replace("{n}", String(anzahl))
              .replace("{s}", anzahl !== 1 ? "en" : "")
          : t.events.absageBestaetigungLeer
      );
      if (!bestaetigung) { setLaedt(false); return; }

      const res = await fetch(`/api/events/${eventId}/absagen`, { method: "POST" });
      setLaedt(false);
      if (res.ok) {
        const json = await res.json();
        setAbsageergebnis(json);
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setFehler(json.error ?? t.events.absageFehler);
      }
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ status: naechsterStatus })
      .eq("id", eventId);

    setLaedt(false);
    if (error) { setFehler(t.events.statusFehler); return; }
    router.refresh();
  }

  const aktionenMap: Record<Status, { label: string; naechsterStatus: Status; icon: React.ElementType; variant: "default" | "outline" | "destructive" }[]> = {
    entwurf: [
      { label: t.events.veroeffentlichen, naechsterStatus: "veroeffentlicht", icon: Globe, variant: "default" },
    ],
    veroeffentlicht: [
      { label: t.events.aufEntwurfZurueck, naechsterStatus: "entwurf", icon: EyeOff, variant: "outline" },
      { label: t.events.absagen, naechsterStatus: "abgesagt", icon: XCircle, variant: "destructive" },
    ],
    abgesagt: [],
    beendet: [],
  };

  const aktionen = aktionenMap[status as Status] ?? [];
  if (aktionen.length === 0 && !absageergebnis) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t.events.aktionen}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {absageergebnis ? (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{t.events.eventAbgesagt}</p>
            <p>{t.events.vonErstattet.replace("{refunded}", String(absageergebnis.refunded)).replace("{total}", String(absageergebnis.total))}</p>
            <p>{t.events.kaeuferBenachrichtigt.replace("{n}", String(absageergebnis.notified))}</p>
          </div>
        ) : (
          aktionen.map((aktion) => (
            <Button
              key={aktion.naechsterStatus}
              variant={aktion.variant}
              size="sm"
              className="w-full justify-start"
              disabled={laedt}
              onClick={() => statusAendern(aktion.naechsterStatus)}
            >
              {laedt
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <aktion.icon className="h-4 w-4 mr-2" />}
              {aktion.label}
            </Button>
          ))
        )}
        {fehler && <p className="text-xs text-destructive">{fehler}</p>}
      </CardContent>
    </Card>
  );
}
