"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EditorToolbar from "./editor-toolbar";
import type { Auswahl } from "./sitzplan-canvas";
import {
  type SitzplanElement,
  type SitzplanKonfiguration,
  type ElementTyp,
  type Buehne,
  type ReiheElement,
  type TischreiheElement,
  type RundtischElement,
  naechsteBezeichnung,
  migrierteKonfiguration,
  elementSitzIds,
} from "@/types/sitzplan";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const SitzplanCanvas = dynamic(() => import("./sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-50 rounded-lg border border-border flex items-center justify-center text-sm text-muted-foreground">
      Canvas wird geladen…
    </div>
  ),
});

type Props = {
  planId: string;
  planName: string;
  venueId: string;
  venueName: string;
  initialKonfiguration: unknown;
};

const ERSTE_Y = 200;
const REIHEN_ABSTAND = 60;

export default function SitzplanEditor({
  planId,
  planName,
  venueId,
  venueName,
  initialKonfiguration,
}: Props) {
  const router = useRouter();
  const [konfig, setKonfig] = useState<SitzplanKonfiguration>(
    migrierteKonfiguration(initialKonfiguration)
  );
  const [auswahl, setAuswahl] = useState<Auswahl>(null);
  const [speichernLaedt, setSpeichernLaedt] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);

  const naechstesY = konfig.elemente.length > 0
    ? Math.max(...konfig.elemente.map((e) => e.y)) + REIHEN_ABSTAND
    : ERSTE_Y;

  const gesamtSitze = konfig.elemente.reduce(
    (s, e) => s + elementSitzIds(e).length,
    0
  );

  function elementHinzufuegen(typ: ElementTyp) {
    const bezeichnung = naechsteBezeichnung(
      konfig.elemente,
      typ === "reihe" ? "" : typ === "tischreihe" ? "T" : "R"
    );
    const basis = {
      id: crypto.randomUUID(),
      bezeichnung,
      x: konfig.breite / 2,
      y: naechstesY,
      winkel: 0,
      kategorie: "standard" as const,
    };

    let neuesElement: SitzplanElement;
    if (typ === "reihe") {
      neuesElement = { ...basis, typ: "reihe", anzahlSitze: 10, sitzAbstand: 34 } satisfies ReiheElement;
    } else if (typ === "tischreihe") {
      neuesElement = { ...basis, typ: "tischreihe", anzahlTische: 4, sitzeProTisch: 3, tischAbstand: 12 } satisfies TischreiheElement;
    } else {
      neuesElement = { ...basis, typ: "rundtisch", anzahlSitze: 8, tischRadius: 35 } satisfies RundtischElement;
    }

    setKonfig((k) => ({ ...k, elemente: [...k.elemente, neuesElement] }));
    setAuswahl({ typ: "element", id: neuesElement.id });
    setGespeichert(false);
  }

  function elementLoeschen(id: string) {
    setKonfig((k) => ({ ...k, elemente: k.elemente.filter((e) => e.id !== id) }));
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
    setKonfig((k) => ({
      ...k,
      elemente: k.elemente.map((e) => (e.id === id ? { ...e, x, y } : e)),
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

  const buehneTransformieren = useCallback(
    (breite: number, hoehe: number, x: number, y: number, winkel: number) => {
      setKonfig((k) => ({ ...k, buehne: { ...k.buehne, breite, hoehe, x, y, winkel } }));
      setGespeichert(false);
    },
    []
  );

  async function speichern() {
    setSpeichernLaedt(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("sitzplaene")
      .update({ konfiguration: konfig })
      .eq("id", planId);
    setSpeichernLaedt(false);
    if (!error) { setGespeichert(true); router.refresh(); }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-background">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/venues/${venueId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{venueName}</p>
          <p className="font-semibold text-sm truncate">{planName}</p>
        </div>
        {gespeichert && (
          <span className="text-xs text-green-600 font-medium">✓ Gespeichert</span>
        )}
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-muted/20">
          <div
            className="rounded-xl border border-border shadow-sm overflow-hidden"
            style={{ width: konfig.breite, minHeight: konfig.hoehe }}
          >
            <SitzplanCanvas
              konfiguration={konfig}
              auswahl={auswahl}
              onAuswaehlen={setAuswahl}
              onElementVerschieben={elementVerschieben}
              onBuehneVerschieben={buehneVerschieben}
              onBuehneTransformieren={buehneTransformieren}
            />
          </div>
        </div>

        {/* Toolbar */}
        <aside className="w-64 border-l border-border bg-background p-4 flex flex-col overflow-hidden shrink-0">
          <EditorToolbar
            elemente={konfig.elemente}
            auswahl={auswahl}
            buehne={konfig.buehne}
            speichernLaedt={speichernLaedt}
            gesamtSitze={gesamtSitze}
            onHinzufuegen={elementHinzufuegen}
            onLoeschen={elementLoeschen}
            onAktualisieren={elementAktualisieren}
            onBuehneAktualisieren={buehneAktualisieren}
            onAuswaehlen={setAuswahl}
            onSpeichern={speichern}
          />
        </aside>
      </div>
    </div>
  );
}
