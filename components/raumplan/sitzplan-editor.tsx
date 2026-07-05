"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import * as Dialog from "@radix-ui/react-dialog";
import EditorToolbar from "./editor-toolbar";
import ElementEigenschaftenPanel from "./element-eigenschaften-panel";
import type { Auswahl } from "./sitzplan-canvas";
import {
  type SitzplanElement, type SitzplanKonfiguration, type ElementTyp, type Buehne, type Preiskategorie,
  type ReiheElement, type TischreiheElement, type RundtischElement,
  type StehplatzElement, type TextElement,
  naechsteBezeichnung, migrierteKonfiguration, elementSitzIds, DEFAULT_KATEGORIEN,
} from "@/types/sitzplan";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Save, ArrowLeft, ChevronLeft, MousePointer2, Trash2, Pencil, Check, X, SlidersHorizontal, ZoomIn, ZoomOut, Undo2, Redo2, Magnet, Ban } from "lucide-react";
import Link from "next/link";

const SitzplanCanvas = dynamic(() => import("./sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-50 flex items-center justify-center text-sm text-muted-foreground">
      Canvas wird geladen…
    </div>
  ),
});

type Props = {
  planId: string; planName: string; venueId: string; venueName: string;
  initialKonfiguration: unknown;
};

export default function SitzplanEditor({ planId, planName, venueId, venueName, initialKonfiguration }: Props) {
  const router = useRouter();
  const [konfig, setKonfig] = useState<SitzplanKonfiguration>(migrierteKonfiguration(initialKonfiguration));
  const [auswahl, setAuswahl] = useState<Auswahl>(null);

  // ── Undo/Redo ────────────────────────────────────────────────────────────
  // Ref-Spiegel des aktuellen Zustands, damit mutiere() außerhalb des
  // setState-Updaters (StrictMode-sicher) auf die History pushen kann
  const konfigRef = useRef(konfig);
  konfigRef.current = konfig;
  const historieRef = useRef<{ past: SitzplanKonfiguration[]; future: SitzplanKonfiguration[] }>({ past: [], future: [] });
  const letzteMutationRef = useRef<{ key: string; zeit: number }>({ key: "", zeit: 0 });
  const [, erzwingeRender] = useState(0);

  // Zentrale Mutations-Funktion: pusht den alten Zustand auf den Undo-Stack.
  // coalesceKey fasst schnelle Folge-Änderungen (Slider, Stepper) zu einem
  // History-Eintrag zusammen.
  const mutiere = useCallback((update: (k: SitzplanKonfiguration) => SitzplanKonfiguration, coalesceKey?: string) => {
    const jetzt = Date.now();
    const l = letzteMutationRef.current;
    const zusammenfassen = coalesceKey && l.key === coalesceKey && jetzt - l.zeit < 800;
    if (!zusammenfassen) {
      historieRef.current.past.push(konfigRef.current);
      if (historieRef.current.past.length > 50) historieRef.current.past.shift();
      historieRef.current.future = [];
    }
    letzteMutationRef.current = { key: coalesceKey ?? "", zeit: jetzt };
    setKonfig(update(konfigRef.current));
    setGespeichert(false);
    erzwingeRender((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const h = historieRef.current;
    const prev = h.past.pop();
    if (!prev) return;
    h.future.push(konfigRef.current);
    letzteMutationRef.current = { key: "", zeit: 0 };
    setKonfig(prev);
    setAuswahl(null);
    setGespeichert(false);
    erzwingeRender((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    const h = historieRef.current;
    const next = h.future.pop();
    if (!next) return;
    h.past.push(konfigRef.current);
    letzteMutationRef.current = { key: "", zeit: 0 };
    setKonfig(next);
    setAuswahl(null);
    setGespeichert(false);
    erzwingeRender((v) => v + 1);
  }, []);

  // ── Snapping ─────────────────────────────────────────────────────────────
  const [snapAktiv, setSnapAktiv] = useState(true);

  // ── Sperrmodus: einzelne Plätze blockieren (Technik, Kamera, defekt) ─────
  const [sperrModus, setSperrModus] = useState(false);
  const sitzSperrungToggeln = useCallback((sitzId: string) => {
    mutiere((k) => {
      const gesperrt = new Set(k.gesperrteSitze ?? []);
      if (gesperrt.has(sitzId)) gesperrt.delete(sitzId);
      else gesperrt.add(sitzId);
      return { ...k, gesperrteSitze: [...gesperrt] };
    }, "sperrung");
  }, [mutiere]);
  const [speichernLaedt, setSpeichernLaedt] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [nameWert, setNameWert] = useState(planName);
  const [nameEditModus, setNameEditModus] = useState(false);
  const [nameLaedt, setNameLaedt] = useState(false);
  const [mobilePanelOffen, setMobilePanelOffen] = useState(false);

  // Responsive canvas scaling
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerBreite, setContainerBreite] = useState(0);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    setContainerBreite(el.clientWidth);
    const ro = new ResizeObserver(() => setContainerBreite(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scale canvas to fit container on mobile; cap at 1 on desktop
  const fitScale = containerBreite > 0
    ? Math.min(1, (containerBreite - 32) / konfig.breite)
    : 1;

  // Editor-Zoom (0.5×–2×) multipliziert die Fit-Skalierung; Container scrollt
  const ZOOM_STUFEN = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2];
  const [editorZoom, setEditorZoom] = useState(1);
  const renderScale = fitScale * editorZoom;
  function zoomSchritt(richtung: 1 | -1) {
    const idx = ZOOM_STUFEN.findIndex((z) => z >= editorZoom - 0.001);
    const next = ZOOM_STUFEN[Math.min(ZOOM_STUFEN.length - 1, Math.max(0, idx + richtung))];
    setEditorZoom(next);
  }

  // Auto-open mobile panel when an element is selected
  useEffect(() => {
    if (auswahl !== null) setMobilePanelOffen(true);
  }, [auswahl]);

  function mobilePanelSchliessen() {
    setMobilePanelOffen(false);
    setAuswahl(null);
  }

  async function nameSpeichern() {
    const bereinigt = nameWert.trim();
    if (!bereinigt || bereinigt === planName) { setNameWert(planName); setNameEditModus(false); return; }
    setNameLaedt(true);
    const supabase = createClient();
    await supabase.from("sitzplaene").update({ name: bereinigt }).eq("id", planId);
    setNameLaedt(false);
    setNameEditModus(false);
    router.refresh();
  }

  const gesamtSitze = konfig.elemente.reduce((s, e) => s + elementSitzIds(e).length, 0);

  function naechstesY(): number {
    if (konfig.elemente.length === 0) return Math.round(konfig.hoehe * 0.4);
    const maxY = Math.max(...konfig.elemente.map((e) => e.y));
    return Math.min(maxY + 70, konfig.hoehe - 60);
  }

  function elementHinzufuegen(typ: ElementTyp) {
    const PREFIXE: Record<ElementTyp, string> = { reihe: "", tischreihe: "T", rundtisch: "R", stehplatz: "S", text: "X" };
    const bezeichnung = naechsteBezeichnung(konfig.elemente, PREFIXE[typ]);
    const defaultKatId = konfig.kategorien[0]?.id ?? DEFAULT_KATEGORIEN[0].id;
    const basis = { id: crypto.randomUUID(), bezeichnung, x: Math.round(konfig.breite / 2), y: naechstesY(), winkel: 0, kategorie_id: defaultKatId };

    let neuesElement: SitzplanElement;
    if      (typ === "reihe")      neuesElement = { ...basis, typ: "reihe",      anzahlSitze: 10, sitzAbstand: 34 } satisfies ReiheElement;
    else if (typ === "tischreihe") neuesElement = { ...basis, typ: "tischreihe", sitzeProSeite: 4, sitzeOben: true, sitzeUnten: true } satisfies TischreiheElement;
    else if (typ === "stehplatz")  neuesElement = { ...basis, typ: "stehplatz",  breite: 220, hoehe: 130, kapazitaet: 30 } satisfies StehplatzElement;
    else if (typ === "text")       neuesElement = { ...basis, typ: "text",       text: "Beschriftung", fontSize: 16 } satisfies TextElement;
    else                           neuesElement = { ...basis, typ: "rundtisch",  anzahlSitze: 8,  tischRadius: 35 } satisfies RundtischElement;

    mutiere((k) => ({ ...k, elemente: [...k.elemente, neuesElement] }));
    setAuswahl({ typ: "element", ids: [neuesElement.id] });
  }

  function elementLoeschen(id: string) {
    mutiere((k) => ({ ...k, elemente: k.elemente.filter((e) => e.id !== id) }));
    setAuswahl(null);
  }

  function elementDuplizieren(id: string) {
    const original = konfig.elemente.find((e) => e.id === id);
    if (!original) return;
    const kopie: SitzplanElement = {
      ...original,
      id: crypto.randomUUID(),
      bezeichnung: naechsteBezeichnung(konfig.elemente,
        ({ reihe: "", tischreihe: "T", rundtisch: "R", stehplatz: "S", text: "X" } as Record<ElementTyp, string>)[original.typ]),
      x: Math.min(original.x + 40, konfig.breite - 60),
      y: Math.min(original.y + 40, konfig.hoehe - 60),
    };
    mutiere((k) => ({ ...k, elemente: [...k.elemente, kopie] }));
    setAuswahl({ typ: "element", ids: [kopie.id] });
  }

  function elementAktualisieren(id: string, delta: Partial<SitzplanElement>) {
    mutiere((k) => ({
      ...k,
      elemente: k.elemente.map((e) => (e.id === id ? ({ ...e, ...delta } as SitzplanElement) : e)),
    }), `el-${id}`);
  }

  const elementVerschieben = useCallback((id: string, x: number, y: number) => {
    mutiere((k) => ({ ...k, elemente: k.elemente.map((e) => e.id === id ? { ...e, x, y } : e) }));
  }, [mutiere]);

  const elementeMehrfachVerschieben = useCallback((list: { id: string; x: number; y: number }[]) => {
    mutiere((k) => ({
      ...k,
      elemente: k.elemente.map((e) => {
        const upd = list.find((u) => u.id === e.id);
        return upd ? { ...e, x: upd.x, y: upd.y } : e;
      }),
    }));
  }, [mutiere]);

  function buehneAktualisieren(delta: Partial<Buehne>) {
    mutiere((k) => ({ ...k, buehne: { ...k.buehne, ...delta } }), "buehne");
  }

  const buehneVerschieben = useCallback((x: number, y: number) => {
    mutiere((k) => ({ ...k, buehne: { ...k.buehne, x, y } }));
  }, [mutiere]);

  const buehneTransformiert = useCallback((breite: number, hoehe: number, x: number, y: number, winkel: number) => {
    mutiere((k) => ({ ...k, buehne: { ...k.buehne, breite, hoehe, x, y, winkel } }));
  }, [mutiere]);

  function kategorienAktualisieren(kategorien: Preiskategorie[]) {
    mutiere((k) => ({ ...k, kategorien }), "kategorien");
  }

  function raumgroesseAktualisieren(breite: number, hoehe: number) {
    mutiere((k) => ({ ...k, breite, hoehe }), "raum");
  }

  async function speichern() {
    setSpeichernLaedt(true);
    const supabase = createClient();
    const { error } = await supabase.from("sitzplaene").update({ konfiguration: konfig }).eq("id", planId);
    setSpeichernLaedt(false);
    if (!error) { setGespeichert(true); router.refresh(); }
  }

  const ausgewaehltesElement =
    auswahl?.typ === "element" && auswahl.ids.length === 1
      ? konfig.elemente.find((e) => e.id === auswahl.ids[0]) ?? null
      : null;
  const auswahlIds = auswahl?.typ === "element" ? auswahl.ids : [];
  const alleBezeichnungen = ausgewaehltesElement
    ? konfig.elemente.filter((e) => e.id !== ausgewaehltesElement.id).map((e) => e.bezeichnung)
    : [];
  const bezeichnungen = konfig.elemente.map((e) => e.bezeichnung);
  const hatDuplikate = bezeichnungen.length !== new Set(bezeichnungen).size;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inInput = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
      // Undo/Redo: Cmd/Ctrl+Z bzw. Cmd/Ctrl+Shift+Z / Ctrl+Y
      if ((e.metaKey || e.ctrlKey) && (e.key === "z" || e.key === "Z" || e.key === "y")) {
        if (inInput) return;
        e.preventDefault();
        if (e.key === "y" || e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (inInput) return;
        const ids = auswahl?.typ === "element" ? auswahl.ids : [];
        if (ids.length === 0) return;
        mutiere((k) => ({ ...k, elemente: k.elemente.filter((el) => !ids.includes(el.id)) }));
        setAuswahl(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [auswahl, mutiere, undo, redo]);

  // Max. möglicher Umsatz bei Vollauslastung (Kapazitäts-/Umsatz-Widget)
  const maxUmsatzCent = konfig.elemente.reduce((summe, el) => {
    const kat = konfig.kategorien.find((k) => k.id === el.kategorie_id);
    return summe + elementSitzIds(el).length * (kat?.preis_cent ?? 0);
  }, 0);

  // Shared sidebar panel content (used in both desktop aside and mobile bottom sheet)
  function sidebarInhalt(onClose?: () => void) {
    if (auswahlIds.length > 1) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <button type="button" onClick={() => { setAuswahl(null); onClose?.(); }}
              className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{auswahlIds.length} Elemente</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <MousePointer2 className="h-8 w-8 opacity-30" />
            <p className="text-sm">Ziehe ein Element um alle <strong>{auswahlIds.length} Elemente</strong> gemeinsam zu verschieben.</p>
            <p className="text-xs">Shift+Klick zum Abwählen.</p>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button type="button"
              onClick={() => {
                mutiere((k) => ({ ...k, elemente: k.elemente.filter((e) => !auswahlIds.includes(e.id)) }));
                setAuswahl(null);
                onClose?.();
              }}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-input text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> {auswahlIds.length} Elemente löschen
            </button>
          </div>
        </div>
      );
    }
    if (ausgewaehltesElement) {
      return (
        <ElementEigenschaftenPanel
          el={ausgewaehltesElement}
          kategorien={konfig.kategorien}
          alleBezeichnungen={alleBezeichnungen}
          onChange={(d) => elementAktualisieren(ausgewaehltesElement.id, d)}
          onLoeschen={() => { elementLoeschen(ausgewaehltesElement.id); onClose?.(); }}
          onSchliessen={() => { setAuswahl(null); onClose?.(); }}
          onDuplizieren={() => elementDuplizieren(ausgewaehltesElement.id)}
        />
      );
    }
    return (
      <EditorToolbar
        elemente={konfig.elemente}
        buehne={konfig.buehne}
        kategorien={konfig.kategorien}
        raumbreite={konfig.breite}
        raumhoehe={konfig.hoehe}
        gesamtSitze={gesamtSitze}
        onHinzufuegen={(typ) => { elementHinzufuegen(typ); onClose?.(); }}
        onBuehneAktualisieren={buehneAktualisieren}
        onKategorienAktualisieren={kategorienAktualisieren}
        onRaumgroesseAktualisieren={raumgroesseAktualisieren}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/venues/${venueId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{venueName}</p>
          {nameEditModus ? (
            <div className="flex items-center gap-1 mt-0.5">
              <input
                autoFocus
                value={nameWert}
                onChange={(e) => setNameWert(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") nameSpeichern(); if (e.key === "Escape") { setNameWert(planName); setNameEditModus(false); } }}
                className="h-6 flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-primary focus:outline-none px-0"
              />
              <button type="button" onClick={nameSpeichern} disabled={nameLaedt}
                className="h-7 w-7 flex items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 shrink-0">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => { setNameWert(planName); setNameEditModus(false); }}
                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setNameEditModus(true)}
              className="flex items-center gap-1.5 group hover:text-primary transition-colors">
              <span className="font-semibold text-sm truncate max-w-[180px]">{nameWert}</span>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Undo / Redo / Snap */}
          <div className="flex items-center gap-0.5 rounded-lg border border-input p-0.5">
            <button type="button" onClick={undo} disabled={historieRef.current.past.length === 0}
              aria-label="Rückgängig (Cmd+Z)" title="Rückgängig (Cmd+Z)"
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={redo} disabled={historieRef.current.future.length === 0}
              aria-label="Wiederholen (Cmd+Shift+Z)" title="Wiederholen (Cmd+Shift+Z)"
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setSnapAktiv((v) => !v)}
              aria-label="Am Raster ausrichten" aria-pressed={snapAktiv}
              title={snapAktiv ? "Raster-Snapping aktiv" : "Raster-Snapping aus"}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                snapAktiv ? "bg-primary/15 text-primary" : "hover:bg-muted text-muted-foreground"
              }`}>
              <Magnet className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => { setSperrModus((v) => !v); setAuswahl(null); }}
              aria-label="Sitze sperren" aria-pressed={sperrModus}
              title="Sperrmodus: einzelne Plätze blockieren"
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                sperrModus ? "bg-destructive/15 text-destructive" : "hover:bg-muted text-muted-foreground"
              }`}>
              <Ban className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Zoom-Steuerung */}
          <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-input p-0.5">
            <button type="button" onClick={() => zoomSchritt(-1)} disabled={editorZoom <= ZOOM_STUFEN[0]}
              aria-label="Verkleinern"
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setEditorZoom(1)}
              className="h-7 min-w-[44px] px-1 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground tabular-nums">
              {Math.round(editorZoom * 100)}%
            </button>
            <button type="button" onClick={() => zoomSchritt(1)} disabled={editorZoom >= ZOOM_STUFEN[ZOOM_STUFEN.length - 1]}
              aria-label="Vergrößern"
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground hidden xl:inline">
            {gesamtSitze} Plätze
            {maxUmsatzCent > 0 && (
              <> · max. <strong className="text-foreground font-semibold">
                {(maxUmsatzCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </strong></>
            )}
          </span>
          {gespeichert && !hatDuplikate && <span className="text-xs text-green-600 font-medium hidden sm:inline">✓ Gespeichert</span>}
          {hatDuplikate && <span className="text-xs text-destructive font-medium">Doppelte Bez.</span>}
          <Button size="sm" onClick={speichern} disabled={speichernLaedt || hatDuplikate}>
            <Save className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{speichernLaedt ? "Speichern…" : "Speichern"}</span>
          </Button>
        </div>
      </div>

      {/* Hauptbereich: Canvas + kontext-sensitive Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas — full width on mobile, flex-1 on desktop */}
        <div
          ref={canvasContainerRef}
          className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center gap-3 bg-slate-100"
        >
          {sperrModus && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 px-4 py-2 text-sm text-destructive font-medium shrink-0">
              <Ban className="h-4 w-4 shrink-0" />
              Sperrmodus: Plätze anklicken zum Sperren/Entsperren
              · {konfig.gesperrteSitze?.length ?? 0} gesperrt
            </div>
          )}
          <div
            className="rounded-xl border-2 border-slate-300 shadow-lg overflow-hidden"
            style={{ width: konfig.breite * renderScale, minHeight: konfig.hoehe * renderScale }}
          >
            <ErrorBoundary>
            <SitzplanCanvas
              konfiguration={konfig}
              modus="editor"
              renderScale={renderScale}
              snapRaster={snapAktiv ? 10 : 0}
              sperrModus={sperrModus}
              belegteSitze={sperrModus || (konfig.gesperrteSitze?.length ?? 0) > 0 ? new Set(konfig.gesperrteSitze ?? []) : undefined}
              onSitzKlicken={sperrModus ? sitzSperrungToggeln : undefined}
              auswahl={auswahl}
              onAuswaehlen={setAuswahl}
              onElementVerschieben={elementVerschieben}
              onMehrereElementeVerschieben={elementeMehrfachVerschieben}
              onBuehneVerschieben={buehneVerschieben}
              onBuehneTransformiert={buehneTransformiert}
            />
            </ErrorBoundary>
          </div>
        </div>

        {/* Desktop Sidebar (lg+) */}
        <aside className="hidden lg:flex w-64 border-l border-border bg-background flex-col overflow-hidden shrink-0">
          {sidebarInhalt()}
        </aside>
      </div>

      {/* Mobile FAB — opens panel when nothing is selected */}
      {!mobilePanelOffen && (
        <button
          onClick={() => setMobilePanelOffen(true)}
          className="lg:hidden fixed bottom-5 right-5 z-20 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Panel öffnen"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      )}

      {/* Mobile Bottom Sheet (< lg) */}
      <Dialog.Root open={mobilePanelOffen} onOpenChange={(open) => { if (!open) mobilePanelSchliessen(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay fixed inset-0 bg-black/40 z-30 lg:hidden" />
          <Dialog.Content
            className="bottom-sheet fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card rounded-t-2xl shadow-2xl flex flex-col focus:outline-none"
            style={{ maxHeight: "78vh" }}
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Editor-Panel</Dialog.Title>
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            {/* Panel content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {sidebarInhalt(mobilePanelSchliessen)}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
