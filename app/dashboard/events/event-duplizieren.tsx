"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, X, CircleNotch, CalendarPlus } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";

// Duplizieren-Dialog: 1 Termin = Kopie, mehrere Termine = Serie.
// Kopien entstehen immer als Entwurf und werden einzeln veröffentlicht.
export default function EventDuplizieren({ eventId, eventTitel }: {
  eventId: string;
  eventTitel: string;
}) {
  const t = useT();
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [termine, setTermine] = useState<string[]>([""]);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  function terminAendern(idx: number, wert: string) {
    setTermine((prev) => prev.map((t, i) => (i === idx ? wert : t)));
  }

  async function duplizieren() {
    const gueltige = termine.filter(Boolean).map((t) => new Date(t).toISOString());
    if (gueltige.length === 0) { setFehler(t.eventDuplizieren.mindestensEin); return; }
    setLaedt(true);
    setFehler(null);
    const res = await fetch(`/api/events/${eventId}/duplizieren`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termine: gueltige }),
    });
    setLaedt(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? t.eventDuplizieren.fehlgeschlagen);
      return;
    }
    setOffen(false);
    setTermine([""]);
    toast.success(
      gueltige.length > 1 ? fmt(t.eventDuplizieren.toastSerieTitel, { n: gueltige.length }) : t.eventDuplizieren.toastKopieTitel,
      t.eventDuplizieren.toastText
    );
    router.refresh();
  }

  return (
    <Dialog.Root open={offen} onOpenChange={setOffen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={t.eventDuplizieren.triggerTitle} aria-label={fmt(t.eventDuplizieren.ariaLabel, { titel: eventTitel })}>
          <Copy className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-card border border-border shadow-2xl p-5 focus:outline-none animate-slide-up"
          aria-describedby={undefined}
        >
          <div className="flex items-start justify-between mb-1">
            <Dialog.Title className="text-base font-semibold flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-primary" />
              {t.eventDuplizieren.titel}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground" aria-label={t.common.schliessen}>
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {fmt(t.eventDuplizieren.beschreibung, { titel: eventTitel })}
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {termine.map((termin, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={termin}
                  onChange={(e) => terminAendern(i, e.target.value)}
                  className="h-9 text-sm flex-1"
                />
                {termine.length > 1 && (
                  <button type="button" onClick={() => setTermine((p) => p.filter((_, x) => x !== i))}
                    className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0"
                    aria-label={t.eventDuplizieren.terminEntfernen}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button"
            onClick={() => setTermine((p) => (p.length < 30 ? [...p, ""] : p))}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
            <Plus className="h-3.5 w-3.5" /> {t.eventDuplizieren.terminHinzufuegen}
          </button>

          {fehler && <p className="mt-3 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fehler}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">{t.common.abbrechen}</Button>
            </Dialog.Close>
            <Button size="sm" onClick={duplizieren} disabled={laedt}>
              {laedt
                ? <><CircleNotch className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t.eventDuplizieren.erstelle}</>
                : termine.filter(Boolean).length > 1
                  ? fmt(t.eventDuplizieren.serieButton, { n: termine.filter(Boolean).length })
                  : t.eventDuplizieren.kopieButton}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
