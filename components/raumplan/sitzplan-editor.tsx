"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EditorToolbar from "./editor-toolbar";
import ElementEigenschaftenPanel from "./element-eigenschaften-panel";
import type { Auswahl } from "./sitzplan-canvas";
import {
  type SitzplanElement, type SitzplanKonfiguration, type ElementTyp, type Buehne, type Preiskategorie,
  type ReiheElement, type TischreiheElement, type RundtischElement,
  naechsteBezeichnung, migrierteKonfiguration, elementSitzIds, DEFAULT_KATEGORIEN,
} from "@/types/sitzplan";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, ChevronLeft, MousePointer2, Trash2 } from "lucide-react";
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
  const [speichernLaedt, setSpeichernLaedt] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);

  const gesamtSitze = konfig.elemente.reduce((s, e) => s + elementSitzIds(e).length, 0);

  function naechstesY(): number {
    if (konfig.elemente.length === 0) return Math.round(konfig.hoehe * 0.4);
    const maxY = Math.max(...konfig.elemente.map((e) => e.y));
    return Math.min(maxY + 70, konfig.hoehe - 60);
  }

  function elementHinzufuegen(typ: ElementTyp) {
    const bezeichnung = naechsteBezeichnung(konfig.elemente, typ === "reihe" ? "" : typ === "tischreihe" ? "T" : "R");
    const defaultKatId = konfig.kategorien[0]?.id ?? DEFAULT_KATEGORIEN[0].id;
    const basis = { id: crypto.randomUUID(), bezeichnung, x: Math.round(konfig.breite / 2), y: naechstesY(), winkel: 0, kategorie_id: defaultKatId };

    let neuesElement: SitzplanElement;
    if      (typ === "reihe")      neuesElement = { ...basis, typ: "reihe",      anzahlSitze: 10, sitzAbstand: 34 } satisfies ReiheElement;
    else if (typ === "tischreihe") neuesElement = { ...basis, typ: "tischreihe", sitzeProSeite: 4, sitzeOben: true, sitzeUnten: true } satisfies TischreiheElement;
    else                           neuesElement = { ...basis, typ: "rundtisch",  anzahlSitze: 8,  tischRadius: 35 } satisfies RundtischElement;

    setKonfig((k) => ({ ...k, elemente: [...k.elemente, neuesElement] }));
    setAuswahl({ typ: "element", ids: [neuesElement.id] });
    setGespeichert(false);
  }

  function elementLoeschen(id: string) {
    setKonfig((k) => ({ ...k, elemente: k.elemente.filter((e) => e.id !== id) }));
    setAuswahl(null);
    setGespeichert(false);
  }

  function elementDuplizieren(id: string) {
    const original = konfig.elemente.find((e) => e.id === id);
    if (!original) return;
    const kopie: SitzplanElement = {
      ...original,
      id: crypto.randomUUID(),
      bezeichnung: naechsteBezeichnung(konfig.elemente,
        original.typ === "reihe" ? "" : original.typ === "tischreihe" ? "T" : "R"),
      x: Math.min(original.x + 40, konfig.breite - 60),
      y: Math.min(original.y + 40, konfig.hoehe - 60),
    };
    setKonfig((k) => ({ ...k, elemente: [...k.elemente, kopie] }));
    setAuswahl({ typ: "element", ids: [kopie.id] });
    setGespeichert(false);
  }

  function elementAktualisieren(id: string, delta: Partial<SitzplanElement>) {
    setKonfig((k) => ({
      ...k,
      elemente: k.elemente.map((e) => (e.id === id ? ({ ...e, ...delta } as SitzplanElement) : e)),
    }));
    setGespeichert(false);
  }

  const elementVerschieben = useCallback((id: string, x: number, y: number) => {
    setKonfig((k) => ({ ...k, elemente: k.elemente.map((e) => e.id === id ? { ...e, x, y } : e) }));
    setGespeichert(false);
  }, []);

  const elementeMehrfachVerschieben = useCallback((list: { id: string; x: number; y: number }[]) => {
    setKonfig((k) => ({
      ...k,
      elemente: k.elemente.map((e) => {
        const upd = list.find((u) => u.id === e.id);
        return upd ? { ...e, x: upd.x, y: upd.y } : e;
      }),
    }));
    setGespeichert(false);
  }, []);

  function buehneAktualisieren(delta: Partial<Buehne>) {
    setKonfig((k) => ({ ...k, buehne: { ...k.buehne, ...delta } }));
    setGespeichert(false);
  }

  const buehneVerschieben = useCallback((x: number, y: number) => {
    setKonfig((k) => ({ ...k, buehne: { ...k.buehne, x, y } }));
    setGespeichert(false);
  }, []);

  const buehneTransformiert = useCallback((breite: number, hoehe: number, x: number, y: number, winkel: number) => {
    setKonfig((k) => ({ ...k, buehne: { ...k.buehne, breite, hoehe, x, y, winkel } }));
    setGespeichert(false);
  }, []);

  function kategorienAktualisieren(kategorien: Preiskategorie[]) {
    setKonfig((k) => ({ ...k, kategorien }));
    setGespeichert(false);
  }

  function raumgroesseAktualisieren(breite: number, hoehe: number) {
    setKonfig((k) => ({ ...k, breite, hoehe }));
    setGespeichert(false);
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
        const ids = auswahl?.typ === "element" ? auswahl.ids : [];
        if (ids.length === 0) return;
        setKonfig((k) => ({ ...k, elemente: k.elemente.filter((el) => !ids.includes(el.id)) }));
        setAuswahl(null);
        setGespeichert(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [auswahl]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/venues/${venueId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{venueName}</p>
          <p className="font-semibold text-sm truncate">{planName}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">{konfig.breite} × {konfig.hoehe} px · {gesamtSitze} Plätze</span>
          {gespeichert && <span className="text-xs text-green-600 font-medium">✓ Gespeichert</span>}
          <Button size="sm" onClick={speichern} disabled={speichernLaedt}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {speichernLaedt ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Hauptbereich: Canvas + kontext-sensitive Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-slate-100">
          <div className="rounded-xl border-2 border-slate-300 shadow-lg overflow-hidden"
            style={{ width: konfig.breite, minHeight: konfig.hoehe }}>
            <SitzplanCanvas
              konfiguration={konfig}
              modus="editor"
              auswahl={auswahl}
              onAuswaehlen={setAuswahl}
              onElementVerschieben={elementVerschieben}
              onMehrereElementeVerschieben={elementeMehrfachVerschieben}
              onBuehneVerschieben={buehneVerschieben}
              onBuehneTransformiert={buehneTransformiert}
            />
          </div>
        </div>

        {/* Sidebar: wechselt zwischen globalen Einstellungen und Element-Eigenschaften */}
        <aside className="w-64 border-l border-border bg-background flex flex-col overflow-hidden shrink-0">
          {auswahlIds.length > 1 ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <button type="button" onClick={() => setAuswahl(null)}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
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
                    setKonfig((k) => ({ ...k, elemente: k.elemente.filter((e) => !auswahlIds.includes(e.id)) }));
                    setAuswahl(null);
                    setGespeichert(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-input text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> {auswahlIds.length} Elemente löschen
                </button>
              </div>
            </div>
          ) : ausgewaehltesElement ? (
            <ElementEigenschaftenPanel
              el={ausgewaehltesElement}
              kategorien={konfig.kategorien}
              alleBezeichnungen={alleBezeichnungen}
              onChange={(d) => elementAktualisieren(ausgewaehltesElement.id, d)}
              onLoeschen={() => elementLoeschen(ausgewaehltesElement.id)}
              onSchliessen={() => setAuswahl(null)}
              onDuplizieren={() => elementDuplizieren(ausgewaehltesElement.id)}
            />
          ) : (
            <EditorToolbar
              elemente={konfig.elemente}
              buehne={konfig.buehne}
              kategorien={konfig.kategorien}
              raumbreite={konfig.breite}
              raumhoehe={konfig.hoehe}
              gesamtSitze={gesamtSitze}
              onHinzufuegen={elementHinzufuegen}
              onBuehneAktualisieren={buehneAktualisieren}
              onKategorienAktualisieren={kategorienAktualisieren}
              onRaumgroesseAktualisieren={raumgroesseAktualisieren}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
