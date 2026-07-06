"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BellRinging } from "@phosphor-icons/react";

// Opt-in/out für Verkaufs-Benachrichtigungen (E-Mail bei jeder Buchung).
export default function Benachrichtigungen() {
  const [aktiv, setAktiv] = useState<boolean | null>(null);
  const [speichert, setSpeichert] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("veranstalter_profile")
        .select("benachrichtigung_verkauf")
        .eq("id", user.id)
        .single();
      setAktiv(data?.benachrichtigung_verkauf ?? true);
    });
  }, []);

  async function umschalten() {
    if (aktiv === null || speichert) return;
    const neu = !aktiv;
    setAktiv(neu);
    setSpeichert(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("veranstalter_profile")
        .update({ benachrichtigung_verkauf: neu })
        .eq("id", user.id);
    }
    setSpeichert(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <BellRinging className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Verkaufs-Benachrichtigungen</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              E-Mail bei jeder bezahlten Buchung — mit Gast, Plätzen und Umsatz.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={umschalten}
          disabled={aktiv === null}
          role="switch"
          aria-checked={aktiv ?? false}
          aria-label="Verkaufs-Benachrichtigungen umschalten"
          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 ${aktiv ? "bg-primary" : "bg-input"}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${aktiv ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>
    </div>
  );
}
