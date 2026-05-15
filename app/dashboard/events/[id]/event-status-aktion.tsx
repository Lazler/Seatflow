"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, EyeOff, XCircle } from "lucide-react";

type Status = "entwurf" | "veroeffentlicht" | "abgesagt" | "beendet";

const AKTIONEN: Record<Status, { label: string; naechsterStatus: Status; icon: React.ElementType; variant: "default" | "outline" | "destructive" }[]> = {
  entwurf: [
    { label: "Veröffentlichen", naechsterStatus: "veroeffentlicht", icon: Globe, variant: "default" },
  ],
  veroeffentlicht: [
    { label: "Auf Entwurf zurück", naechsterStatus: "entwurf", icon: EyeOff, variant: "outline" },
    { label: "Absagen", naechsterStatus: "abgesagt", icon: XCircle, variant: "destructive" },
  ],
  abgesagt: [],
  beendet: [],
};

export default function EventStatusAktion({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const router = useRouter();
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const aktionen = AKTIONEN[status as Status] ?? [];

  if (aktionen.length === 0) return null;

  async function statusAendern(naechsterStatus: Status) {
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ status: naechsterStatus })
      .eq("id", eventId);

    setLaedt(false);

    if (error) {
      setFehler("Status konnte nicht geändert werden.");
      return;
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Aktionen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {aktionen.map((aktion) => (
          <Button
            key={aktion.naechsterStatus}
            variant={aktion.variant}
            size="sm"
            className="w-full justify-start"
            disabled={laedt}
            onClick={() => statusAendern(aktion.naechsterStatus)}
          >
            <aktion.icon className="h-4 w-4 mr-2" />
            {aktion.label}
          </Button>
        ))}
        {fehler && <p className="text-xs text-destructive">{fehler}</p>}
      </CardContent>
    </Card>
  );
}
