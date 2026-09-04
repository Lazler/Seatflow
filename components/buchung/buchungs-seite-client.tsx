"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Check, CircleNotch as Loader2, CaretUp as ChevronUp, CaretDown as ChevronDown, ArrowLeft, Lock, ShieldCheck, Ticket, MapPin, Calendar, Timer, Sparkle as Sparkles, Wheelchair } from "@phosphor-icons/react";
import type { SitzplanKonfiguration, Preiskategorie } from "@/types/sitzplan";
import { alleSitze, elementSitzIds, floorSitzId, sitzGehoertZuFloor, aufInhaltZugeschnitten } from "@/types/sitzplan";
import type { TicketTyp, PflichtFeld } from "@/types/ticket-typ";
import { preisNachRegel, regelLabel } from "@/types/ticket-typ";
import type { Fruehbucher, EventAddon } from "@/types/event-extras";
import { fruehbucherPreis } from "@/types/event-extras";
import { BUCHUNG_STRINGS, fmt } from "@/lib/i18n/buchung";

const SitzplanCanvas = dynamic(() => import("@/components/raumplan/sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center text-sm text-muted-foreground rounded-xl border border-border"
      style={{ width: "100%", height: 200 }}>
      Sitzplan wird geladen…
    </div>
  ),
});

export type Floor = {
  id: string;
  name: string | null;
  translations?: Record<string, { name: string }> | null;
  sitzplanId: string;
  konfiguration: SitzplanKonfiguration;
};

type Props = {
  eventId: string;
  eventTitel?: string;
  eventDatum?: string;
  venueName?: string;
  floors: Floor[];
  belegteSitzIds: string[];
  serviceGebuehrCent: number;
  ticketTypen?: TicketTyp[];
  displayLang?: "de" | "en" | "hu";
  // Server-validierter, AKTIVER Frühbucher-Rabatt (null wenn abgelaufen/keiner)
  fruehbucher?: Fruehbucher | null;
  addons?: EventAddon[];
  // Vom Veranstalter konfiguriertes Limit (Default 8)
  maxProBuchung?: number;
};

type AusgewaehlterSitz = {
  sitzId: string;
  floorId: string;
  kategorie: Preiskategorie;
  ticketTypId: string | null;
  extraFelder: Record<string, string>;
};

type Schritt = "auswahl" | "kasse";

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

