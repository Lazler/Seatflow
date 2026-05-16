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
import type { TicketTyp, PflichtFeld } from "@/types/ticket-typ";
import { preisNachRegel, regelLabel } from "@/types/ticket-typ";

const SitzplanCanvas = dynamic(() => import("@/components/raumplan/sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-sm text-muted-foreground"
      style={{ width: "100%", height: 200 }}>
      Sitzplan wird geladen…
    </div>
  ),
});

export type Floor = {
  id: string;
  name: string | null;
  sitzplanId: string;
  konfiguration: SitzplanKonfiguration;
};

type Props = {
  eventId: string;
  floors: Floor[];
  belegteSitzIds: string[];
  serviceGebuehrCent: number;
  ticketTypen?: TicketTyp[];
};

type AusgewaehlterSitz = {
  sitzId: string;
  floorId: string;
  kategorie: Preiskategorie;
};

/* ─── Segmented floor picker ──────────────────────────────────────────────── */
function FloorPicker({
  floors,
  aktiv,
  onWechseln,
  floorLabel,
}: {
  floors: Floor[];
  aktiv: number;
  onWechseln: (idx: number) => void;
  floorLabel: (f: Floor, i: number) => string;
}) {
  return (
    <div className="relative flex bg-muted/60 rounded-2xl p-1">
      {/* Sliding pill — smooth material-easing transition */}
      <div
        aria-hidden
        className="absolute top-1 bottom-1 rounded-[14px] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.10)] border border-black/[0.06] pointer-events-none"
        style={{
          transition: "left 220ms cubic-bezier(0.4,0,0.2,1), width 220ms cubic-bezier(0.4,0,0.2,1)",
          left:  `calc(4px + ${aktiv} * ((100% - 8px) / ${floors.length}))`,
          width: `calc((100% - 8px) / ${floors.length})`,
        }}
      />
      {floors.map((floor, idx) => (
        <button
          key={floor.id}
          type="button"
          onClick={() => onWechseln(idx)}
          className="relative z-10 flex-1 py-2 px-4 text-sm font-medium rounded-[14px] text-center select-none"
        >
          <span
            style={{
              transition: "color 220ms cubic-bezier(0.4,0,0.2,1)",
              color: idx === aktiv ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          >
            {floorLabel(floor, idx)}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function BuchungsSeiteClient({
  eventId,
  floors,
  belegteSitzIds,
  serviceGebuehrCent,
  ticketTypen = [],
}: Props) {
  const mehrereEbenen = floors.length > 1;
  const [aktiverFloorIdx, setAktiverFloorIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [ausgewaehlt, setAusgewaehlt] = useState<AusgewaehlterSitz[]>([]);
  const [belegte, setBelegte] = useState<Set<string>>(new Set(belegteSitzIds));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [drawerOffen, setDrawerOffen] = useState(false);
  const [gewaehlterTypId, setGewaehlterTypId] = useState<string | null>(
    ticketTypen.length === 1 ? ticketTypen[0].id : null
  );
  const [extraFelder, setExtraFelder] = useState<Record<string, string>>({});
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef  = useRef<HTMLDivElement>(null);
  const [desktopRenderScale, setDesktopRenderScale] = useState(1);
  const [mobileRenderScale,  setMobileRenderScale]  = useState(1);

  const aktiverFloor = floors[aktiverFloorIdx] ?? floors[0];

  function switchFloor(idx: number) {
    if (idx === aktiverFloorIdx) return;
    setFading(true);
    // Short fade-out, then swap content and fade back in
    setTimeout(() => { setAktiverFloorIdx(idx); setFading(false); }, 140);
  }

  const floorLabel = (floor: Floor, idx: number) =>
    floor.name ?? (floors.length === 1 ? "Sitzplan" : `Ebene ${idx + 1}`);

  useEffect(() => {
    const makeUpdater = (
      ref: React.RefObject<HTMLDivElement | null>,
      setter: (v: number) => void,
    ) => () => {
      if (!ref.current) return;
      setter(Math.min(1, ref.current.offsetWidth / aktiverFloor.konfiguration.breite));
    };
    const updateDesktop = makeUpdater(desktopContainerRef, setDesktopRenderScale);
    const updateMobile  = makeUpdater(mobileContainerRef,  setMobileRenderScale);
    updateDesktop(); updateMobile();
    const rod = new ResizeObserver(updateDesktop);
    const rom = new ResizeObserver(updateMobile);
    if (desktopContainerRef.current) rod.observe(desktopContainerRef.current);
    if (mobileContainerRef.current)  rom.observe(mobileContainerRef.current);
    return () => { rod.disconnect(); rom.disconnect(); };
  }, [aktiverFloor.konfiguration.breite]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tickets-${eventId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets", filter: `event_id=eq.${eventId}` },
        (payload) => {
          const sitzId = (payload.new as { sitzplatz_id: string }).sitzplatz_id;
          setBelegte((prev) => new Set([...prev, sitzId]));
          setAusgewaehlt((prev) => prev.filter((s) => s.sitzId !== sitzId));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const floorMaps = floors.map((floor) => ({
    id: floor.id,
    kategorienMap: new Map<string, Preiskategorie>(floor.konfiguration.kategorien.map((k) => [k.id, k])),
    sitzKategorie: new Map<string, string>(alleSitze(floor.konfiguration).map(({ sitzId, kategorieId }) => [sitzId, kategorieId])),
  }));

  const aktiverFloorMap = floorMaps[aktiverFloorIdx];
  const ausgewaehlteIdsAktiverFloor = new Set(
    ausgewaehlt.filter((s) => s.floorId === aktiverFloor.id).map((s) => s.sitzId)
  );

  const onSitzKlicken = useCallback(
    (sitzId: string) => {
      const floorId = aktiverFloor.id;
      setAusgewaehlt((prev) => {
        const istDrin = prev.some((s) => s.sitzId === sitzId && s.floorId === floorId);
        if (istDrin) return prev.filter((s) => !(s.sitzId === sitzId && s.floorId === floorId));
        const katId = aktiverFloorMap.sitzKategorie.get(sitzId) ?? aktiverFloor.konfiguration.kategorien[0]?.id ?? "";
        const kat = aktiverFloorMap.kategorienMap.get(katId);
        if (!kat) return prev;
        return [...prev, { sitzId, floorId, kategorie: kat }];
      });
    },
    [aktiverFloor, aktiverFloorMap]
  );

  const gewaehlterTyp = ticketTypen.find((t) => t.id === gewaehlterTypId) ?? null;

  function effektiverPreis(basisCent: number): number {
    if (!gewaehlterTyp) return basisCent;
    return preisNachRegel(basisCent, gewaehlterTyp.preis_regel);
  }

  const gesamtPreisCent =
    ausgewaehlt.reduce((s, a) => s + effektiverPreis(a.kategorie.preis_cent), 0) +
    ausgewaehlt.length * serviceGebuehrCent;

  async function buchen(e: React.FormEvent) {
    e.preventDefault();
    if (ausgewaehlt.length === 0) { setFehler("Bitte mindestens einen Sitzplatz wählen."); return; }
    if (ticketTypen.length > 0 && !gewaehlterTypId) { setFehler("Bitte einen Ticket-Typ wählen."); return; }
    // Validate required extra fields
    if (gewaehlterTyp) {
      for (const feld of gewaehlterTyp.pflichtfelder.filter((f) => f.pflicht)) {
        if (!extraFelder[feld.label]?.trim()) { setFehler(`Pflichtfeld: ${feld.label}`); return; }
      }
    }
    setFehler(null);
    setLaedt(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        sitzplaetze: ausgewaehlt.map((a) => ({
          sitzId: a.sitzId, kategorieId: a.kategorie.id,
          preisCent: effektiverPreis(a.kategorie.preis_cent),
          kategorieName: a.kategorie.name,
          bezeichnung: `${a.kategorie.name} · ${a.sitzId}`,
        })),
        name, email,
        ticketTyp: gewaehlterTyp ? { id: gewaehlterTyp.id, name: gewaehlterTyp.name, extra_felder: extraFelder } : null,
      }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (!res.ok || !data.url) { setFehler(data.error ?? "Fehler beim Starten des Checkouts."); setLaedt(false); return; }
    window.location.href = data.url;
  }

  const alleKategorien = aktiverFloor.konfiguration.kategorien;

  /* Canvas with fade transition */
  const canvasWrapper = (ref: React.RefObject<HTMLDivElement | null>, scale: number) => (
    <div
      ref={ref}
      className="w-full rounded-xl border border-border shadow-sm overflow-hidden"
      style={{ transition: "opacity 140ms ease-in-out", opacity: fading ? 0 : 1 }}
    >
      <SitzplanCanvas
        konfiguration={aktiverFloor.konfiguration}
        modus="buchung"
        renderScale={scale}
        belegteSitze={belegte}
        ausgewaehlteSitze={ausgewaehlteIdsAktiverFloor}
        onSitzKlicken={onSitzKlicken}
      />
    </div>
  );

  const formularInhalt = (
    <form onSubmit={buchen} className="space-y-3">
      {/* Ticket-Typ selector */}
      {ticketTypen.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Ticket-Typ *</Label>
          <div className="space-y-1.5">
            {ticketTypen.map((typ) => (
              <button
                key={typ.id}
                type="button"
                onClick={() => { setGewaehlterTypId(typ.id); setExtraFelder({}); }}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                  gewaehlterTypId === typ.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-input hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{typ.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {typ.preis_regel.typ === "basis"
                      ? "Normalpreis"
                      : regelLabel(typ.preis_regel)}
                  </span>
                </div>
                {typ.beschreibung && (
                  <p className="text-xs text-muted-foreground mt-0.5">{typ.beschreibung}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extra fields for selected type */}
      {gewaehlterTyp?.pflichtfelder && gewaehlterTyp.pflichtfelder.length > 0 && (
        <div className="space-y-2 rounded-lg bg-muted/40 p-3 border border-border">
          <p className="text-xs font-medium text-muted-foreground">Zusätzliche Angaben für „{gewaehlterTyp.name}"</p>
          {gewaehlterTyp.pflichtfelder.map((feld: PflichtFeld) => (
            <div key={feld.id} className="space-y-1">
              <Label className="text-xs">{feld.label}{feld.pflicht ? " *" : ""}</Label>
              {feld.typ === "auswahl" && feld.optionen?.length ? (
                <select
                  value={extraFelder[feld.label] ?? ""}
                  onChange={(e) => setExtraFelder((prev) => ({ ...prev, [feld.label]: e.target.value }))}
                  required={feld.pflicht}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Bitte wählen —</option>
                  {feld.optionen.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input
                  type={feld.typ === "email" ? "email" : feld.typ === "zahl" ? "number" : "text"}
                  value={extraFelder[feld.label] ?? ""}
                  onChange={(e) => setExtraFelder((prev) => ({ ...prev, [feld.label]: e.target.value }))}
                  required={feld.pflicht}
                  className="h-8 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

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
      {ausgewaehlt.map((a) => {
        const floorIdx = floors.findIndex((f) => f.id === a.floorId);
        const floor = floors[floorIdx];
        return (
          <div key={`${a.floorId}-${a.sitzId}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.kategorie.farbe }} />
              <span className="font-medium">{a.sitzId}</span>
              <span className="text-muted-foreground text-xs">
                {a.kategorie.name}
                {mehrereEbenen && floor && <span className="ml-1 opacity-60">· {floorLabel(floor, floorIdx)}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {gewaehlterTyp && gewaehlterTyp.preis_regel.typ !== "basis"
                  ? <>
                      <span className="line-through text-muted-foreground text-xs mr-1">
                        {(a.kategorie.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                      </span>
                      {(effektiverPreis(a.kategorie.preis_cent) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </>
                  : (a.kategorie.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })
                }
              </span>
              <button type="button" onClick={() => onSitzKlicken(a.sitzId)}
                className="text-muted-foreground hover:text-foreground p-0.5 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
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
      {/* ── Desktop ── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {mehrereEbenen && (
            <FloorPicker floors={floors} aktiv={aktiverFloorIdx} onWechseln={switchFloor} floorLabel={floorLabel} />
          )}
          <Legende kategorien={alleKategorien} />
          {canvasWrapper(desktopContainerRef, desktopRenderScale)}
          <p className="text-xs text-muted-foreground">Sitze werden live gesperrt sobald jemand anderes bucht.</p>
        </div>
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deine Auswahl</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ausgewaehlt.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-3">Klicke auf einen freien Platz.</p>
                : sitzlisteInhalt}
              {formularInhalt}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="lg:hidden space-y-3">
        {mehrereEbenen && (
          <FloorPicker floors={floors} aktiv={aktiverFloorIdx} onWechseln={switchFloor} floorLabel={floorLabel} />
        )}
        <Legende kategorien={alleKategorien} />
        {canvasWrapper(mobileContainerRef, mobileRenderScale)}

        {/* Sticky bottom sheet */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border shadow-xl">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => ausgewaehlt.length > 0 && setDrawerOffen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              {ausgewaehlt.length === 0
                ? <span className="text-sm text-muted-foreground">Platz im Sitzplan wählen</span>
                : <>
                    <span className="text-sm font-semibold">{ausgewaehlt.length} Platz{ausgewaehlt.length > 1 ? "plätze" : ""}</span>
                    <span className="text-xs text-muted-foreground">{ausgewaehlt.map((a) => a.sitzId).join(", ")}</span>
                  </>}
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
          {drawerOffen && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 max-h-[60vh] overflow-y-auto">
              {sitzlisteInhalt}
              {formularInhalt}
            </div>
          )}
          {!drawerOffen && ausgewaehlt.length > 0 && (
            <div className="px-4 pb-4">
              <Button className="w-full" size="lg" onClick={() => setDrawerOffen(true)}>Zur Kasse</Button>
            </div>
          )}
          <div className="h-safe-bottom" />
        </div>
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
        <span className="w-3 h-3 rounded-full shrink-0 bg-slate-300" />Belegt
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full shrink-0 bg-green-500" />Ausgewählt
      </span>
    </div>
  );
}
