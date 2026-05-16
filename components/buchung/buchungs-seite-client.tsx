"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, ChevronUp, ChevronDown, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
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
  ticketTypId: string | null;
  extraFelder: Record<string, string>;
};

type Schritt = "auswahl" | "zusammenfassung";

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

/* ─── Segmented floor picker ───────────────────────────────────────────────── */
function FloorPicker({ floors, aktiv, onWechseln, floorLabel }: {
  floors: Floor[]; aktiv: number;
  onWechseln: (idx: number) => void;
  floorLabel: (f: Floor, i: number) => string;
}) {
  return (
    <div className="relative flex bg-muted/60 rounded-2xl p-1">
      <div aria-hidden className="absolute top-1 bottom-1 rounded-[14px] bg-background shadow-[0_1px_4px_rgba(0,0,0,0.10)] border border-black/[0.06] pointer-events-none"
        style={{
          transition: "left 220ms cubic-bezier(0.4,0,0.2,1), width 220ms cubic-bezier(0.4,0,0.2,1)",
          left: `calc(4px + ${aktiv} * ((100% - 8px) / ${floors.length}))`,
          width: `calc((100% - 8px) / ${floors.length})`,
        }} />
      {floors.map((floor, idx) => (
        <button key={floor.id} type="button" onClick={() => onWechseln(idx)}
          className="relative z-10 flex-1 py-2 px-4 text-sm font-medium rounded-[14px] text-center select-none">
          <span style={{ transition: "color 220ms cubic-bezier(0.4,0,0.2,1)", color: idx === aktiv ? "var(--foreground)" : "var(--muted-foreground)" }}>
            {floorLabel(floor, idx)}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─── Per-seat type selector with extra fields ─────────────────────────────── */
function SitzTypSelector({ sitz, ticketTypen, onTypChange, onFeldChange }: {
  sitz: AusgewaehlterSitz;
  ticketTypen: TicketTyp[];
  onTypChange: (typId: string | null) => void;
  onFeldChange: (label: string, value: string) => void;
}) {
  const gewaehlterTyp = ticketTypen.find((t) => t.id === sitz.ticketTypId) ?? null;

  return (
    <div className="space-y-1.5">
      <select
        value={sitz.ticketTypId ?? ""}
        onChange={(e) => onTypChange(e.target.value || null)}
        className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">Normalpreis</option>
        {ticketTypen.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {t.preis_regel.typ === "basis" ? "Normalpreis" : regelLabel(t.preis_regel)}
          </option>
        ))}
      </select>
      {gewaehlterTyp?.pflichtfelder && gewaehlterTyp.pflichtfelder.length > 0 && (
        <div className="space-y-1 pl-2 border-l-2 border-primary/30">
          {gewaehlterTyp.pflichtfelder.map((feld: PflichtFeld) => (
            <div key={feld.id}>
              {feld.typ === "auswahl" && feld.optionen?.length ? (
                <select
                  value={sitz.extraFelder[feld.label] ?? ""}
                  onChange={(e) => onFeldChange(feld.label, e.target.value)}
                  className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none"
                >
                  <option value="">— {feld.label}{feld.pflicht ? " *" : ""} —</option>
                  {feld.optionen.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input
                  type={feld.typ === "email" ? "email" : feld.typ === "zahl" ? "number" : "text"}
                  placeholder={`${feld.label}${feld.pflicht ? " *" : ""}`}
                  value={sitz.extraFelder[feld.label] ?? ""}
                  onChange={(e) => onFeldChange(feld.label, e.target.value)}
                  className="h-7 text-xs"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */
export default function BuchungsSeiteClient({
  eventId, floors, belegteSitzIds, serviceGebuehrCent, ticketTypen = [],
}: Props) {
  const mehrereEbenen = floors.length > 1;
  const hatTypen = ticketTypen.length > 0;

  const [aktiverFloorIdx, setAktiverFloorIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [ausgewaehlt, setAusgewaehlt] = useState<AusgewaehlterSitz[]>([]);
  const [belegte, setBelegte] = useState<Set<string>>(new Set(belegteSitzIds));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [drawerOffen, setDrawerOffen] = useState(false);
  const [schritt, setSchritt] = useState<Schritt>("auswahl");

  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [desktopRenderScale, setDesktopRenderScale] = useState(1);
  const [mobileRenderScale, setMobileRenderScale] = useState(1);

  const aktiverFloor = floors[aktiverFloorIdx] ?? floors[0];

  function switchFloor(idx: number) {
    if (idx === aktiverFloorIdx) return;
    setFading(true);
    setTimeout(() => { setAktiverFloorIdx(idx); setFading(false); }, 140);
  }

  const floorLabel = (floor: Floor, idx: number) =>
    floor.name ?? (floors.length === 1 ? "Sitzplan" : `Ebene ${idx + 1}`);

  useEffect(() => {
    const makeUpdater = (ref: React.RefObject<HTMLDivElement | null>, setter: (v: number) => void) => () => {
      if (!ref.current) return;
      setter(Math.min(1, ref.current.offsetWidth / aktiverFloor.konfiguration.breite));
    };
    const updateDesktop = makeUpdater(desktopContainerRef, setDesktopRenderScale);
    const updateMobile = makeUpdater(mobileContainerRef, setMobileRenderScale);
    updateDesktop(); updateMobile();
    const rod = new ResizeObserver(updateDesktop);
    const rom = new ResizeObserver(updateMobile);
    if (desktopContainerRef.current) rod.observe(desktopContainerRef.current);
    if (mobileContainerRef.current) rom.observe(mobileContainerRef.current);
    return () => { rod.disconnect(); rom.disconnect(); };
  }, [aktiverFloor.konfiguration.breite]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`tickets-${eventId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets", filter: `event_id=eq.${eventId}` },
        (payload) => {
          const sitzId = (payload.new as { sitzplatz_id: string }).sitzplatz_id;
          setBelegte((prev) => new Set([...prev, sitzId]));
          setAusgewaehlt((prev) => prev.filter((s) => s.sitzId !== sitzId));
        }
      ).subscribe();
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

  const onSitzKlicken = useCallback((sitzId: string) => {
    const floorId = aktiverFloor.id;
    setAusgewaehlt((prev) => {
      const istDrin = prev.some((s) => s.sitzId === sitzId && s.floorId === floorId);
      if (istDrin) return prev.filter((s) => !(s.sitzId === sitzId && s.floorId === floorId));
      const katId = aktiverFloorMap.sitzKategorie.get(sitzId) ?? aktiverFloor.konfiguration.kategorien[0]?.id ?? "";
      const kat = aktiverFloorMap.kategorienMap.get(katId);
      if (!kat) return prev;
      return [...prev, { sitzId, floorId, kategorie: kat, ticketTypId: null, extraFelder: {} }];
    });
  }, [aktiverFloor, aktiverFloorMap]);

  function updateSitzTyp(sitzId: string, typId: string | null) {
    setAusgewaehlt((prev) => prev.map((s) => s.sitzId === sitzId ? { ...s, ticketTypId: typId, extraFelder: {} } : s));
  }
  function updateSitzFeld(sitzId: string, label: string, value: string) {
    setAusgewaehlt((prev) => prev.map((s) => s.sitzId === sitzId ? { ...s, extraFelder: { ...s.extraFelder, [label]: value } } : s));
  }

  function sitzPreis(s: AusgewaehlterSitz): number {
    const typ = ticketTypen.find((t) => t.id === s.ticketTypId);
    if (!typ) return s.kategorie.preis_cent;
    return preisNachRegel(s.kategorie.preis_cent, typ.preis_regel);
  }

  const gesamtPreisCent =
    ausgewaehlt.reduce((sum, s) => sum + sitzPreis(s), 0) +
    ausgewaehlt.length * serviceGebuehrCent;

  function validiereSchritt1(): string | null {
    if (ausgewaehlt.length === 0) return "Bitte mindestens einen Sitzplatz wählen.";
    if (!name.trim()) return "Bitte deinen Namen eingeben.";
    if (!email.trim()) return "Bitte deine E-Mail eingeben.";
    for (const s of ausgewaehlt) {
      const typ = ticketTypen.find((t) => t.id === s.ticketTypId);
      if (!typ) continue;
      for (const feld of typ.pflichtfelder.filter((f) => f.pflicht)) {
        if (!s.extraFelder[feld.label]?.trim()) {
          return `Pflichtfeld „${feld.label}" für ${s.sitzId} (${typ.name}) fehlt.`;
        }
      }
    }
    return null;
  }

  function weiter(e: React.FormEvent) {
    e.preventDefault();
    const fehlerMsg = validiereSchritt1();
    if (fehlerMsg) { setFehler(fehlerMsg); return; }
    setFehler(null);
    setSchritt("zusammenfassung");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function zahlungspflichtigBestellen() {
    setLaedt(true);
    setFehler(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        sitzplaetze: ausgewaehlt.map((s) => {
          const typ = ticketTypen.find((t) => t.id === s.ticketTypId) ?? null;
          return {
            sitzId: s.sitzId,
            kategorieId: s.kategorie.id,
            preisCent: sitzPreis(s),
            kategorieName: s.kategorie.name,
            bezeichnung: typ ? `${typ.name} · ${s.sitzId}` : `${s.kategorie.name} · ${s.sitzId}`,
            ticketTyp: typ ? { id: typ.id, name: typ.name, extra_felder: s.extraFelder } : null,
          };
        }),
        name, email,
      }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (!res.ok || !data.url) { setFehler(data.error ?? "Fehler beim Starten des Checkouts."); setLaedt(false); return; }
    window.location.href = data.url;
  }

  const alleKategorien = aktiverFloor.konfiguration.kategorien;

  const canvasWrapper = (ref: React.RefObject<HTMLDivElement | null>, scale: number) => (
    <div ref={ref} className="w-full rounded-xl border border-border shadow-sm overflow-hidden"
      style={{ transition: "opacity 140ms ease-in-out", opacity: fading ? 0 : 1 }}>
      <SitzplanCanvas konfiguration={aktiverFloor.konfiguration} modus="buchung"
        renderScale={scale} belegteSitze={belegte} ausgewaehlteSitze={ausgewaehlteIdsAktiverFloor}
        onSitzKlicken={onSitzKlicken} />
    </div>
  );

  /* ── Step 1: Selection form ─────────────────────────────────────────────── */
  const auswahlFormular = (
    <form onSubmit={weiter} className="space-y-3">
      {/* Seat list with per-seat type selectors */}
      {ausgewaehlt.length > 0 && (
        <div className="space-y-3">
          {ausgewaehlt.map((s) => {
            const floorIdx = floors.findIndex((f) => f.id === s.floorId);
            const floor = floors[floorIdx];
            const typPreis = sitzPreis(s);
            const rabattAktiv = typPreis !== s.kategorie.preis_cent;
            return (
              <div key={`${s.floorId}-${s.sitzId}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.kategorie.farbe }} />
                    <span className="font-medium font-mono">{s.sitzId}</span>
                    <span className="text-muted-foreground text-xs">
                      {s.kategorie.name}
                      {mehrereEbenen && floor && <span className="ml-1 opacity-60">· {floorLabel(floor, floorIdx)}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums">
                      {rabattAktiv && (
                        <span className="line-through text-muted-foreground text-xs mr-1">
                          {euro(s.kategorie.preis_cent)}
                        </span>
                      )}
                      {euro(typPreis)}
                    </span>
                    <button type="button" onClick={() => onSitzKlicken(s.sitzId)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors p-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {hatTypen && (
                  <SitzTypSelector
                    sitz={s} ticketTypen={ticketTypen}
                    onTypChange={(typId) => updateSitzTyp(s.sitzId, typId)}
                    onFeldChange={(label, value) => updateSitzFeld(s.sitzId, label, value)}
                  />
                )}
              </div>
            );
          })}

          <div className="border-t border-border pt-2 space-y-0.5 text-sm">
            {serviceGebuehrCent > 0 && (
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Servicegebühr ({ausgewaehlt.length}×)</span>
                <span>{euro(ausgewaehlt.length * serviceGebuehrCent)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Gesamt</span>
              <span>{euro(gesamtPreisCent)}</span>
            </div>
          </div>
        </div>
      )}

      {ausgewaehlt.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Klicke auf einen freien Platz im Sitzplan.</p>
      )}

      {/* Name + Email */}
      <div className="space-y-1.5 pt-1">
        <Label htmlFor="name" className="text-xs">Name *</Label>
        <Input id="name" placeholder="Vor- und Nachname" value={name}
          onChange={(e) => setName(e.target.value)} required className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs">E-Mail *</Label>
        <Input id="email" type="email" placeholder="deine@email.de" value={email}
          onChange={(e) => setEmail(e.target.value)} required className="h-9" />
      </div>

      {fehler && <p className="text-xs text-destructive bg-destructive/5 rounded-md px-3 py-2">{fehler}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={ausgewaehlt.length === 0}>
        {ausgewaehlt.length === 0
          ? "Platz im Sitzplan wählen"
          : `Weiter zur Bestellübersicht →`}
      </Button>
    </form>
  );

  /* ── Step 2: Order review (§312j BGB) ──────────────────────────────────── */
  const bestelluebersicht = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        Bestellübersicht
      </div>

      {/* Seat table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Platz</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Typ</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Preis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ausgewaehlt.map((s) => {
              const typ = ticketTypen.find((t) => t.id === s.ticketTypId);
              return (
                <tr key={s.sitzId}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium font-mono text-sm">{s.sitzId}</p>
                    <p className="text-xs text-muted-foreground">{s.kategorie.name}</p>
                    {typ && Object.entries(s.extraFelder).map(([label, val]) => (
                      <p key={label} className="text-xs text-muted-foreground/70">{label}: {val}</p>
                    ))}
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    {typ
                      ? <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{typ.name}</span>
                      : <span className="text-xs text-muted-foreground">Standard</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {sitzPreis(s) !== s.kategorie.preis_cent && (
                      <span className="line-through text-muted-foreground text-xs mr-1">{euro(s.kategorie.preis_cent)}</span>
                    )}
                    {euro(sitzPreis(s))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-border bg-muted/20">
            {serviceGebuehrCent > 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-1.5 text-xs text-muted-foreground">
                  Servicegebühr ({ausgewaehlt.length}×)
                </td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground text-right tabular-nums">
                  {euro(ausgewaehlt.length * serviceGebuehrCent)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={2} className="px-3 py-2.5 font-bold text-sm">Gesamtbetrag</td>
              <td className="px-3 py-2.5 font-bold text-sm text-right tabular-nums">{euro(gesamtPreisCent)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Buyer info */}
      <div className="rounded-xl border border-border px-4 py-3 text-sm space-y-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Käufer</p>
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground">{email}</p>
      </div>

      {fehler && <p className="text-xs text-destructive bg-destructive/5 rounded-md px-3 py-2">{fehler}</p>}

      {/* Legal payment button §312j BGB */}
      <Button
        onClick={zahlungspflichtigBestellen}
        disabled={laedt}
        size="lg"
        className="w-full gap-2 font-semibold"
      >
        {laedt
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Weiterleitung…</>
          : <><Lock className="h-4 w-4" /> Zahlungspflichtig bestellen</>}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Mit dem Klick auf „Zahlungspflichtig bestellen" wirst du zu unserem Zahlungsanbieter Stripe weitergeleitet.
        Deine Buchung wird erst nach erfolgreicher Zahlung bestätigt.
      </p>

      <button
        type="button"
        onClick={() => { setSchritt("auswahl"); setFehler(null); setLaedt(false); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Zurück zur Auswahl
      </button>
    </div>
  );

  /* ── Layout ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {/* Hide canvas in step 2 on mobile but keep it on desktop */}
          {mehrereEbenen && schritt === "auswahl" && (
            <FloorPicker floors={floors} aktiv={aktiverFloorIdx} onWechseln={switchFloor} floorLabel={floorLabel} />
          )}
          {schritt === "auswahl" && <Legende kategorien={alleKategorien} />}
          <div style={{ display: schritt === "zusammenfassung" ? "none" : undefined }}>
            {canvasWrapper(desktopContainerRef, desktopRenderScale)}
          </div>
          {schritt === "auswahl" && (
            <p className="text-xs text-muted-foreground">Sitze werden live gesperrt sobald jemand anderes bucht.</p>
          )}
          {schritt === "zusammenfassung" && (
            <div className="rounded-xl bg-muted/30 border border-border p-6 text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-green-600 mx-auto" />
              <p className="font-semibold">Bestellübersicht prüfen</p>
              <p className="text-sm text-muted-foreground">
                Überprüfe deine Auswahl rechts und klicke auf „Zahlungspflichtig bestellen".
              </p>
            </div>
          )}
        </div>
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {schritt === "auswahl" ? "Deine Auswahl" : "Bestellübersicht"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schritt === "auswahl" ? auswahlFormular : bestelluebersicht}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="lg:hidden space-y-3">
        {schritt === "auswahl" && (
          <>
            {mehrereEbenen && (
              <FloorPicker floors={floors} aktiv={aktiverFloorIdx} onWechseln={switchFloor} floorLabel={floorLabel} />
            )}
            <Legende kategorien={alleKategorien} />
            {canvasWrapper(mobileContainerRef, mobileRenderScale)}

            {/* Sticky bottom sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border shadow-xl">
              <button type="button"
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() => ausgewaehlt.length > 0 && setDrawerOffen((v) => !v)}>
                <div className="flex items-center gap-2">
                  {ausgewaehlt.length === 0
                    ? <span className="text-sm text-muted-foreground">Platz wählen</span>
                    : <>
                        <span className="text-sm font-semibold">{ausgewaehlt.length} Platz{ausgewaehlt.length > 1 ? "plätze" : ""}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{ausgewaehlt.map((a) => a.sitzId).join(", ")}</span>
                      </>}
                </div>
                <div className="flex items-center gap-3">
                  {ausgewaehlt.length > 0 && (
                    <span className="font-semibold text-sm">{euro(gesamtPreisCent)}</span>
                  )}
                  {ausgewaehlt.length > 0 && (drawerOffen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
                </div>
              </button>
              {drawerOffen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 max-h-[65vh] overflow-y-auto">
                  {auswahlFormular}
                </div>
              )}
              {!drawerOffen && ausgewaehlt.length > 0 && (
                <div className="px-4 pb-4">
                  <Button className="w-full" size="lg" onClick={() => setDrawerOffen(true)}>Zur Kasse →</Button>
                </div>
              )}
              <div className="h-safe-bottom" />
            </div>
            <div className="h-28" />
          </>
        )}

        {schritt === "zusammenfassung" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Bestellübersicht</h2>
            {bestelluebersicht}
          </div>
        )}
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
          {k.name} — {euro(k.preis_cent)}
        </span>
      ))}
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full shrink-0 bg-slate-300" />Belegt</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full shrink-0 bg-green-500" />Ausgewählt</span>
    </div>
  );
}
