"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import * as Dialog from "@radix-ui/react-dialog";
import { ElementHinzufuegenInhalt, PreiskategorienInhalt, PlaneinstellungenInhalt } from "./editor-toolbar";
import { Dialog as Modal, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import ElementEigenschaftenPanel, { BuehneEigenschaftenPanel } from "./element-eigenschaften-panel";
import { EditorGuideModal } from "./editor-guide";
import { EditorTour } from "./editor-tour";
import { ElementListeModal, type ElementListeAuswahl } from "./element-liste";
import type { Auswahl } from "./sitzplan-canvas";
import {
  type SitzplanElement, type SitzplanKonfiguration, type ElementTyp, type Buehne, type Preiskategorie,
  type ReiheElement, type TischreiheElement, type RundtischElement,
  type StehplatzElement, type TextElement,
  naechsteBezeichnung, migrierteKonfiguration, elementSitzIds, doppelteSitzIds, DEFAULT_KATEGORIEN, zentriereInhalt,
  elementeAusserhalb,
} from "@/types/sitzplan";
import { erzeugeReihenbestuhlung, erzeugeRundtischGruppe, REIHEN_ABSTAND_GEN } from "@/lib/bestuhlung-generator";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { toast } from "@/components/ui/toaster";
import { FloppyDisk as Save, ArrowLeft, CaretLeft as ChevronLeft, CursorClick as MousePointer2, Trash as Trash2, PencilSimple as Pencil, Check, X, Plus, Tag as Tags, SlidersHorizontal, MagnifyingGlassPlus as ZoomIn, MagnifyingGlassMinus as ZoomOut, ArrowUUpLeft as Undo2, ArrowUUpRight as Redo2, Magnet, Prohibit as Ban, Lock, Wheelchair, Question as HelpCircle, AlignLeft, AlignCenterHorizontal, AlignRight, AlignTop, AlignCenterVertical, AlignBottom, ListBullets, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useT, useLocale } from "@/components/i18n-provider";
import { fmt, intlLocale } from "@/lib/i18n/buchung";

const SitzplanCanvas = dynamic(() => import("./sitzplan-canvas"), {
  ssr: false,
  loading: () => <CanvasLadeHinweis />,
});

const GUIDE_GESEHEN_KEY = "seatflow-editor-guide-gesehen";

function CanvasLadeHinweis() {
  const t = useT();
  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center text-sm text-muted-foreground">
      {t.editor.canvasLaedt}
    </div>
  );
}

type Props = {
  planId: string; planName: string; venueId: string; venueName: string;
  initialKonfiguration: unknown;
  // Bereits verkaufte Sitz-IDs (plan-lokal) — Elemente damit sind geschützt
  verkaufteSitzIds?: string[];
};

