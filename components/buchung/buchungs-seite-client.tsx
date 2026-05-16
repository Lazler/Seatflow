"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import type { SitzplanKonfiguration, Preiskategorie } from "@/types/sitzplan";
import { alleSitze } from "@/types/sitzplan";

const SitzplanCanvas = dynamic(() => import("@/components/raumplan/sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ width: "100%", height: 200 }}>
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
  const [drawerOffen, setDrawerOffen] = useState(false);
  // Canvas-Skalierung: passt sich an Container an, aber nie über 1:1
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [desktopRenderScale, setDesktopRenderScale] = useState(1);
  const [mobileRenderScale, setMobileRenderScale] = useState(1);

  useEffect(() => {
    const makeUpdater = (
      ref: React.RefObject<HTMLDivElement | null>,
      setter: (v: number) => void,
    ) => () => {
      if (!ref.current) return;
      setter(Math.min(1, ref.current.offsetWidth / konfiguration.breite));
    };
    const updateDesktop = makeUpdater(desktopContainerRef, setDesktopRenderScale);
    const updateMobile  = makeUpdater(mobileContainerRef,  setMobileRenderScale);
    updateDesktop(); updateMobile();
    const rod = new ResizeObserver(updateDesktop);
    const rom = new ResizeObserver(updateMobile);
    if (desktopContainerRef.current) rod.observe(desktopContainerRef.current);
    if (mobileContainerRef.current)  rom.observe(mobileContainerRef.current);
    return () => { rod.disconnect(); rom.disconnect(); };
  }, [konfiguration.breite]);

  const kategorienMap = new Map<string, Preiskategorie>(
    konfiguration.kategorien.map((k) => [k.id, k])
  );
  const sitzKategorie = new Map<string, string>(
    alleSitze(konfiguration).map(({ sitzId, kategorieId }) => [sitzId, kategorieId])
  );

  // Realtime: Sitze live sperren
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

  const formularInhalt = (
    <form onSubmit={buchen} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs">Name *</Label>
        <Input id="name" placeholder="Vor- und Nachname" value={name}
          onChange={(e) => setName(e.target.value)} required className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs">E-Mail *</Label>
        <Input id="email" type="email" placeholder="deine@email.de" value={email}
          onChange={(e) => setEmail(e.target.value)} required className="h-9" />
      </div>
      {fehler && <p className="text-xs text-destructive">{fehler}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={laedt || ausgewaehlt.length === 0}>
        {laedt
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Weiter zur Zahlung…</>
          : ausgewaehlt.length === 0
            ? "Platz im Sitzplan wählen"
            : `${ausgewaehlt.length} Ticket${ausgewaehlt.length > 1 ? "s" : ""} — zur Kasse`}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Weiterleitung zu Stripe — sicher &amp; verschlüsselt
      </p>
    </form>
  );

  const sitzlisteInhalt = ausgewaehlt.length > 0 && (
    <div className="space-y-1 mb-3">
      {ausgewaehlt.map((a) => (
        <div key={a.sitzId} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.kategorie.farbe }} />
            <span className="font-medium">{a.sitzId}</span>
            <span className="text-muted-foreground text-xs">{a.kategorie.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{(a.kategorie.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
            <button type="button" onClick={() => onSitzKlicken(a.sitzId)}
              className="text-muted-foreground hover:text-foreground p-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <div className="border-t border-border pt-2 space-y-0.5 text-sm">
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
  );

  return (
    <>
      {/* ---- Desktop-Layout: 2/3 Canvas + 1/3 Sidebar ---- */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Legende kategorien={konfiguration.kategorien} />
          <div ref={desktopContainerRef} className="w-full rounded-xl border border-border shadow-sm overflow-hidden">
            <SitzplanCanvas
              konfiguration={konfiguration}
              modus="buchung"
              renderScale={desktopRenderScale}
              belegteSitze={belegte}
              ausgewaehlteSitze={ausgewaehlteIds}
              onSitzKlicken={onSitzKlicken}
            />
          </div>
          <p className="text-xs text-muted-foreground">Sitze werden live gesperrt sobald jemand anderes bucht.</p>
        </div>
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deine Auswahl</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ausgewaehlt.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Klicke auf einen freien Platz.
                </p>
              ) : sitzlisteInhalt}
              {formularInhalt}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---- Mobile-Layout: Canvas oben, Sticky-Bar unten ---- */}
      <div className="lg:hidden space-y-3">
        <Legende kategorien={konfiguration.kategorien} />
        <div ref={mobileContainerRef} className="w-full rounded-xl border border-border shadow-sm overflow-hidden">
          <SitzplanCanvas
            konfiguration={konfiguration}
            modus="buchung"
            renderScale={mobileRenderScale}
            belegteSitze={belegte}
            ausgewaehlteSitze={ausgewaehlteIds}
            onSitzKlicken={onSitzKlicken}
          />
        </div>

        {/* Sticky Bottom Sheet */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border shadow-xl">
          {/* Auswahl-Zusammenfassung + Toggle */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => ausgewaehlt.length > 0 && setDrawerOffen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              {ausgewaehlt.length === 0 ? (
                <span className="text-sm text-muted-foreground">Platz im Sitzplan wählen</span>
              ) : (
                <>
                  <span className="text-sm font-semibold">
                    {ausgewaehlt.length} Platz{ausgewaehlt.length > 1 ? "plätze" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ausgewaehlt.map((a) => a.sitzId).join(", ")}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {ausgewaehlt.length > 0 && (
                <span className="font-semibold text-sm">
                  {(gesamtPreisCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
              )}
              {ausgewaehlt.length > 0 && (drawerOffen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
            </div>
          </button>

          {/* Drawer-Inhalt */}
          {drawerOffen && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 max-h-[60vh] overflow-y-auto">
              {sitzlisteInhalt}
              {formularInhalt}
            </div>
          )}

          {/* Wenn Drawer zu: Direkt-Button */}
          {!drawerOffen && ausgewaehlt.length > 0 && (
            <div className="px-4 pb-4">
              <Button
                className="w-full"
                size="lg"
                onClick={() => setDrawerOffen(true)}
              >
                Zur Kasse
              </Button>
            </div>
          )}

          {/* Safe area für iPhone */}
          <div className="h-safe-bottom" />
        </div>
        {/* Platzhalter damit Content nicht hinter Sticky-Bar verschwindet */}
        <div className="h-28" />
      </div>
    </>
  );
}

function Legende({ kategorien }: { kategorien: { id: string; name: string; farbe: string; preis_cent: number }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
      {kategorien.map((k) => (
        <span key={k.id} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: k.farbe }} />
          {k.name} — {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full shrink-0 bg-slate-300" />
        Belegt
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full shrink-0 bg-green-500" />
        Ausgewählt
      </span>
    </div>
  );
}
