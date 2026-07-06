"use client";

import { useState } from "react";
import { DownloadSimple, EnvelopeSimple, CalendarPlus, CircleNotch, CheckCircle } from "@phosphor-icons/react";

export default function TicketAktionen({ buchungId }: { buchungId: string }) {
  const [sendet, setSendet] = useState(false);
  const [gesendet, setGesendet] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function erneutSenden() {
    setSendet(true);
    setFehler(null);
    const res = await fetch(`/api/buchung/${buchungId}/erneut-senden`, { method: "POST" });
    setSendet(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setFehler(data.error ?? "Senden fehlgeschlagen."); return; }
    setGesendet(data.an ?? "");
  }

  const btn = "flex-1 h-11 rounded-xl border border-input bg-background hover:bg-muted text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors";

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <a href={`/api/buchung/${buchungId}/pdf`} className={btn}>
          <DownloadSimple className="h-4 w-4" /> PDF herunterladen
        </a>
        <button type="button" onClick={erneutSenden} disabled={sendet || !!gesendet} className={btn}>
          {sendet
            ? <><CircleNotch className="h-4 w-4 animate-spin" /> Sende…</>
            : gesendet
              ? <><CheckCircle className="h-4 w-4 text-green-600" /> Gesendet an {gesendet}</>
              : <><EnvelopeSimple className="h-4 w-4" /> Erneut per E-Mail senden</>}
        </button>
        <a href={`/api/buchung/${buchungId}/kalender`} className={btn}>
          <CalendarPlus className="h-4 w-4" /> Zum Kalender
        </a>
      </div>
      {fehler && (
        <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fehler}</p>
      )}
    </div>
  );
}
