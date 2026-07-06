"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKey, Copy, Check, ArrowsClockwise, CircleNotch, X } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toaster";

// Verwaltung der Scanner-PIN: Link + PIN ans Einlasspersonal geben,
// ohne den eigenen Account zu teilen.
export default function ScannerPinVerwaltung({ eventId, initialPin }: {
  eventId: string;
  initialPin: string | null;
}) {
  const router = useRouter();
  const [pin, setPin] = useState(initialPin);
  const [laedt, setLaedt] = useState(false);
  const [kopiert, setKopiert] = useState(false);

  const scanUrl = typeof window !== "undefined"
    ? `${window.location.origin}/scan/${eventId}`
    : `/scan/${eventId}`;

  async function generieren() {
    setLaedt(true);
    const res = await fetch(`/api/events/${eventId}/scanner-pin`, { method: "POST" });
    setLaedt(false);
    if (!res.ok) { toast.error("PIN konnte nicht erzeugt werden"); return; }
    const data = await res.json() as { pin: string };
    setPin(data.pin);
    toast.success("Neue Scanner-PIN erzeugt", "Die alte PIN ist ab sofort ungültig.");
    router.refresh();
  }

  async function entfernen() {
    setLaedt(true);
    await fetch(`/api/events/${eventId}/scanner-pin`, { method: "DELETE" });
    setLaedt(false);
    setPin(null);
    toast.success("Scanner-Zugang deaktiviert");
    router.refresh();
  }

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(`Ticket-Scanner: ${scanUrl}\nPIN: ${pin}`);
      setKopiert(true);
      toast.success("Kopiert", "Link + PIN liegen in der Zwischenablage.");
      setTimeout(() => setKopiert(false), 2000);
    } catch { toast.error("Kopieren nicht möglich", "Zwischenablage ist nicht verfügbar."); }
  }

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <p className="text-xs font-medium flex items-center gap-1.5">
        <LockKey className="h-3.5 w-3.5 text-primary" />
        Scanner-Zugang fürs Einlasspersonal
      </p>
      {pin ? (
        <>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-[0.3em] bg-muted rounded-lg px-3 py-1.5">
              {pin}
            </span>
            <button type="button" onClick={kopieren}
              title="Link + PIN kopieren"
              className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
              {kopiert ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
            <button type="button" onClick={generieren} disabled={laedt}
              title="Neue PIN erzeugen (alte wird ungültig)"
              className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
              {laedt ? <CircleNotch className="h-4 w-4 animate-spin" /> : <ArrowsClockwise className="h-4 w-4" />}
            </button>
            <button type="button" onClick={entfernen} disabled={laedt}
              title="PIN-Zugang deaktivieren"
              className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Personal öffnet den Scanner-Link und gibt die PIN ein — ganz ohne eigenen Account.
            „Kopieren" legt Link + PIN in die Zwischenablage.
          </p>
        </>
      ) : (
        <>
          <button type="button" onClick={generieren} disabled={laedt}
            className="h-9 px-3 rounded-lg border border-input hover:bg-muted text-xs font-medium inline-flex items-center gap-1.5">
            {laedt ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <LockKey className="h-3.5 w-3.5" />}
            PIN erzeugen
          </button>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ohne PIN kann nur dein Account scannen. Mit PIN scannt das Einlasspersonal
            selbständig — dein Login bleibt privat.
          </p>
        </>
      )}
    </div>
  );
}
