"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [erfolg, setErfolg] = useState(false);

  const belegte = new Set(belegteSitzIds);
  const ausgewaehlteIds = new Set(ausgewaehlt.map((s) => s.sitzId));

  const kategorienMap = new Map<string, Preiskategorie>(
    konfiguration.kategorien.map((k) => [k.id, k])
  );

  const sitzKategorie = new Map<string, string>(
    alleSitze(konfiguration).map(({ sitzId, kategorieId }) => [sitzId, kategorieId])
  );

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

    const supabase = createClient();

    // Buchung anlegen
    const { data: buchung, error: buchungsFehler } = await supabase
      .from("buchungen")
      .insert({
        event_id: eventId,
        gaest_name: name,
        gaest_email: email,
        gesamt_cent: gesamtPreisCent,
        status: "ausstehend",
      })
      .select("id")
      .single();

    if (buchungsFehler || !buchung) {
      setFehler("Buchung konnte nicht angelegt werden.");
      setLaedt(false);
      return;
    }

    // Tickets pro Sitz eintragen
    const ticketRows = ausgewaehlt.map((a) => ({
      buchung_id: buchung.id,
      event_id: eventId,
      sitz_id: a.sitzId,
      kategorie_id: a.kategorie.id,
      preis_cent: a.kategorie.preis_cent,
    }));

    const { error: ticketFehler } = await supabase.from("tickets").insert(ticketRows);

    if (ticketFehler) {
      // Buchung wieder löschen, falls Ticket-Insert fehlschlägt (z.B. Sitz bereits belegt)
      await supabase.from("buchungen").delete().eq("id", buchung.id);
      setFehler(
        ticketFehler.code === "23505"
          ? "Einer der gewählten Plätze wurde gerade von jemand anderem gebucht. Bitte neu wählen."
          : "Buchung konnte nicht abgeschlossen werden."
      );
      setLaedt(false);
      return;
    }

    setErfolg(true);
    setLaedt(false);
  }

  if (erfolg) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-bold">Buchung eingegangen!</h2>
        <p className="text-muted-foreground text-sm">
          Wir haben deine Anfrage erhalten. Du bekommst eine Bestätigung per E-Mail.
        </p>
        <div className="text-sm font-medium pt-2">
          {ausgewaehlt.map((a) => a.sitzId).join(", ")}
        </div>
      </div>
    );
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

        <div className="rounded-xl border border-border shadow-sm overflow-hidden"
          style={{ width: "100%", maxWidth: konfiguration.breite }}>
          <div style={{ transform: `scale(min(1, 100% / ${konfiguration.breite}))`, transformOrigin: "top left" }}>
            <SitzplanCanvas
              konfiguration={konfiguration}
              modus="buchung"
              belegteSitze={belegte}
              ausgewaehlteSitze={ausgewaehlteIds}
              onSitzKlicken={onSitzKlicken}
            />
          </div>
        </div>
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
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: a.kategorie.farbe }}
                      />
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
                <Input id="name" placeholder="Vor- und Nachname" value={name} onChange={(e) => setName(e.target.value)} required className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">E-Mail *</Label>
                <Input id="email" type="email" placeholder="deine@email.de" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-8 text-sm" />
              </div>
              {fehler && <p className="text-xs text-destructive">{fehler}</p>}
              <Button type="submit" className="w-full" disabled={laedt || ausgewaehlt.length === 0}>
                {laedt ? "Wird gebucht…" : ausgewaehlt.length === 0 ? "Platz wählen" : `${ausgewaehlt.length} Ticket${ausgewaehlt.length > 1 ? "s" : ""} buchen`}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Sichere Zahlung via Stripe
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
