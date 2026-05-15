"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";
import type { SitzplanKonfiguration, Preiskategorie } from "@/types/sitzplan";
import { alleSitze } from "@/types/sitzplan";

const SitzplanCanvas = dynamic(() => import("@/components/raumplan/sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-50 rounded-lg border border-border flex items-center justify-center text-sm text-muted-foreground">
      Sitzplan wird geladen…
    </div>
  ),
});

type Props = {
  eventId: string;
  sitzplanId: string;
  konfiguration: SitzplanKonfiguration;
  belegteSitzIds: string[];
  serviceGebuehrCent: number;
};

type AusgewaehlterSitz = {
  sitzId: string;
  kategorie: Preiskategorie;
};

export default function BuchungsSeiteClient({
  eventId,
  sitzplanId,
  konfiguration,
  belegteSitzIds,
  serviceGebuehrCent,
}: Props) {
  const [ausgewaehlt, setAusgewaehlt] = useState<AusgewaehlterSitz[]>([]);
  const [belegte, setBelegte] = useState<Set<string>>(new Set(belegteSitzIds));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  const kategorienMap = new Map<string, Preiskategorie>(
    konfiguration.kategorien.map((k) => [k.id, k])
  );

  const sitzKategorie = new Map<string, string>(
    alleSitze(konfiguration).map(({ sitzId, kategorieId }) => [sitzId, kategorieId])
  );

  // Realtime: Sitze live sperren sobald jemand anderes bucht
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tickets-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets", filter: `event_id=eq.${eventId}` },
        (payload) => {
          const sitzId = (payload.new as { sitz_id: string }).sitz_id;
          setBelegte((prev) => new Set([...prev, sitzId]));
          // Wenn wir diesen Sitz gerade ausgewählt hatten, entfernen
          setAusgewaehlt((prev) => prev.filter((s) => s.sitzId !== sitzId));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const ausgewaehlteIds = new Set(ausgewaehlt.map((s) => s.sitzId));

  const onSitzKlicken = useCallback(
    (sitzId: string) => {
      setAusgewaehlt((prev) => {
        const istDrin = prev.some((s) => s.sitzId === sitzId);
        if (istDrin) return prev.filter((s) => s.sitzId !== sitzId);
        const katId = sitzKategorie.get(sitzId) ?? konfiguration.kategorien[0]?.id ?? "";
        const kat = kategorienMap.get(katId);
        if (!kat) return prev;
        return [...prev, { sitzId, kategorie: kat }];
      });
    },
    [sitzKategorie, kategorienMap, konfiguration.kategorien]
  );

  const gesamtPreisCent =
    ausgewaehlt.reduce((s, a) => s + a.kategorie.preis_cent, 0) +
    ausgewaehlt.length * serviceGebuehrCent;

  async function buchen(e: React.FormEvent) {
    e.preventDefault();
    if (ausgewaehlt.length === 0) {
      setFehler("Bitte mindestens einen Sitzplatz wählen.");
      return;
    }
    setFehler(null);
    setLaedt(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        sitzplaetze: ausgewaehlt.map((a) => ({
          sitzId: a.sitzId,
          kategorieId: a.kategorie.id,
          preisCent: a.kategorie.preis_cent,
          kategorieName: a.kategorie.name,
        })),
        name,
        email,
      }),
    });

    const data = await res.json() as { url?: string; error?: string };

    if (!res.ok || !data.url) {
      setFehler(data.error ?? "Fehler beim Starten des Checkouts.");
      setLaedt(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Sitzplan */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex flex-wrap gap-3 text-xs">
          {konfiguration.kategorien.map((k) => (
            <span key={k.id} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: k.farbe }} />
              {k.name} — {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block bg-slate-300" />
            Belegt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block bg-green-500" />
            Ausgewählt
          </span>
        </div>

        <div className="rounded-xl border border-border shadow-sm overflow-auto">
          <SitzplanCanvas
            konfiguration={konfiguration}
            modus="buchung"
            belegteSitze={belegte}
            ausgewaehlteSitze={ausgewaehlteIds}
            onSitzKlicken={onSitzKlicken}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Sitzplan wird live aktualisiert — belegte Plätze werden sofort gesperrt.
        </p>
      </div>

      {/* Bestellübersicht + Formular */}
      <div>
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Deine Auswahl</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ausgewaehlt.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Klicke auf einen freien Platz im Sitzplan.
              </p>
            ) : (
              <div className="space-y-1.5">
                {ausgewaehlt.map((a) => (
                  <div key={a.sitzId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.kategorie.farbe }} />
                      <span className="font-medium">{a.sitzId}</span>
                      <span className="text-muted-foreground text-xs">{a.kategorie.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{(a.kategorie.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
                      <button onClick={() => onSitzKlicken(a.sitzId)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border pt-2 space-y-1 text-sm">
                  {serviceGebuehrCent > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Servicegebühr ({ausgewaehlt.length}×)</span>
                      <span>{(ausgewaehlt.length * serviceGebuehrCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Gesamt</span>
                    <span>{(gesamtPreisCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={buchen} className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Name *</Label>
                <Input id="name" placeholder="Vor- und Nachname" value={name}
                  onChange={(e) => setName(e.target.value)} required className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">E-Mail *</Label>
                <Input id="email" type="email" placeholder="deine@email.de" value={email}
                  onChange={(e) => setEmail(e.target.value)} required className="h-8 text-sm" />
              </div>
              {fehler && <p className="text-xs text-destructive">{fehler}</p>}
              <Button type="submit" className="w-full" disabled={laedt || ausgewaehlt.length === 0}>
                {laedt
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Weiter zur Zahlung…</>
                  : ausgewaehlt.length === 0
                    ? "Platz wählen"
                    : `${ausgewaehlt.length} Ticket${ausgewaehlt.length > 1 ? "s" : ""} — zur Kasse`}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Weiterleitung zu Stripe — sicher und verschlüsselt
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
