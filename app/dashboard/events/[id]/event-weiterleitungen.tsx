"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowSquareOut as ExternalLink } from "@phosphor-icons/react";

export default function EventWeiterleitungen({
  eventId,
  initialSuccessUrl,
  initialCancelUrl,
}: {
  eventId: string;
  initialSuccessUrl: string | null;
  initialCancelUrl: string | null;
}) {
  const router = useRouter();
  const [successUrl, setSuccessUrl] = useState(initialSuccessUrl ?? "");
  const [cancelUrl, setCancelUrl] = useState(initialCancelUrl ?? "");
  const [laedt, setLaedt] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);

  async function speichern() {
    setLaedt(true);
    setGespeichert(false);
    const supabase = createClient();
    await supabase
      .from("events")
      .update({
        success_url: successUrl.trim() || null,
        cancel_url: cancelUrl.trim() || null,
      })
      .eq("id", eventId);
    setLaedt(false);
    setGespeichert(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ExternalLink className="h-4 w-4" /> Weiterleitungen
        </CardTitle>
        <CardDescription className="text-xs">
          Wohin kommt der Käufer nach der Buchung bzw. beim Abbrechen?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Nach erfolgreicher Zahlung</Label>
          <Input
            placeholder="https://deine-website.de/danke (leer = SeatFlow-Seite)"
            value={successUrl}
            onChange={(e) => { setSuccessUrl(e.target.value); setGespeichert(false); }}
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Leer lassen → Käufer sieht die SeatFlow-Bestätigungsseite mit QR-Code.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bei Abbrechen / „Zurück"</Label>
          <Input
            placeholder="https://deine-website.de/veranstaltungen (leer = Buchungsseite)"
            value={cancelUrl}
            onChange={(e) => { setCancelUrl(e.target.value); setGespeichert(false); }}
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Leer lassen → Käufer kehrt zur Sitzplan-Auswahl zurück.
          </p>
        </div>
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