/* ─── E-Mail-Tippfehler-Erkennung ──────────────────────────────────────────── */
const BEKANNTE_DOMAINS = [
  "gmail.com", "googlemail.com", "web.de", "gmx.de", "gmx.at", "gmx.ch", "gmx.net",
  "outlook.com", "outlook.de", "hotmail.com", "hotmail.de", "yahoo.com", "yahoo.de",
  "icloud.com", "t-online.de", "freenet.de", "posteo.de", "protonmail.com", "proton.me",
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

// Liefert eine korrigierte E-Mail wenn die Domain wie ein Tippfehler einer
// bekannten Domain aussieht ("max@gmail.con" → "max@gmail.com"), sonst null
function emailKorrektur(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || BEKANNTE_DOMAINS.includes(domain)) return null;
  let beste: string | null = null;
  let besteDist = 3;
  for (const d of BEKANNTE_DOMAINS) {
    const dist = levenshtein(domain, d);
    if (dist > 0 && dist < besteDist) { besteDist = dist; beste = d; }
  }
  return beste ? `${local}@${beste}` : null;
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

// Radix Select erlaubt keinen leeren String als Item-Value.
const NORMALPREIS_WERT = "__normalpreis__";
const KEIN_FELD_WERT = "__kein_feld__";

/* ─── Per-seat type selector ───────────────────────────────────────────────── */
function SitzTypSelector({ sitz, ticketTypen, onTypChange, onFeldChange, displayLang }: {
  sitz: AusgewaehlterSitz;
  ticketTypen: TicketTyp[];
  onTypChange: (typId: string | null) => void;
  onFeldChange: (label: string, value: string) => void;
  displayLang?: "de" | "en" | "hu";
}) {
  const gewaehlterTyp = ticketTypen.find((t) => t.id === sitz.ticketTypId) ?? null;
  const tn = (t: TicketTyp) => (displayLang && displayLang !== "de" ? t.translations?.[displayLang]?.name || t.name : t.name);
  const normalpreis = displayLang === "en" ? "Standard price" : displayLang === "hu" ? "Normál ár" : "Normalpreis";

  return (
    <div className="space-y-1.5">
      <Select
        value={sitz.ticketTypId ?? NORMALPREIS_WERT}
        onValueChange={(v) => onTypChange(v === NORMALPREIS_WERT ? null : v)}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NORMALPREIS_WERT}>{normalpreis}</SelectItem>
          {ticketTypen.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {tn(t)} — {t.preis_regel.typ === "basis" ? normalpreis : regelLabel(t.preis_regel)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {gewaehlterTyp?.pflichtfelder && gewaehlterTyp.pflichtfelder.length > 0 && (
        <div className="space-y-1 pl-2 border-l-2 border-primary/30">
          {gewaehlterTyp.pflichtfelder.map((feld: PflichtFeld) => (
            <div key={feld.id}>
              {feld.typ === "auswahl" && feld.optionen?.length ? (
                <Select
                  value={sitz.extraFelder[feld.label] || KEIN_FELD_WERT}
                  onValueChange={(v) => onFeldChange(feld.label, v === KEIN_FELD_WERT ? "" : v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KEIN_FELD_WERT}>— {feld.label}{feld.pflicht ? " *" : ""} —</SelectItem>
                    {feld.optionen.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
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

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function BuchungsSeiteClient({
  eventId, eventTitel, eventDatum, venueName,
  floors, belegteSitzIds, serviceGebuehrCent, ticketTypen = [], displayLang,
  fruehbucher = null, addons = [], maxProBuchung = 8,
}: Props) {
  const uiStrings = BUCHUNG_STRINGS[displayLang ?? "de"];
  const mehrereEbenen = floors.length > 1;
  const hatTypen = ticketTypen.length > 0;

  function typName(typ: TicketTyp) {
    if (displayLang && displayLang !== "de") {
      return typ.translations?.[displayLang]?.name || typ.name;
    }
    return typ.name;
  }
  function typBeschreibung(typ: TicketTyp) {
    if (displayLang && displayLang !== "de") {
      return typ.translations?.[displayLang]?.beschreibung || typ.beschreibung;
    }
    return typ.beschreibung;
  }

  const [aktiverFloorIdx, setAktiverFloorIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [ausgewaehlt, setAusgewaehlt] = useState<AusgewaehlterSitz[]>([]);
  const [belegte, setBelegte] = useState<Set<string>>(new Set(belegteSitzIds));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [agbAkzeptiert, setAgbAkzeptiert] = useState(false);
  const [drawerOffen, setDrawerOffen] = useState(false);
  const [schritt, setSchritt] = useState<Schritt>("auswahl");
  const [schnellAnzahl, setSchnellAnzahl] = useState(2);
  const [emailVorschlag, setEmailVorschlag] = useState<string | null>(null);

  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [desktopRenderScale, setDesktopRenderScale] = useState(1);
  const [mobileRenderScale, setMobileRenderScale] = useState(1);

  const aktiverFloor = floors[aktiverFloorIdx] ?? floors[0];

  // Für die Anzeige auf den tatsächlichen Inhalt zuschneiden + zentrieren,
  // damit der ganze Plan sichtbar ist (unabhängig davon, wo er auf der
  // Leinwand angelegt wurde). Sitz-IDs bleiben identisch.
  const anzeigeKonfig = useMemo(
    () => aufInhaltZugeschnitten(aktiverFloor.konfiguration),
    [aktiverFloor],
  );

  function switchFloor(idx: number) {
    if (idx === aktiverFloorIdx) return;
    setFading(true);
    setTimeout(() => { setAktiverFloorIdx(idx); setFading(false); }, 140);
  }

  const floorLabel = (floor: Floor, idx: number) => {
    const translatedName = displayLang && displayLang !== "de"
      ? floor.translations?.[displayLang]?.name
      : null;
    const baseName = translatedName || floor.name;
    return baseName ?? (floors.length === 1 ? uiStrings.sitzplan ?? "Sitzplan" : `${uiStrings.ebene ?? "Ebene"} ${idx + 1}`);
  };

  useEffect(() => {
    const makeUpdater = (ref: React.RefObject<HTMLDivElement | null>, setter: (v: number) => void) => () => {
      if (!ref.current) return;
      const w = ref.current.offsetWidth;
      if (w <= 0) return;
      // Plan füllt die Containerbreite (crisp Vektor-Skalierung), moderat
      // gedeckelt, damit sehr kleine Pläne nicht grotesk aufgeblasen werden —
      // und mit einer UNTEREN Grenze, sonst werden Tischnummern/Labels bei
      // breiten Plänen auf schmalen Bildschirmen unleserlich klein. Wird der
      // Plan dadurch breiter als der Container, scrollt canvasWrapper
      // horizontal statt zu clippen.
      setter(Math.min(1.8, Math.max(0.55, w / anzeigeKonfig.breite)));
    };
    const updateDesktop = makeUpdater(desktopContainerRef, setDesktopRenderScale);
    const updateMobile = makeUpdater(mobileContainerRef, setMobileRenderScale);
    updateDesktop(); updateMobile();
    const rod = new ResizeObserver(updateDesktop);
    const rom = new ResizeObserver(updateMobile);
    if (desktopContainerRef.current) rod.observe(desktopContainerRef.current);
    if (mobileContainerRef.current) rom.observe(mobileContainerRef.current);
    return () => { rod.disconnect(); rom.disconnect(); };
  }, [anzeigeKonfig.breite]);

  useEffect(() => {
    const supabase = createClient();
    const namespaced = floors.length > 1;
    const channel = supabase.channel(`tickets-${eventId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets", filter: `event_id=eq.${eventId}` },
        (payload) => {
          const roh = (payload.new as { sitzplatz_id: string }).sitzplatz_id;
          setBelegte((prev) => new Set([...prev, roh]));
          setAusgewaehlt((prev) =>
            prev.filter((s) => floorSitzId(namespaced ? s.floorId : null, s.sitzId) !== roh)
          );
        }
      )
      // Sitz wurde freigegeben (abgelaufener Checkout, Storno) → neu laden
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "tickets" },
        async () => {
          try {
            const res = await fetch(`/api/events/${eventId}/occupied`);
            const json = await res.json() as { belegte?: string[] };
            if (Array.isArray(json.belegte)) setBelegte(new Set(json.belegte));
          } catch { /* nächster Reload korrigiert */ }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, floors.length]);

  // Stabil über Renders — sonst würde onSitzKlicken (Dep) und damit die
  // Sitz-Memoisierung im Canvas bei jedem Render neu erzeugt.
  const floorMaps = useMemo(() => floors.map((floor) => ({
    id: floor.id,
    kategorienMap: new Map<string, Preiskategorie>(floor.konfiguration.kategorien.map((k) => [k.id, k])),
    sitzKategorie: new Map<string, string>(alleSitze(floor.konfiguration).map(({ sitzId, kategorieId }) => [sitzId, kategorieId])),
  })), [floors]);

  const aktiverFloorMap = floorMaps[aktiverFloorIdx];
  const ausgewaehlteIdsAktiverFloor = useMemo(
    () => new Set(ausgewaehlt.filter((s) => s.floorId === aktiverFloor.id).map((s) => s.sitzId)),
    [ausgewaehlt, aktiverFloor.id],
  );

  // Belegte Sitze der aktiven Ebene (DB-IDs können floor-präfixiert sein;
  // Legacy-IDs ohne Präfix blockieren auf allen Ebenen).
  // Vom Veranstalter gesperrte Plätze zählen ebenfalls als belegt.
  const belegteAktiverFloor = useMemo(() => new Set([
    ...[...belegte]
      .filter((id) => sitzGehoertZuFloor(id, aktiverFloor.id))
      .map((id) => (id.includes(":") ? id.slice(id.lastIndexOf(":") + 1) : id)),
    ...(aktiverFloor.konfiguration.gesperrteSitze ?? []),
  ]), [belegte, aktiverFloor]);

  const onSitzKlicken = useCallback((sitzId: string) => {
    const floorId = aktiverFloor.id;
    setAusgewaehlt((prev) => {
      const istDrin = prev.some((s) => s.sitzId === sitzId && s.floorId === floorId);
      if (istDrin) return prev.filter((s) => !(s.sitzId === sitzId && s.floorId === floorId));
      if (prev.length >= maxProBuchung) {
        setFehler(fmt(BUCHUNG_STRINGS[displayLang ?? "de"].maxErreicht, { n: maxProBuchung }));
        return prev;
      }
      const katId = aktiverFloorMap.sitzKategorie.get(sitzId) ?? aktiverFloor.konfiguration.kategorien[0]?.id ?? "";
      const kat = aktiverFloorMap.kategorienMap.get(katId);
      if (!kat) return prev;
      setFehler(null);
      return [...prev, { sitzId, floorId, kategorie: kat, ticketTypId: null, extraFelder: {} }];
    });
  }, [aktiverFloor, aktiverFloorMap, maxProBuchung, displayLang]);

  // Explizites Entfernen aus der Auswahlliste — funktioniert unabhängig
  // davon, welche Ebene gerade aktiv ist (anders als onSitzKlicken)
  const entferneSitz = useCallback((floorId: string, sitzId: string) => {
    setAusgewaehlt((prev) => prev.filter((s) => !(s.sitzId === sitzId && s.floorId === floorId)));
  }, []);

  // ── Verfügbarkeit (gesperrte Plätze zählen nicht als verkäuflich) ──────────
  const gesperrtGesamt = floors.reduce((s, f) => s + (f.konfiguration.gesperrteSitze?.length ?? 0), 0);
  const gesamtPlaetze = Math.max(0,
    floors.reduce((s, f) => s + alleSitze(f.konfiguration).length, 0) - gesperrtGesamt);
  const freiePlaetze = Math.max(0, gesamtPlaetze - belegte.size);
  const wenigePlaetze = freiePlaetze > 0 && freiePlaetze <= Math.max(12, Math.round(gesamtPlaetze * 0.15));
  const ausverkauft = gesamtPlaetze > 0 && freiePlaetze === 0;

  // ── Schnellauswahl: beste n zusammenhängende Plätze nahe der Bühne ─────────
  function besteFreiePlaetzeWaehlen(n: number): boolean {
    const konf = aktiverFloor.konfiguration;
    const buehne = konf.buehne;
    let beste: { ids: string[]; score: number } | null = null;
    for (const el of konf.elemente) {
      if (el.typ !== "reihe") continue;
      const ids = elementSitzIds(el);
      const frei = ids.map(
        (id) => !belegteAktiverFloor.has(id) && !ausgewaehlteIdsAktiverFloor.has(id)
      );
      for (let i = 0; i + n <= ids.length; i++) {
        let ok = true;
        for (let j = i; j < i + n; j++) if (!frei[j]) { ok = false; break; }
        if (!ok) continue;
        // Nah an der Bühne + möglichst mittig in der Reihe
        const distanz = Math.hypot(el.x - buehne.x, el.y - buehne.y);
        const mittenVersatz = Math.abs(i + (n - 1) / 2 - (ids.length - 1) / 2);
        const score = distanz + mittenVersatz * 20;
        if (!beste || score < beste.score) beste = { ids: ids.slice(i, i + n), score };
      }
    }
    if (!beste) return false;
    if (ausgewaehlt.length + n > maxProBuchung) {
      setFehler(fmt(uiStrings.maxErreicht, { n: maxProBuchung }));
      return true; // Fehlermeldung gesetzt, keine "keine zusammenhängenden"-Meldung
    }
    const floorId = aktiverFloor.id;
    setAusgewaehlt((prev) => [
      ...prev,
      ...beste.ids.map((sitzId) => {
        const katId = aktiverFloorMap.sitzKategorie.get(sitzId) ?? konf.kategorien[0]?.id ?? "";
        const kat = aktiverFloorMap.kategorienMap.get(katId) ?? konf.kategorien[0];
        return { sitzId, floorId, kategorie: kat, ticketTypId: null, extraFelder: {} };
      }),
    ]);
    return true;
  }

  function updateSitzTyp(sitzId: string, typId: string | null) {
    setAusgewaehlt((prev) => prev.map((s) => s.sitzId === sitzId ? { ...s, ticketTypId: typId, extraFelder: {} } : s));
  }
  function updateSitzFeld(sitzId: string, label: string, value: string) {
    setAusgewaehlt((prev) => prev.map((s) => s.sitzId === sitzId ? { ...s, extraFelder: { ...s.extraFelder, [label]: value } } : s));
  }

  function sitzBasisPreis(s: AusgewaehlterSitz): number {
    const typ = ticketTypen.find((t) => t.id === s.ticketTypId);
    if (!typ) return s.kategorie.preis_cent;
    return preisNachRegel(s.kategorie.preis_cent, typ.preis_regel);
  }

  // Frühbucher-Rabatt greift NACH der Ticket-Typ-Regel
  function sitzPreis(s: AusgewaehlterSitz): number {
    const basis = sitzBasisPreis(s);
    return fruehbucher ? fruehbucherPreis(basis, fruehbucher) : basis;
  }

  // Add-on-Mengen (Schritt 2)
  const [addonMengen, setAddonMengen] = useState<Record<string, number>>({});
  function addonMenge(id: string) { return addonMengen[id] ?? 0; }
  function setzeAddonMenge(id: string, menge: number) {
    setAddonMengen((prev) => ({ ...prev, [id]: Math.max(0, Math.min(20, menge)) }));
  }
  const addonSummeCent = addons.reduce((s, a) => s + addonMenge(a.id) * a.preis_cent, 0);

  const ticketSummeCent = ausgewaehlt.reduce((sum, s) => sum + sitzPreis(s), 0);
  const gebuehrCent = ausgewaehlt.length * serviceGebuehrCent;
  const gesamtPreisCent = ticketSummeCent + gebuehrCent + addonSummeCent;

  function validiereTypFelder(): string | null {
    for (const s of ausgewaehlt) {
      const typ = ticketTypen.find((t) => t.id === s.ticketTypId);
      if (!typ) continue;
      for (const feld of typ.pflichtfelder.filter((f) => f.pflicht)) {
        if (!s.extraFelder[feld.label]?.trim()) {
          return fmt(uiStrings.fehlerPflichtfeld, { feld: feld.label, sitz: s.sitzId, typ: typName(typ) });
        }
      }
    }
    return null;
  }

  function weiter() {
    if (ausgewaehlt.length === 0) { setFehler(uiStrings.fehlerMindestens); return; }
    const typFehler = validiereTypFelder();
    if (typFehler) { setFehler(typFehler); return; }
    setFehler(null);
    setSchritt("kasse");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function zahlungspflichtigBestellen() {
    if (!name.trim()) { setFehler(uiStrings.fehlerName); return; }
    if (!email.trim() || !email.includes("@")) { setFehler(uiStrings.fehlerEmail); return; }
    if (!agbAkzeptiert) { setFehler(uiStrings.fehlerAgb); return; }
    setLaedt(true);
    setFehler(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        sitzplaetze: ausgewaehlt.map((s) => {
          const typ = ticketTypen.find((t) => t.id === s.ticketTypId) ?? null;
          const floorIdx = floors.findIndex((f) => f.id === s.floorId);
          const floor = floors[floorIdx];
          // Ebene in die menschenlesbare Bezeichnung aufnehmen (Ticket/E-Mail/Scanner)
          const ebenenTeil = mehrereEbenen && floor ? ` · ${floorLabel(floor, floorIdx)}` : "";
          return {
            // Bei Multi-Floor floor-qualifiziert, damit gleichnamige Reihen
            // auf verschiedenen Ebenen nicht kollidieren
            sitzId: floorSitzId(mehrereEbenen ? s.floorId : null, s.sitzId),
            kategorieId: s.kategorie.id,
            preisCent: sitzPreis(s),
            kategorieName: s.kategorie.name,
            bezeichnung: typ
              ? `${typName(typ)}${ebenenTeil} · ${s.sitzId}`
              : `${s.kategorie.name}${ebenenTeil} · ${s.sitzId}`,
            ticketTyp: typ ? { id: typ.id, name: typName(typ), extra_felder: s.extraFelder } : null,
          };
        }),
        name, email,
        sprache: displayLang ?? "de",
        addons: addons
          .filter((a) => addonMenge(a.id) > 0)
          .map((a) => ({ id: a.id, anzahl: addonMenge(a.id) })),
      }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (!res.ok || !data.url) { setFehler(data.error ?? uiStrings.fehlerCheckout); setLaedt(false); return; }
    window.location.assign(data.url);
  }

  const alleKategorien = aktiverFloor.konfiguration.kategorien;

  // Stabile Prop-Identitäten für den Canvas — sonst re-rendern bei jedem
  // Eltern-Render alle Sitze/Elemente (Memoisierung liefe ins Leere).
  const barrierefreieSitze = useMemo(
    () => new Set(aktiverFloor.konfiguration.barrierefreieSitze ?? []),
    [aktiverFloor],
  );
  const canvasTexte = useMemo(() => ({
    zoneFrei: uiStrings.zoneFrei,
    zoneGewaehlt: uiStrings.zoneGewaehlt,
    zoneHinzufuegen: uiStrings.zoneHinzufuegen,
    zoneAusverkauft: uiStrings.zoneAusverkauft,
    canvasAria: uiStrings.canvasAria,
    barrierefrei: uiStrings.barrierefrei,
    stehplatz: uiStrings.stehplatz,
    zoomVergroessern: uiStrings.zoomVergroessern,
    zoomVerkleinern: uiStrings.zoomVerkleinern,
    zoomReset: uiStrings.zoomReset,
  }), [uiStrings]);

  const canvasWrapper = (ref: React.RefObject<HTMLDivElement | null>, scale: number) => (
    <div ref={ref} className="w-full rounded-xl border border-border shadow-sm overflow-x-auto overflow-y-hidden flex justify-center bg-[#fbfcfe]"
      style={{ transition: "opacity 140ms ease-in-out", opacity: fading ? 0 : 1 }}>
      <SitzplanCanvas konfiguration={anzeigeKonfig} modus="buchung"
        renderScale={scale} belegteSitze={belegteAktiverFloor} ausgewaehlteSitze={ausgewaehlteIdsAktiverFloor}
        onSitzKlicken={onSitzKlicken}
        barrierefreieSitze={barrierefreieSitze}
        texte={canvasTexte} />
    </div>
  );

  // Frühbucher-Badge (Server hat Gültigkeit bereits geprüft)
  const fruehbucherBadge = fruehbucher ? (
    <div className="flex items-center gap-2 rounded-xl bg-primary/8 border border-primary/25 px-4 py-2.5">
      <Timer className="h-4 w-4 text-primary shrink-0" />
      <p className="text-sm font-medium text-primary">
        {fmt(uiStrings.fruehbucherBadge, {
          p: fruehbucher.prozent,
          datum: new Date(fruehbucher.bis).toLocaleDateString(
            displayLang === "hu" ? "hu-HU" : displayLang === "en" ? "en-GB" : "de-DE",
            { day: "numeric", month: "long" }),
        })}
      </p>
    </div>
  ) : null;

  // Verknappungs-Banner (echte Zahlen, kein Fake-Marketing)
  const verfuegbarkeitsBanner = ausverkauft ? (
    <div className="flex items-center gap-2 rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-2.5">
      <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
      <p className="text-sm font-semibold text-destructive">{uiStrings.ausverkauft}</p>
    </div>
  ) : wenigePlaetze ? (
    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
      <p className="text-sm font-medium text-amber-800">
        {freiePlaetze === 1 ? uiStrings.nurNochEin : fmt(uiStrings.nurNoch, { n: freiePlaetze })}
      </p>
    </div>
  ) : null;

  /* ── Step 1: Seat selection ─────────────────────────────────────────────── */
  const sitzAuswahl = (
    <div className="space-y-3">
      {ausgewaehlt.length > 0 && (
        <div className="space-y-2">
          {ausgewaehlt.map((s) => {
            const floorIdx = floors.findIndex((f) => f.id === s.floorId);
            const floor = floors[floorIdx];
            const typPreis = sitzPreis(s);
            const hatRabatt = typPreis !== s.kategorie.preis_cent;
            return (
              <div key={`${s.floorId}-${s.sitzId}`} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.kategorie.farbe }} />
                    <span className="font-medium text-sm font-mono">{s.sitzId}</span>
                    <span className="text-muted-foreground text-xs">
                      {s.kategorie.name}
                      {mehrereEbenen && floor && <span className="opacity-60 ml-1">· {floorLabel(floor, floorIdx)}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hatRabatt && <span className="line-through text-muted-foreground text-xs">{euro(s.kategorie.preis_cent)}</span>}
                    <span className="text-sm tabular-nums font-medium">{euro(typPreis)}</span>
                    <button type="button" onClick={() => entferneSitz(s.floorId, s.sitzId)}
                      aria-label={fmt(uiStrings.entfernen, { id: s.sitzId })}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors ml-1 p-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {hatTypen && (
                  <SitzTypSelector sitz={s} ticketTypen={ticketTypen}
                    onTypChange={(id) => updateSitzTyp(s.sitzId, id)}
                    onFeldChange={(label, val) => updateSitzFeld(s.sitzId, label, val)}
                    displayLang={displayLang} />
                )}
              </div>
            );
          })}

          <div className="border-t border-dashed border-border pt-2 space-y-0.5">
            {serviceGebuehrCent > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{uiStrings.servicegebuehr} ({ausgewaehlt.length}×)</span>
                <span>{euro(gebuehrCent)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-sm pt-0.5">
              <span>{uiStrings.gesamtpreis}</span>
              <span>{euro(gesamtPreisCent)}</span>
            </div>
          </div>
        </div>
      )}

      {ausgewaehlt.length === 0 && !ausverkauft && (
        <div className="py-3 space-y-4">
          <p className="text-sm text-muted-foreground text-center">{uiStrings.klickeHinweis}</p>
          {/* Schnellauswahl */}
          <div className="rounded-xl border border-dashed border-border p-3 space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground text-center">
              {uiStrings.schnellauswahl}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setSchnellAnzahl((v) => Math.max(1, v - 1))}
                aria-label={uiStrings.wenigerPlaetze}
                className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                disabled={schnellAnzahl <= 1}>−</button>
              <span className="w-16 text-center text-sm font-semibold tabular-nums">
                {schnellAnzahl} {schnellAnzahl === 1 ? uiStrings.platz : uiStrings.plaetze}
              </span>
              <button type="button" onClick={() => setSchnellAnzahl((v) => Math.min(8, v + 1))}
                aria-label={uiStrings.mehrPlaetze}
                className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                disabled={schnellAnzahl >= Math.min(8, maxProBuchung)}>+</button>
            </div>
            <button type="button"
              onClick={() => {
                setFehler(null);
                if (!besteFreiePlaetzeWaehlen(schnellAnzahl)) {
                  setFehler(fmt(uiStrings.keineZusammenhaengend, { n: schnellAnzahl }));
                }
              }}
              className="w-full h-10 rounded-lg border border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors inline-flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {uiStrings.bestePlaetze}
            </button>
          </div>
        </div>
      )}
      {ausgewaehlt.length === 0 && ausverkauft && (
        <p className="text-sm font-medium text-destructive text-center py-6">
          {uiStrings.eventAusverkauft}
        </p>
      )}

      {fehler && <p className="text-xs text-destructive bg-destructive/5 rounded-md px-3 py-2">{fehler}</p>}

      <button
        type="button"
        onClick={weiter}
        disabled={ausgewaehlt.length === 0}
        className="w-full h-11 rounded-xl font-semibold text-sm transition-all
          bg-primary text-primary-foreground hover:bg-primary/90
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {ausgewaehlt.length === 0 ? uiStrings.auswaehlen : `${uiStrings.weiter} →`}
      </button>
    </div>
  );

  /* ── Step 2: Kasse ──────────────────────────────────────────────────────── */
  const kasseView = (
    <div className="grid lg:grid-cols-[1fr_400px] gap-5 items-start">

      {/* Left: Order summary */}
      <div className="space-y-4">

        {/* Event card */}
        {(eventTitel || venueName || eventDatum) && (
          <div className="rounded-2xl border border-border bg-background overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Ticket className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-base leading-snug">{eventTitel}</p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {eventDatum && (
                      <span className="text-xs text-white/70 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(eventDatum).toLocaleDateString("de-DE", {
                          weekday: "long", day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    )}
                    {venueName && (
                      <span className="text-xs text-white/70 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {venueName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seats table */}
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-sm font-semibold">{uiStrings.deinePlaetze}</p>
          </div>
          <div className="divide-y divide-border">
            {ausgewaehlt.map((s) => {
              const typ = ticketTypen.find((t) => t.id === s.ticketTypId);
              const typPreis = sitzPreis(s);
              return (
                <div key={s.sitzId} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.kategorie.farbe }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm font-mono">{s.sitzId}</span>
                      {typ && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {typName(typ)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.kategorie.name}</p>
                    {typ && Object.entries(s.extraFelder).filter(([, v]) => v).map(([label, val]) => (
                      <p key={label} className="text-xs text-muted-foreground/70">{label}: {val}</p>
                    ))}
                  </div>
                  <div className="text-right shrink-0">
                    {typPreis !== s.kategorie.preis_cent && (
                      <p className="text-xs line-through text-muted-foreground">{euro(s.kategorie.preis_cent)}</p>
                    )}
                    <p className="text-sm font-semibold tabular-nums">{euro(typPreis)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Totals */}
          <div className="border-t border-border bg-muted/30 px-5 py-4 space-y-2">
            {serviceGebuehrCent > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{uiStrings.tickets} ({ausgewaehlt.length})</span>
                <span className="tabular-nums">{euro(ticketSummeCent)}</span>
              </div>
            )}
            {serviceGebuehrCent > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{uiStrings.servicegebuehr}</span>
                <span className="tabular-nums">{euro(gebuehrCent)}</span>
              </div>
            )}
            {addonSummeCent > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{uiStrings.extrasZeile}</span>
                <span className="tabular-nums">{euro(addonSummeCent)}</span>
              </div>
            )}
            {fruehbucher && ticketSummeCent > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>{uiStrings.fruehbucherRabatt}</span>
                <span className="tabular-nums">−{fruehbucher.prozent} %</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="font-bold text-base">{uiStrings.gesamtpreis}</span>
              <span key={gesamtPreisCent} className="font-bold text-lg tabular-nums inline-block animate-pop-in">{euro(gesamtPreisCent)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{uiStrings.mwst}</p>
          </div>
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <div className="rounded-2xl border border-border bg-background overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <p className="text-sm font-semibold">{uiStrings.extras}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{uiStrings.extrasHinweis}</p>
            </div>
            <div className="divide-y divide-border">
              {addons.map((a) => {
                const menge = addonMenge(a.id);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{euro(a.preis_cent)} {uiStrings.proStueck}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button"
                        onClick={() => setzeAddonMenge(a.id, menge - 1)}
                        disabled={menge === 0}
                        aria-label={`− ${a.name}`}
                        className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30 transition-colors">
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{menge}</span>
                      <button type="button"
                        onClick={() => setzeAddonMenge(a.id, menge + 1)}
                        disabled={menge >= 20}
                        aria-label={`+ ${a.name}`}
                        className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30 transition-colors">
                        +
                      </button>
                    </div>
                    {menge > 0 && (
                      <span className="text-sm font-semibold tabular-nums w-16 text-right shrink-0">
                        {euro(menge * a.preis_cent)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <button
          type="button"
          onClick={() => { setSchritt("auswahl"); setFehler(null); setLaedt(false); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {uiStrings.zurueckZurAuswahl}
        </button>
      </div>

      {/* Right: Contact + Payment */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-sm font-semibold">{uiStrings.kontaktdaten}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{uiStrings.kontaktHinweis}</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">{uiStrings.name}</Label>
              <Input
                id="name"
                placeholder={uiStrings.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl text-sm"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">{uiStrings.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={uiStrings.emailPlaceholder}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailVorschlag(null); }}
                onBlur={() => setEmailVorschlag(emailKorrektur(email.trim()))}
                className="h-11 rounded-xl text-sm"
                autoComplete="email"
              />
              {emailVorschlag && (
                <button type="button"
                  onClick={() => { setEmail(emailVorschlag); setEmailVorschlag(null); }}
                  className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-full text-left hover:bg-amber-100 transition-colors">
                  {fmt(uiStrings.meintestDu, { email: emailVorschlag })}
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                {uiStrings.emailPruefen}
              </p>
            </div>
          </div>
        </div>

        {/* CTA card */}
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="px-5 pt-4 pb-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{uiStrings.gesamtpreis}</span>
              <span key={gesamtPreisCent} className="text-xl font-bold tabular-nums inline-block animate-pop-in">{euro(gesamtPreisCent)}</span>
            </div>

            {/* AGB + Widerruf */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agbAkzeptiert}
                onChange={(e) => { setAgbAkzeptiert(e.target.checked); setFehler(null); }}
                className="mt-0.5 h-4 w-4 rounded border-border shrink-0"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {uiStrings.agbTeil1}{" "}
                <a href="/terms" target="_blank" className="text-primary underline underline-offset-2">{uiStrings.agbLabel}</a>{" "}
                {uiStrings.und}{" "}
                <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2">{uiStrings.datenschutzLabel}</a>.{" "}
                {uiStrings.widerruf}
              </span>
            </label>

            {fehler && (
              <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{fehler}</p>
            )}

            <button
              type="button"
              onClick={zahlungspflichtigBestellen}
              disabled={laedt || !agbAkzeptiert}
              className="w-full h-12 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all
                bg-brand text-white hover:bg-brand-deep
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {laedt
                ? <><Loader2 className="h-5 w-5 animate-spin" /> {uiStrings.weiterleitung}</>
                : <><Lock className="h-4 w-4" /> {uiStrings.zahlungspflichtig}</>}
            </button>

            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                {uiStrings.sslHinweis}
              </span>
              <span className="text-[11px] text-muted-foreground">{uiStrings.stripeHinweis}</span>
            </div>
          </div>
          <div className="border-t border-border bg-muted/30 px-5 py-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
              {uiStrings.holdHinweis}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Layout ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Kasse (Step 2) — full width ─────────────────────────────────────── */}
      {schritt === "kasse" && (
        <div className="animate-in fade-in duration-200">
          {kasseView}
        </div>
      )}

      {/* ── Sitzauswahl (Step 1) ────────────────────────────────────────────── */}
      {schritt === "auswahl" && (
        <>
          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {fruehbucherBadge}
              {verfuegbarkeitsBanner}
              {mehrereEbenen && (
                <FloorPicker floors={floors} aktiv={aktiverFloorIdx} onWechseln={switchFloor} floorLabel={floorLabel} />
              )}
              <Legende kategorien={alleKategorien}
                belegtLabel={uiStrings.belegt} ausgewaehltLabel={uiStrings.ausgewaehlt}
                barrierefreiLabel={(aktiverFloor.konfiguration.barrierefreieSitze?.length ?? 0) > 0 ? uiStrings.barrierefrei : undefined} />
              {canvasWrapper(desktopContainerRef, desktopRenderScale)}
              <p className="text-xs text-muted-foreground">{uiStrings.liveHinweis}</p>
            </div>
            <div>
              <div className="sticky top-20 rounded-2xl border border-border bg-background overflow-hidden">
                <div className="px-4 py-3.5 border-b border-border">
                  <p className="font-semibold text-sm">{uiStrings.deineAuswahl}</p>
                </div>
                <div className="px-4 py-4">
                  {sitzAuswahl}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-3">
            {fruehbucherBadge}
            {verfuegbarkeitsBanner}
            {mehrereEbenen && (
              <FloorPicker floors={floors} aktiv={aktiverFloorIdx} onWechseln={switchFloor} floorLabel={floorLabel} />
            )}
            <Legende kategorien={alleKategorien}
              belegtLabel={uiStrings.belegt} ausgewaehltLabel={uiStrings.ausgewaehlt}
              barrierefreiLabel={(aktiverFloor.konfiguration.barrierefreieSitze?.length ?? 0) > 0 ? uiStrings.barrierefrei : undefined} />
            {canvasWrapper(mobileContainerRef, mobileRenderScale)}
            <p className="text-[11px] text-muted-foreground text-center">
              {uiStrings.zoomHinweis}
            </p>

            {/* Sticky bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border shadow-2xl">
              <button type="button"
                className="w-full flex items-center justify-between px-4 py-3.5"
                onClick={() => ausgewaehlt.length > 0 && setDrawerOffen((v) => !v)}>
                <div className="flex items-center gap-2">
                  {ausgewaehlt.length === 0
                    ? <span className="text-sm text-muted-foreground">{uiStrings.platzWaehlen}</span>
                    : <>
                        <span className="text-sm font-semibold">{ausgewaehlt.length} {ausgewaehlt.length > 1 ? uiStrings.plaetze : uiStrings.platz}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{ausgewaehlt.map((a) => a.sitzId).join(", ")}</span>
                      </>}
                </div>
                <div className="flex items-center gap-3">
                  {ausgewaehlt.length > 0 && (
                    <span key={gesamtPreisCent} className="font-bold text-sm inline-block animate-pop-in">{euro(gesamtPreisCent)}</span>
                  )}
                  {ausgewaehlt.length > 0 && (drawerOffen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
                </div>
              </button>
              {drawerOffen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 max-h-[65vh] overflow-y-auto">
                  {sitzAuswahl}
                </div>
              )}
              {!drawerOffen && ausgewaehlt.length > 0 && (
                <div className="px-4 pb-4">
                  <button type="button" onClick={weiter}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                    {uiStrings.weiter} →
                  </button>
                </div>
              )}
              <div className="h-safe-bottom" />
            </div>
            <div className="h-28" />
          </div>
        </>
      )}
    </>
  );
}

function Legende({ kategorien, belegtLabel, ausgewaehltLabel, barrierefreiLabel }: {
  kategorien: { id: string; name: string; farbe: string; preis_cent: number }[];
  belegtLabel: string;
  ausgewaehltLabel: string;
  // Label anzeigen, wenn der Plan barrierefreie Plätze hat (sonst undefined)
  barrierefreiLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
      {kategorien.map((k) => (
        <span key={k.id} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: k.farbe }} />
          {k.name} — {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
        </span>
      ))}
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full shrink-0 bg-[#d3d7dd]" />{belegtLabel}</span>
      {/* Auswahl wird im Plan über Ring + Häkchen gezeigt, nicht über eine
          eigene Füllfarbe — die Legende bildet genau das ab. */}
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 shrink-0 rounded-full border-2 border-[#16181d] bg-muted-foreground/25 grid place-items-center">
          <Check weight="bold" className="w-2 h-2 text-[#16181d]" />
        </span>
        {ausgewaehltLabel}
      </span>
      {barrierefreiLabel && (
        <span className="flex items-center gap-1.5">
          <Wheelchair className="w-3.5 h-3.5 text-sky-700 shrink-0" />
          {barrierefreiLabel}
        </span>
      )}
    </div>
  );
}
