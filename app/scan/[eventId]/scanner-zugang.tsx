"use client";

import { useState } from "react";
import { LockKey, CircleNotch } from "@phosphor-icons/react";
import ScannerClient from "./scanner-client";

// PIN-Gate fürs Einlasspersonal: 6-stellige PIN statt Veranstalter-Login.
export default function ScannerZugang({ eventId, eventTitel }: {
  eventId: string;
  eventTitel: string;
}) {
  const [pin, setPin] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [zugang, setZugang] = useState<{ pin: string; gesamt: number; eingelassen: number } | null>(null);

  async function pruefen(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) { setFehler("Bitte die 6-stellige PIN eingeben."); return; }
    setLaedt(true);
    setFehler(null);
    const res = await fetch("/api/scan/zugang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, pin }),
    });
    setLaedt(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFehler(data.error ?? "Falsche PIN");
      return;
    }
    const data = await res.json() as { gesamt: number; eingelassen: number };
    setZugang({ pin, gesamt: data.gesamt, eingelassen: data.eingelassen });
  }

  if (zugang) {
    return (
      <ScannerClient
        eventId={eventId}
        eventTitel={eventTitel}
        gesamt={zugang.gesamt}
        initialEingelassen={zugang.eingelassen}
        pin={zugang.pin}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center px-8" style={{ height: "100dvh" }}>
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
        <LockKey className="h-7 w-7 text-white/80" />
      </div>
      <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em] mb-1">
        Ticket-Scanner
      </p>
      <h1 className="text-lg font-bold mb-1 text-center">{eventTitel}</h1>
      <p className="text-sm text-white/50 mb-6 text-center">
        Scanner-PIN vom Veranstalter eingeben
      </p>

      <form onSubmit={pruefen} className="w-full max-w-xs space-y-3">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setFehler(null); }}
          placeholder="••••••"
          aria-label="Scanner-PIN"
          className="w-full h-14 rounded-2xl bg-white/10 border border-white/15 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder:text-white/25 focus:outline-none focus:border-white/40"
        />
        {fehler && <p className="text-sm text-red-400 text-center">{fehler}</p>}
        <button
          type="submit"
          disabled={laedt || pin.length !== 6}
          className="w-full h-12 rounded-2xl bg-white text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99] transition"
        >
          {laedt ? <><CircleNotch className="h-4 w-4 animate-spin" /> Prüfe…</> : "Scanner starten"}
        </button>
      </form>
    </div>
  );
}
