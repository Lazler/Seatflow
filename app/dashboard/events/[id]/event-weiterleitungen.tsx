"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowSquareOut as ExternalLink } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";

export default function EventWeiterleitungen({
  eventId,
  initialSuccessUrl,
  initialCancelUrl,
}: {
  eventId: string;
  initialSuccessUrl: string | null;
  initialCancelUrl: string | null;
}) {
  const t = useT();
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
          <ExternalLink className="h-4 w-4" /> {t.eventEinstellungen.weiterleitungen}
        </CardTitle>
        <CardDescription className="text-xs">
          {t.eventEinstellungen.weiterleitungenHinweis}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t.eventWeiterleitungen.nachZahlung}</Label>
          <Input
            placeholder={t.eventWeiterleitungen.successPlaceholder}
            value={successUrl}
            onChange={(e) => { setSuccessUrl(e.target.value); setGespeichert(false); }}
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            {t.eventWeiterleitungen.successHinweis}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t.eventWeiterleitungen.beiAbbrechen}</Label>
          <Input
            placeholder={t.eventWeiterleitungen.cancelPlaceholder}
            value={cancelUrl}
            onChange={(e) => { setCancelUrl(e.target.value); setGespeichert(false); }}
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            {t.eventWeiterleitungen.cancelHinweis}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={speichern} disabled={laedt}>
            {laedt ? t.eventForm.speichert : t.common.speichern}
          </Button>
          {gespeichert && <span className="text-xs text-green-600">{t.ticketDesigner.gespeichertCheck}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
