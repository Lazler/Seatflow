"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnvelopeSimple, X, CircleNotch, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { useT } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";

// „E-Mail an alle Gäste" — z. B. Beginn verschoben, geänderter Einlass.
export default function EventRundmail({ eventId, anzahlGaeste }: {
  eventId: string;
  anzahlGaeste: number;
}) {
  const t = useT();
  const [offen, setOffen] = useState(false);
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [ergebnis, setErgebnis] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function senden() {
    setLaedt(true);
    setFehler(null);
    const res = await fetch(`/api/events/${eventId}/rundmail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betreff, nachricht }),
    });
    setLaedt(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setFehler(data.error ?? t.eventRundmail.sendenFehlgeschlagen); return; }
    setErgebnis(
      fmt(t.eventRundmail.gesendet, { n: data.gesendet })
        + (data.fehlgeschlagen ? fmt(t.eventRundmail.fehlgeschlagen, { n: data.fehlgeschlagen }) : "")
        + "."
    );
  }

  function zuruecksetzen(o: boolean) {
    setOffen(o);
    if (!o) { setErgebnis(null); setFehler(null); setBetreff(""); setNachricht(""); }
  }

  return (
    <Dialog.Root open={offen} onOpenChange={zuruecksetzen}>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline" className="w-full" disabled={anzahlGaeste === 0}>
          <EnvelopeSimple className="h-3.5 w-3.5 mr-1.5" />
          {t.eventRundmail.button}{anzahlGaeste > 0 ? ` (${anzahlGaeste})` : ""}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-5 focus:outline-none animate-slide-up"
          aria-describedby={undefined}
        >
          <div className="flex items-start justify-between mb-1">
            <Dialog.Title className="text-base font-semibold flex items-center gap-2">
              <EnvelopeSimple className="h-4 w-4 text-primary" />
              {t.eventRundmail.titel}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground" aria-label={t.common.schliessen}>
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {ergebnis ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-green-600 mx-auto" />
              <p className="text-sm font-medium">{ergebnis}</p>
              <Dialog.Close asChild>
                <Button size="sm" variant="outline">{t.common.schliessen}</Button>
              </Dialog.Close>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {fmt(t.eventRundmail.intro, { n: anzahlGaeste })}
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.eventRundmail.betreff}</Label>
                  <Input value={betreff} maxLength={150}
                    onChange={(e) => setBetreff(e.target.value)}
                    placeholder={t.eventRundmail.betreffPlaceholder}
                    className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.eventRundmail.nachricht}</Label>
                  <textarea
                    value={nachricht} maxLength={5000} rows={6}
                    onChange={(e) => setNachricht(e.target.value)}
                    placeholder={t.eventRundmail.nachrichtPlaceholder}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  />
                </div>
              </div>
              {fehler && <p className="mt-3 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fehler}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm">{t.common.abbrechen}</Button>
                </Dialog.Close>
                <Button size="sm" onClick={senden}
                  disabled={laedt || betreff.trim().length < 3 || nachricht.trim().length < 10}>
                  {laedt
                    ? <><CircleNotch className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t.eventRundmail.sende}</>
                    : <><PaperPlaneTilt className="h-3.5 w-3.5 mr-1.5" /> {fmt(t.eventRundmail.sendenButton, { n: anzahlGaeste })}</>}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
