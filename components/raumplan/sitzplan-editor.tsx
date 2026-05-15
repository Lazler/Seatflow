"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import EditorToolbar from "./editor-toolbar";
import {
  type Reihe,
  type SitzKategorie,
  type SitzplanKonfiguration,
  naechsteBezeichnung,
} from "@/types/sitzplan";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Canvas läuft nur client-side (Konva braucht window/document)
const SitzplanCanvas = dynamic(() => import("./sitzplan-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-50 rounded-lg border border-border flex items-center justify-center text-muted-foreground text-sm">
      Canvas wird geladen...
    </div>
  ),
});

type Props = {
  planId: string;
  planName: string;
  venueId: string;
  venueName: string;
  initialKonfiguration: SitzplanKonfiguration;
};

const STANDARD_SITZABSTAND = 34;
const ERSTE_REIHE_Y = 160;
const REIHEN_ABSTAND = 44;

export default function SitzplanEditor({
  planId,
  planName,
  venueId,
  venueName,
  initialKonfiguration,
}: Props) {
  const router = useRouter();
  const [konfiguration, setKonfiguration] =
    useState<SitzplanKonfiguration>(initialKonfiguration);
  const [ausgewaehlteReiheId, setAusgewaehlteReiheId] = useState<string | null>(null);
  const [speichernLaedt, setSpeichernLaedt] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);

  const gesamtSitze = konfiguration.reihen.reduce(
    (s, r) => s + r.anzahlSitze,
    0
  );

  function reiheHinzufuegen() {
    const bezeichnung = naechsteBezeichnung(konfiguration.reihen);
    const letzteReiheY =
      konfiguration.reihen.length > 0
        ? Math.max(...konfiguration.reihen.map((r) => r.y))
        : ERSTE_REIHE_Y - REIHEN_ABSTAND;

    const neueReihe: Reihe = {
      id: crypto.randomUUID(),
      bezeichnung,
      y: letzteReiheY + REIHEN_ABSTAND,
      anzahlSitze: 10,
      sitzAbstand: STANDARD_SITZABSTAND,
      kategorie: "standard",
    };

    setKonfiguration((k) => ({ ...k, reihen: [...k.reihen, neueReihe] }));
    setAusgewaehlteReiheId(neueReihe.id);
    setGespeichert(false);
  }

  function reiheLoeschen(id: string) {
    setKonfiguration((k) => ({
      ...k,
      reihen: k.reihen.filter((r) => r.id !== id),
    }));
    setAusgewaehlteReiheId(null);
    setGespeichert(false);
  }

  function reiheAktualisieren(id: string, delta: Partial<Reihe>) {
    setKonfiguration((k) => ({
      ...k,
      reihen: k.reihen.map((r) => (r.id === id ? { ...r, ...delta } : r)),
    }));
    setGespeichert(false);
  }

  const reiheVerschieben = useCallback((id: string, neuesY: number) => {
    setKonfiguration((k) => ({
      ...k,
      reihen: k.reihen.map((r) => (r.id === id ? { ...r, y: neuesY } : r)),
    }));
    setGespeichert(false);
  }, []);

  async function speichern() {
    setSpeichernLaedt(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("sitzplaene")
      .update({ konfiguration })
      .eq("id", planId);

    setSpeichernLaedt(false);

    if (!error) {
      setGespeichert(true);
      router.refresh();
    }
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

      {/* Editor-Bereich */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-muted/20">
          <div
            className="rounded-xl border border-border shadow-sm overflow-hidden"
            style={{ width: konfiguration.breite, minHeight: konfiguration.hoehe }}
          >
            <SitzplanCanvas
              konfiguration={konfiguration}
              ausgewaehlteReiheId={ausgewaehlteReiheId}
              onReiheAuswaehlen={setAusgewaehlteReiheId}
              onReiheVerschieben={reiheVerschieben}
            />
          </div>
        </div>

        {/* Toolbar */}
        <aside className="w-64 border-l border-border bg-background p-4 flex flex-col overflow-hidden shrink-0">
          <EditorToolbar
            reihen={konfiguration.reihen}
            ausgewaehlteReiheId={ausgewaehlteReiheId}
            speichernLaedt={speichernLaedt}
            gesamtSitze={gesamtSitze}
            onReiheHinzufuegen={reiheHinzufuegen}
            onReiheLoeschen={reiheLoeschen}
            onSitzeAendern={(id, delta) =>
              reiheAktualisieren(id, {
                anzahlSitze: Math.min(
                  40,
                  Math.max(
                    1,
                    (konfiguration.reihen.find((r) => r.id === id)?.anzahlSitze ?? 10) + delta
                  )
                ),
              })
            }
            onKategorieAendern={(id, kategorie: SitzKategorie) =>
              reiheAktualisieren(id, { kategorie })
            }
            onBezeichnungAendern={(id, bezeichnung) =>
              reiheAktualisieren(id, { bezeichnung })
            }
            onReiheAuswaehlen={setAusgewaehlteReiheId}
            onSpeichern={speichern}
          />
        </aside>
      </div>
    </div>
  );
}