export default function SitzplanEditor({ planId, planName, venueId, venueName, initialKonfiguration, verkaufteSitzIds = [] }: Props) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const currencyLocale = intlLocale(locale);
  // Beim Öffnen automatisch zentrieren: Räume, die größer als die tatsächlich
  // platzierten Elemente sind, wirken sonst an den linken Rand gedrängt. Ist
  // der Inhalt schon zentriert, ist das ein No-Op (zentriereInhalt gibt dann
  // dieselbe Konfiguration zurück).
  const [konfig, setKonfig] = useState<SitzplanKonfiguration>(() => zentriereInhalt(migrierteKonfiguration(initialKonfiguration)));
  const [auswahl, setAuswahl] = useState<Auswahl>(null);

  const [gespeichert, setGespeichert] = useState(false);

  // ── Undo/Redo ────────────────────────────────────────────────────────────
  // Ref-Spiegel des aktuellen Zustands, damit mutiere() außerhalb des
  // setState-Updaters (StrictMode-sicher) auf die History pushen kann
  const konfigRef = useRef(konfig);
  useEffect(() => { konfigRef.current = konfig; }, [konfig]);
  const historieRef = useRef<{ past: SitzplanKonfiguration[]; future: SitzplanKonfiguration[] }>({ past: [], future: [] });
  const letzteMutationRef = useRef<{ key: string; zeit: number }>({ key: "", zeit: 0 });
  const [historieStand, setHistorieStand] = useState({ kannUndo: false, kannRedo: false });

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
    const neu = update(konfigRef.current);
    konfigRef.current = neu;
    setKonfig(neu);
    setGespeichert(false);
    setHistorieStand({
      kannUndo: historieRef.current.past.length > 0,
      kannRedo: historieRef.current.future.length > 0,
    });
  }, []);

  const undo = useCallback(() => {
    const h = historieRef.current;
    const prev = h.past.pop();
    if (!prev) return;
    h.future.push(konfigRef.current);
    letzteMutationRef.current = { key: "", zeit: 0 };
    konfigRef.current = prev;
    setKonfig(prev);
    setAuswahl(null);
    setGespeichert(false);
    setHistorieStand({
      kannUndo: historieRef.current.past.length > 0,
      kannRedo: historieRef.current.future.length > 0,
    });
  }, []);

  const redo = useCallback(() => {
    const h = historieRef.current;
    const next = h.future.pop();
    if (!next) return;
    h.past.push(konfigRef.current);
    letzteMutationRef.current = { key: "", zeit: 0 };
    konfigRef.current = next;
    setKonfig(next);
    setAuswahl(null);
    setGespeichert(false);
    setHistorieStand({
      kannUndo: historieRef.current.past.length > 0,
      kannRedo: historieRef.current.future.length > 0,
    });
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
  // ── Barrierefrei-Modus: Rollstuhlplätze markieren ────────────────────────
  const [barrierefreiModus, setBarrierefreiModus] = useState(false);
  const sitzBarrierefreiToggeln = useCallback((sitzId: string) => {
    mutiere((k) => {
      const menge = new Set(k.barrierefreieSitze ?? []);
      if (menge.has(sitzId)) menge.delete(sitzId);
      else menge.add(sitzId);
      return { ...k, barrierefreieSitze: [...menge] };
    }, "barrierefrei");
  }, [mutiere]);

  const [speichernLaedt, setSpeichernLaedt] = useState(false);
  const [nameWert, setNameWert] = useState(planName);
  const [nameEditModus, setNameEditModus] = useState(false);
  const [nameLaedt, setNameLaedt] = useState(false);
  const [mobilePanelOffen, setMobilePanelOffen] = useState(false);
  const [modalOffen, setModalOffen] = useState<"element" | "kategorien" | "einstellungen" | null>(null);
  const [elementListeOffen, setElementListeOffen] = useState(false);

  // ── Einführungs-Guide + interaktive Tour ────────────────────────────────
  // Beim allerersten Öffnen eines leeren Plans startet direkt die Tour (zeigt
  // an den echten Bedienelementen, effektiver als reiner Text). Der
  // Willkommens-Guide bleibt als Nachschlagewerk erhalten, ist aber nur noch
  // über den „?"-Button im Header manuell erreichbar. Lazy-Init statt Effect:
  // soll nur den Zustand beim Mount ermitteln, kein externes System
  // synchronisieren (React-Compiler-Regel).
  const [guideOffen, setGuideOffen] = useState(false);
  function guideSchliessen() {
    setGuideOffen(false);
    try { localStorage.setItem(GUIDE_GESEHEN_KEY, "1"); } catch { /* siehe oben */ }
  }
  const [tourOffen, setTourOffen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !localStorage.getItem(GUIDE_GESEHEN_KEY) && konfig.elemente.length === 0;
    } catch {
      return false;
    }
  });
  function tourSchliessen() {
    setTourOffen(false);
    try { localStorage.setItem(GUIDE_GESEHEN_KEY, "1"); } catch { /* siehe oben */ }
  }
  function tourStarten() {
    guideSchliessen();
    setTourOffen(true);
  }

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

  // Auswahl setzen + Mobile-Panel direkt öffnen (statt via Effect).
  // Nur unterhalb des lg-Breakpoints öffnen: das Bottom-Sheet ist auf
  // Desktop-Breiten per lg:hidden nur unsichtbar, bleibt für Radix aber
  // ein offener Dialog — jeder Klick in die (separate) Desktop-Sidebar
  // zählt dann als "außerhalb" und würde die Auswahl sofort wieder
  // aufheben.
  const waehleAus = useCallback((a: Auswahl) => {
    setAuswahl(a);
    if (a !== null && typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
      setMobilePanelOffen(true);
    }
  }, []);

  function elementListeAuswahl(ziel: ElementListeAuswahl) {
    waehleAus(ziel.typ === "buehne" ? { typ: "buehne" } : { typ: "element", ids: [ziel.id] });
  }

  function mobilePanelSchliessen() {
    setMobilePanelOffen(false);
    setAuswahl(null);
  }

  async function nameSpeichern() {
    const bereinigt = nameWert.trim();
    if (!bereinigt || bereinigt === planName) { setNameWert(planName); setNameEditModus(false); return; }
    setNameLaedt(true);
    const supabase = createClient();
    const { error } = await supabase.from("sitzplaene").update({ name: bereinigt }).eq("id", planId);
    setNameLaedt(false);
    setNameEditModus(false);
    if (error) { setNameWert(planName); toast.error(t.editor.umbenennenFehler, error.message); return; }
    toast.success(t.editor.planUmbenannt, fmt(t.editor.heisstJetzt, { name: bereinigt }));
    router.refresh();
  }

  const gesamtSitze = konfig.elemente.reduce((s, e) => s + elementSitzIds(e).length, 0);

  // ── Plan-Schutz: Elemente mit verkauften Plätzen dürfen nicht gelöscht
  // oder strukturell verändert werden (Sitz-IDs müssen stabil bleiben) ──
  // Lazy-Init statt useRef.current im Render (React-Compiler-Regel)
  const [verkauft] = useState(() => new Set(verkaufteSitzIds));
  const [schutzHinweis, setSchutzHinweis] = useState<string | null>(null);

  function istGeschuetzt(el: SitzplanElement): boolean {
    return elementSitzIds(el).some((id) => verkauft.has(id));
  }

  function schutzMelden(el: SitzplanElement) {
    const n = elementSitzIds(el).filter((id) => verkauft.has(id)).length;
    setSchutzHinweis(fmt(n === 1 ? t.editor.schutzSg : t.editor.schutzPl, { bez: el.bezeichnung, n }));
    setTimeout(() => setSchutzHinweis(null), 5000);
  }

  // Felder, deren Änderung Sitz-IDs verschieben/entfernen würde
  const STRUKTUR_FELDER = new Set([
    "bezeichnung", "anzahlSitze", "nummerStart", "nummerRichtung",
    "sitzeProSeite", "sitzeOben", "sitzeUnten", "kapazitaet",
  ]);

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
    else if (typ === "text")       neuesElement = { ...basis, typ: "text",       text: t.editor.textDefault, fontSize: 16 } satisfies TextElement;
    else                           neuesElement = { ...basis, typ: "rundtisch",  anzahlSitze: 8,  tischRadius: 35 } satisfies RundtischElement;

    mutiere((k) => ({ ...k, elemente: [...k.elemente, neuesElement] }));
    waehleAus({ typ: "element", ids: [neuesElement.id] });
  }


  // ── Bestuhlungs-Generator ─────────────────────────────────────────────────
  // Reine Generier-Logik liegt in lib/bestuhlung-generator.ts (getestet); hier
  // nur das Anwenden aufs Editor-State.
  function bestuhlungErzeugen(reihen: number, sitzeProReihe: number, mittelgang: boolean) {
    const { neu, hoeheNoetig, breiteNoetig } = erzeugeReihenbestuhlung(konfig, reihen, sitzeProReihe, mittelgang);
    mutiere((k) => ({
      ...k,
      hoehe: Math.max(k.hoehe, hoeheNoetig),
      breite: Math.max(k.breite, breiteNoetig),
      elemente: [...k.elemente, ...neu],
    }));
    setAuswahl(null);
  }

  function rundtischGruppeErzeugen(anzahl: number, sitzeProTisch: number, startYOffset = 90) {
    const { neu, hoeheNoetig } = erzeugeRundtischGruppe(konfig, anzahl, sitzeProTisch, startYOffset);
    mutiere((k) => ({
      ...k,
      hoehe: Math.max(k.hoehe, hoeheNoetig),
      elemente: [...k.elemente, ...neu],
    }));
    setAuswahl(null);
  }

  function vorlageAnwenden(typ: "theater" | "kabarett" | "misch") {
    if (typ === "theater") { bestuhlungErzeugen(10, 12, true); return; }
    if (typ === "kabarett") { rundtischGruppeErzeugen(6, 6); return; }
    // Mischbestuhlung: 4 Reihen vorn, danach Rundtische
    bestuhlungErzeugen(4, 12, true);
    // Tische unterhalb der erzeugten Reihen platzieren
    const reihenEnde = konfig.buehne.y + konfig.buehne.hoehe / 2 + 90 + 4 * REIHEN_ABSTAND_GEN;
    rundtischGruppeErzeugen(3, 8, reihenEnde - (konfig.buehne.y + konfig.buehne.hoehe / 2) + 40);
  }

  function elementLoeschen(id: string) {
    const el = konfig.elemente.find((e) => e.id === id);
    if (el && istGeschuetzt(el)) { schutzMelden(el); return; }
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
    waehleAus({ typ: "element", ids: [kopie.id] });
  }

  function elementAktualisieren(id: string, delta: Partial<SitzplanElement>) {
    const el = konfig.elemente.find((e) => e.id === id);
    if (el && istGeschuetzt(el) && Object.keys(delta).some((k) => STRUKTUR_FELDER.has(k))) {
      schutzMelden(el);
      return;
    }
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

  // ── Ausrichten & Verteilen (Mehrfachauswahl) ────────────────────────────
  // Relativ zur Auswahl selbst (nicht zum Raum) — das ist der Fall, den man
  // beim Aufräumen eines Plans praktisch immer will.
  function auswahlAusrichten(achse: "x" | "y", modus: "min" | "mitte" | "max") {
    const ids = auswahl?.typ === "element" ? auswahl.ids : [];
    if (ids.length < 2) return;
    const werte = konfig.elemente.filter((e) => ids.includes(e.id)).map((e) => (achse === "x" ? e.x : e.y));
    const ziel = modus === "min" ? Math.min(...werte) : modus === "max" ? Math.max(...werte) : (Math.min(...werte) + Math.max(...werte)) / 2;
    mutiere((k) => ({
      ...k,
      elemente: k.elemente.map((e) => {
        if (!ids.includes(e.id)) return e;
        return achse === "x" ? { ...e, x: ziel } : { ...e, y: ziel };
      }),
    }));
  }

  // Verteilt gleichmäßig zwischen den beiden äußersten Elementen — die
  // bleiben an ihrer Position, nur die dazwischen liegenden rücken auf.
  function auswahlVerteilen(achse: "x" | "y") {
    const ids = auswahl?.typ === "element" ? auswahl.ids : [];
    if (ids.length < 3) return;
    const sortiert = konfig.elemente
      .filter((e) => ids.includes(e.id))
      .sort((a, b) => (achse === "x" ? a.x - b.x : a.y - b.y));
    const min = achse === "x" ? sortiert[0].x : sortiert[0].y;
    const max = achse === "x" ? sortiert[sortiert.length - 1].x : sortiert[sortiert.length - 1].y;
    const schritt = (max - min) / (sortiert.length - 1);
    const ziel = new Map(sortiert.map((e, i) => [e.id, min + schritt * i]));
    mutiere((k) => ({
      ...k,
      elemente: k.elemente.map((e) => {
        const wert = ziel.get(e.id);
        if (wert === undefined) return e;
        return achse === "x" ? { ...e, x: wert } : { ...e, y: wert };
      }),
    }));
  }

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

  function tischweiseBuchungAendern(v: boolean) {
    mutiere((k) => ({ ...k, tischweiseBuchung: v }));
  }

  function inhaltZentrieren() {
    mutiere((k) => zentriereInhalt(k));
  }

  async function speichern() {
    setSpeichernLaedt(true);
    const supabase = createClient();
    const { error } = await supabase.from("sitzplaene").update({ konfiguration: konfig }).eq("id", planId);
    setSpeichernLaedt(false);
    if (error) {
      toast.error(t.editor.speichernFehler, error.message);
      return;
    }
    setGespeichert(true);
    toast.success(t.editor.planGespeichert, fmt(gesamtSitze === 1 ? t.editor.planGespeichertSg : t.editor.planGespeichertPl, { n: gesamtSitze, name: nameWert }));
    router.refresh();
  }

  const ausgewaehltesElement =
    auswahl?.typ === "element" && auswahl.ids.length === 1
      ? konfig.elemente.find((e) => e.id === auswahl.ids[0]) ?? null
      : null;
  const auswahlIds = auswahl?.typ === "element" ? auswahl.ids : [];
  // Sitz-IDs aller ANDEREN Elemente — geteilte Reihen (gleiche Bezeichnung,
  // disjunkte Nummernbereiche) sind legitim, echte ID-Kollisionen nicht
  const fremdeSitzIds = new Set(
    ausgewaehltesElement
      ? konfig.elemente
          .filter((e) => e.id !== ausgewaehltesElement.id)
          .flatMap((e) => elementSitzIds(e))
      : []
  );
  const hatDuplikate = doppelteSitzIds(konfig.elemente).length > 0;
  // Elemente außerhalb der Raumgröße — z.B. nach nachträglichem Verkleinern.
  // Der Buchungs-Canvas zeigt immer den tatsächlichen Inhalt, Käufer würden
  // sie also trotzdem sehen und buchen können.
  const ausserhalbElemente = useMemo(() => elementeAusserhalb(konfig), [konfig]);
  const ausserhalbIds = useMemo(() => new Set(ausserhalbElemente.map((e) => e.id)), [ausserhalbElemente]);

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
        const geschuetzt = konfigRef.current.elemente.find((el) => ids.includes(el.id) && istGeschuetzt(el));
        if (geschuetzt) { schutzMelden(geschuetzt); return; }
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
            <span className="text-sm font-semibold">{fmt(t.editor.mehrereElemente, { n: auswahlIds.length })}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.editor.ausrichten}</p>
              <div className="flex items-center gap-0.5 rounded-lg border border-input p-0.5 w-fit">
                <button type="button" title={t.editor.linksAusrichten} aria-label={t.editor.linksAusrichten}
                  onClick={() => auswahlAusrichten("x", "min")}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" title={t.editor.horizontalZentrieren} aria-label={t.editor.horizontalZentrieren}
                  onClick={() => auswahlAusrichten("x", "mitte")}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <AlignCenterHorizontal className="h-3.5 w-3.5" />
                </button>
                <button type="button" title={t.editor.rechtsAusrichten} aria-label={t.editor.rechtsAusrichten}
                  onClick={() => auswahlAusrichten("x", "max")}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-0.5 rounded-lg border border-input p-0.5 w-fit">
                <button type="button" title={t.editor.obenAusrichten} aria-label={t.editor.obenAusrichten}
                  onClick={() => auswahlAusrichten("y", "min")}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <AlignTop className="h-3.5 w-3.5" />
                </button>
                <button type="button" title={t.editor.vertikalZentrieren} aria-label={t.editor.vertikalZentrieren}
                  onClick={() => auswahlAusrichten("y", "mitte")}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <AlignCenterVertical className="h-3.5 w-3.5" />
                </button>
                <button type="button" title={t.editor.untenAusrichten} aria-label={t.editor.untenAusrichten}
                  onClick={() => auswahlAusrichten("y", "max")}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <AlignBottom className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {auswahlIds.length >= 3 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.editor.verteilen}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => auswahlVerteilen("x")}
                    className="flex-1 h-8 rounded-md border border-input text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    {t.editor.horizontalVerteilen}
                  </button>
                  <button type="button" onClick={() => auswahlVerteilen("y")}
                    className="flex-1 h-8 rounded-md border border-input text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    {t.editor.vertikalVerteilen}
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-1.5 text-center text-muted-foreground pt-3 border-t border-border">
              <MousePointer2 className="h-6 w-6 opacity-30" />
              <p className="text-xs">{t.editor.mehrereZiehenPre} <strong>{fmt(t.editor.mehrereElemente, { n: auswahlIds.length })}</strong> {t.editor.mehrereZiehenPost}</p>
              <p className="text-[11px]">{t.editor.shiftAbwaehlen}</p>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button type="button"
              onClick={() => {
                const geschuetzt = konfig.elemente.find((e) => auswahlIds.includes(e.id) && istGeschuetzt(e));
                if (geschuetzt) { schutzMelden(geschuetzt); return; }
                mutiere((k) => ({ ...k, elemente: k.elemente.filter((e) => !auswahlIds.includes(e.id)) }));
                setAuswahl(null);
                onClose?.();
              }}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-input text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> {fmt(t.editor.elementeLoeschen, { n: auswahlIds.length })}
            </button>
          </div>
        </div>
      );
    }
    if (auswahl?.typ === "buehne") {
      return (
        <BuehneEigenschaftenPanel
          buehne={konfig.buehne}
          onChange={buehneAktualisieren}
          onSchliessen={() => { setAuswahl(null); onClose?.(); }}
        />
      );
    }
    if (ausgewaehltesElement) {
      return (
        <ElementEigenschaftenPanel
          el={ausgewaehltesElement}
          kategorien={konfig.kategorien}
          fremdeSitzIds={fremdeSitzIds}
          onChange={(d) => elementAktualisieren(ausgewaehltesElement.id, d)}
          onLoeschen={() => { elementLoeschen(ausgewaehltesElement.id); onClose?.(); }}
          onSchliessen={() => { setAuswahl(null); onClose?.(); }}
          onDuplizieren={() => elementDuplizieren(ausgewaehltesElement.id)}
        />
      );
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
        <MousePointer2 className="h-8 w-8 opacity-30" />
        <p className="text-sm">{t.editorToolbar.elementInspektor}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border flex items-center px-4 gap-3 shrink-0 h-14" style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}>
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
          <button type="button" onClick={() => setElementListeOffen(true)}
            aria-label={t.editor.elementListe.oeffnen} title={t.editor.elementListe.oeffnen}
            className="h-7 px-1.5 sm:px-2 rounded-md hover:bg-muted flex items-center gap-1 justify-center text-muted-foreground transition-colors">
            <ListBullets className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs font-medium">{t.editor.elementListe.kurz}</span>
          </button>
          <button type="button" onClick={() => setGuideOffen(true)}
            aria-label={t.editor.guide.hilfeTitle} title={t.editor.guide.hilfeTitle}
            className="h-7 px-1.5 sm:px-2 rounded-md hover:bg-muted flex items-center gap-1 justify-center text-muted-foreground transition-colors">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline text-xs font-medium">{t.editor.guide.hilfeKurz}</span>
          </button>
          {/* Undo / Redo / Snap */}
          <div data-tour="werkzeuge" className="flex items-center gap-0.5 rounded-lg border border-input p-0.5">
            <button type="button" onClick={undo} disabled={!historieStand.kannUndo}
              aria-label={t.editor.rueckgaengig} title={t.editor.rueckgaengig}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={redo} disabled={!historieStand.kannRedo}
              aria-label={t.editor.wiederholen} title={t.editor.wiederholen}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setSnapAktiv((v) => !v)}
              aria-label={t.editor.amRasterAusrichten} aria-pressed={snapAktiv}
              title={snapAktiv ? t.editor.rasterAktiv : t.editor.rasterAus}
              className={`h-7 px-1.5 sm:px-2 rounded-md flex items-center gap-1 justify-center transition-colors ${
                snapAktiv ? "bg-primary/15 text-primary" : "hover:bg-muted text-muted-foreground"
              }`}>
              <Magnet className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">{t.editor.rasterKurz}</span>
            </button>
            <button type="button" onClick={() => { setSperrModus((v) => !v); setBarrierefreiModus(false); setAuswahl(null); }}
              aria-label={t.editor.sitzeSperren} aria-pressed={sperrModus}
              title={t.editor.sperrmodusTitle}
              className={`h-7 px-1.5 sm:px-2 rounded-md flex items-center gap-1 justify-center transition-colors ${
                sperrModus ? "bg-destructive/15 text-destructive" : "hover:bg-muted text-muted-foreground"
              }`}>
              <Ban className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">{t.editor.sperrenKurz}</span>
            </button>
            <button type="button" onClick={() => { setBarrierefreiModus((v) => !v); setSperrModus(false); setAuswahl(null); }}
              aria-label={t.editor.barrierefreieMarkieren} aria-pressed={barrierefreiModus}
              title={t.editor.barrierefreiModusTitle}
              className={`h-7 px-1.5 sm:px-2 rounded-md flex items-center gap-1 justify-center transition-colors ${
                barrierefreiModus ? "bg-sky-100 text-sky-700" : "hover:bg-muted text-muted-foreground"
              }`}>
              <Wheelchair className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">{t.editor.barrierefreiKurz}</span>
            </button>
          </div>
          {/* Zoom-Steuerung */}
          <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-input p-0.5">
            <button type="button" onClick={() => zoomSchritt(-1)} disabled={editorZoom <= ZOOM_STUFEN[0]}
              aria-label={t.editor.verkleinern}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setEditorZoom(1)}
              className="h-7 min-w-[44px] px-1 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground tabular-nums">
              {Math.round(editorZoom * 100)}%
            </button>
            <button type="button" onClick={() => zoomSchritt(1)} disabled={editorZoom >= ZOOM_STUFEN[ZOOM_STUFEN.length - 1]}
              aria-label={t.editor.vergroessern}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground hidden xl:inline">
            {gesamtSitze} {t.editor.plaetze}
            {maxUmsatzCent > 0 && (
              <> · {t.editor.maxLabel} <strong className="text-foreground font-semibold">
                {(maxUmsatzCent / 100).toLocaleString(currencyLocale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </strong></>
            )}
          </span>
          {gespeichert && !hatDuplikate && <span className="text-xs text-green-600 font-medium hidden sm:inline">✓ {t.editor.gespeichert}</span>}
          {hatDuplikate && <span className="text-xs text-destructive font-medium">{t.editor.doppelteSitzIds}</span>}
          <Button size="sm" onClick={speichern} disabled={speichernLaedt || hatDuplikate} data-tour="speichern">
            <Save className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{speichernLaedt ? t.editor.speichernLaedt : t.editor.speichern}</span>
          </Button>
        </div>
      </div>

      {/* Hauptbereich: Canvas + kontext-sensitive Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas column: canvas + bottom build-bar */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div
          ref={canvasContainerRef}
          data-tour="canvas"
          className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center gap-3 bg-slate-100"
        >
          {verkauft.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800 font-medium shrink-0">
              <Lock className="h-4 w-4 shrink-0" />
              {fmt(t.editor.verkaufteWarnung, { n: verkauft.size })}
            </div>
          )}
          {ausserhalbElemente.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800 font-medium shrink-0">
              <WarningCircle className="h-4 w-4 shrink-0" />
              <span>{fmt(ausserhalbElemente.length === 1 ? t.editor.ausserhalbBanner : t.editor.ausserhalbBanner_pl, { n: ausserhalbElemente.length })}</span>
              <button type="button" onClick={() => setElementListeOffen(true)}
                className="underline underline-offset-2 hover:no-underline shrink-0">
                {t.editor.ausserhalbAnzeigen}
              </button>
            </div>
          )}
          {schutzHinweis && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 px-4 py-2 text-sm text-destructive font-medium shrink-0">
              {schutzHinweis}
            </div>
          )}
          {sperrModus && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/25 px-4 py-2 text-sm text-destructive font-medium shrink-0">
              <Ban className="h-4 w-4 shrink-0" />
              {t.editor.sperrmodusBanner}
              · {konfig.gesperrteSitze?.length ?? 0} {t.editor.gesperrt}
            </div>
          )}
          {barrierefreiModus && (
            <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 px-4 py-2 text-sm text-sky-800 font-medium shrink-0">
              <Wheelchair className="h-4 w-4 shrink-0" />
              {t.editor.barrierefreiBanner}
              · {konfig.barrierefreieSitze?.length ?? 0} {t.editor.markiert}
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
              sperrModus={sperrModus || barrierefreiModus}
              belegteSitze={sperrModus || (konfig.gesperrteSitze?.length ?? 0) > 0 ? new Set(konfig.gesperrteSitze ?? []) : undefined}
              barrierefreieSitze={new Set(konfig.barrierefreieSitze ?? [])}
              onSitzKlicken={sperrModus ? sitzSperrungToggeln : barrierefreiModus ? sitzBarrierefreiToggeln : undefined}
              auswahl={auswahl}
              onAuswaehlen={waehleAus}
              onElementVerschieben={elementVerschieben}
              onMehrereElementeVerschieben={elementeMehrfachVerschieben}
              onBuehneVerschieben={buehneVerschieben}
              onBuehneTransformiert={buehneTransformiert}
              texte={{
                editorAria: t.editor.canvasAria,
                textFallback: t.editor.canvasTextFallback,
                stehplatzInfo: t.editor.stehplatzInfo,
                currencyLocale,
              }}
            />
            </ErrorBoundary>
          </div>
        </div>

        {/* Build-Bar: Plan-Kennzahlen + Kategorie-Badges + Element hinzufügen / Preiskategorien / Planeinstellungen.
            Bewusst großzügig dimensioniert — das ist die primäre Aktionsleiste des Editors. */}
        <div className="shrink-0 border-t border-border bg-card px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="font-mono text-base font-semibold whitespace-nowrap">
            {gesamtSitze}
            <span className="text-xs text-muted-foreground font-sans font-medium ml-1.5">
              {konfig.elemente.length} {konfig.elemente.length !== 1 ? t.editorToolbar.elementPl : t.editorToolbar.elementSg} · {t.editorToolbar.plaetze}
            </span>
          </span>
          <div className="flex flex-wrap gap-1 min-w-0">
            {konfig.kategorien.map((k) => (
              <span key={k.id} className="text-xs font-medium px-1.5 py-0.5 rounded-sm border whitespace-nowrap"
                style={{ borderColor: k.farbe, color: k.farbe }}>
                {k.name}
              </span>
            ))}
          </div>
          <div className="flex gap-2 sm:gap-3 ml-auto">
            <Button variant="outline" className="rounded-full" onClick={() => setModalOffen("element")} data-tour="element-hinzufuegen">
              <Plus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">{t.editorToolbar.elementHinzufuegen}</span>
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setModalOffen("kategorien")} data-tour="preiskategorien">
              <Tags className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">{t.editorToolbar.preiskategorien}</span>
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setModalOffen("einstellungen")} data-tour="planeinstellungen">
              <SlidersHorizontal className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">{t.editorToolbar.planeinstellungen}</span>
            </Button>
          </div>
        </div>
        </div>

        {/* Desktop Sidebar (lg+) */}
        <aside data-tour="sidebar" className="hidden lg:flex w-64 border-l border-border bg-background flex-col overflow-hidden shrink-0">
          {sidebarInhalt()}
        </aside>
      </div>

      <ElementListeModal
        open={elementListeOffen}
        onClose={() => setElementListeOffen(false)}
        elemente={konfig.elemente}
        buehne={konfig.buehne}
        kategorien={konfig.kategorien}
        ausgewaehlteId={
          auswahl?.typ === "buehne" ? "buehne"
          : auswahl?.typ === "element" && auswahl.ids.length === 1 ? auswahl.ids[0]
          : null
        }
        ausserhalbIds={ausserhalbIds}
        onAuswaehlen={elementListeAuswahl}
      />
      <EditorGuideModal open={guideOffen} onClose={guideSchliessen} onStartTour={tourStarten} />
      {tourOffen && <EditorTour onClose={tourSchliessen} />}

      {/* Element hinzufügen / Preiskategorien / Planeinstellungen — Modals */}
      <Modal open={modalOffen === "element"} onOpenChange={(o) => !o && setModalOffen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.editorToolbar.elementHinzufuegen}</DialogTitle></DialogHeader>
          <DialogBody>
            <ElementHinzufuegenInhalt
              onHinzufuegen={(typ) => { elementHinzufuegen(typ); setModalOffen(null); }}
              onBuehneAuswaehlen={() => { waehleAus({ typ: "buehne" }); setModalOffen(null); }}
            />
          </DialogBody>
        </DialogContent>
      </Modal>

      <Modal open={modalOffen === "kategorien"} onOpenChange={(o) => !o && setModalOffen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.editorToolbar.preiskategorien}</DialogTitle></DialogHeader>
          <DialogBody>
            <PreiskategorienInhalt kategorien={konfig.kategorien} onChange={kategorienAktualisieren} />
          </DialogBody>
        </DialogContent>
      </Modal>

      <Modal open={modalOffen === "einstellungen"} onOpenChange={(o) => !o && setModalOffen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.editorToolbar.planeinstellungen}</DialogTitle></DialogHeader>
          <DialogBody>
            <PlaneinstellungenInhalt
              raumbreite={konfig.breite}
              raumhoehe={konfig.hoehe}
              onRaumgroesseAktualisieren={raumgroesseAktualisieren}
              onInhaltZentrieren={inhaltZentrieren}
              leer={konfig.elemente.length === 0}
              onBestuhlungErzeugen={(reihen, sitze, gang) => { bestuhlungErzeugen(reihen, sitze, gang); setModalOffen(null); }}
              onVorlage={(typ) => { vorlageAnwenden(typ); setModalOffen(null); }}
              tischweiseBuchung={konfig.tischweiseBuchung ?? false}
              onTischweiseBuchungAendern={tischweiseBuchungAendern}
            />
          </DialogBody>
        </DialogContent>
      </Modal>

      {/* Mobile Bottom Sheet (< lg) — Auswahl-Panel, öffnet automatisch bei Auswahl */}
      <Dialog.Root open={mobilePanelOffen} onOpenChange={(open) => { if (!open) mobilePanelSchliessen(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay fixed inset-0 bg-black/40 z-[60] lg:hidden" />
          <Dialog.Content
            className="bottom-sheet fixed bottom-0 left-0 right-0 z-[70] lg:hidden bg-card rounded-t-2xl shadow-2xl flex flex-col focus:outline-none"
            style={{ maxHeight: "78vh" }}
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">{t.editor.editorPanel}</Dialog.Title>
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
