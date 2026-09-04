"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapTrifold as Map, Plus, Trash as Trash2 } from "@phosphor-icons/react";
import Link from "next/link";
import { useT } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";
import { LOCALE_LABELS } from "@/lib/i18n";

type Sitzplan = { id: string; name: string };
type Lang = "de" | "en" | "hu";

// Radix Select erlaubt keinen leeren String als Item-Value — Sentinel für
// die "kein Saalplan"-Option, wird beim Lesen/Schreiben auf "" gemappt.
const KEIN_SAALPLAN = "__kein_saalplan__";

export type Etage = {
  id: string;
  name: string;
  sitzplan_id: string;
  translations?: Partial<Record<"en" | "hu", { name: string }>>;
};

const FLAG: Record<Lang, string> = { de: "DE", en: "EN", hu: "HU" };

function etageVonSitzplanId(sitzplanId: string | null, hauptebene: string): Etage[] {
  if (!sitzplanId) return [];
  return [{ id: crypto.randomUUID(), name: hauptebene, sitzplan_id: sitzplanId }];
}

export default function SitzplanZuweisung({
  eventId,
  venueId,
  aktuellerSitzplanId,
  aktuelleEtagen,
  sitzplaene,
  eventSprachen = ["de"],
}: {
  eventId: string;
  venueId: string | null;
  aktuellerSitzplanId: string | null;
  aktuelleEtagen: Etage[] | null;
  sitzplaene: Sitzplan[];
  eventSprachen?: string[];
}) {
  const t = useT();
  const router = useRouter();
  const [laedt, setLaedt] = useState(false);
  const [gespeichert, setGespeichert] = useState(false);
  const [aktiveSprache, setAktiveSprache] = useState<Lang>("de");

  const initialEtagen: Etage[] = aktuelleEtagen?.length
    ? aktuelleEtagen
    : etageVonSitzplanId(aktuellerSitzplanId, t.sitzplanZuweisung.hauptebene);

  const [etagen, setEtagen] = useState<Etage[]>(initialEtagen);

  const zusatzSprachen = (eventSprachen.filter((l) => l !== "de") as Lang[]).filter((l) =>
    ["en", "hu"].includes(l)
  );
  const hatMehrSprachen = zusatzSprachen.length > 0;

  function etageHinzufuegen() {
    setEtagen((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: fmt(t.sitzplanZuweisung.ebeneN, { n: prev.length + 1 }), sitzplan_id: "" },
    ]);
    setGespeichert(false);
  }

  function etageEntfernen(id: string) {
    setEtagen((prev) => prev.filter((e) => e.id !== id));
    setGespeichert(false);
  }

  function etageAktualisieren(id: string, delta: Partial<Etage>) {
    setEtagen((prev) => prev.map((e) => (e.id === id ? { ...e, ...delta } : e)));
    setGespeichert(false);
  }

  function setEtageName(id: string, lang: Lang, value: string) {
    if (lang === "de") {
      etageAktualisieren(id, { name: value });
    } else {
      setEtagen((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, translations: { ...e.translations, [lang]: { name: value } } }
            : e
        )
      );
      setGespeichert(false);
    }
  }

  function getEtageName(etage: Etage, lang: Lang): string {
    if (lang === "de") return etage.name;
    return etage.translations?.[lang]?.name ?? "";
  }

  async function speichern() {
    setLaedt(true);
    setGespeichert(false);
    const supabase = createClient();

    const gueltigeEtagen = etagen.filter((e) => e.sitzplan_id);
    const ersteSitzplanId = gueltigeEtagen[0]?.sitzplan_id ?? null;

    await supabase
      .from("events")
      .update({
        etagen: gueltigeEtagen.length > 0 ? gueltigeEtagen : null,
        sitzplan_id: ersteSitzplanId,
      })
      .eq("id", eventId);

    setLaedt(false);
    setGespeichert(true);
    router.refresh();
  }

  // Leerzustände nicht verschlucken — sonst Sackgasse ohne Sitzplan
  if (sitzplaene.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Map className="h-4 w-4" /> {t.sitzplanZuweisung.titelSitzplan}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {venueId ? (
            <div className="text-xs text-muted-foreground space-y-2">
              <p>{t.sitzplanZuweisung.keinSitzplanVenue}</p>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/venues/${venueId}/seatmap/new`}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> {t.sitzplanZuweisung.sitzplanErstellen}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t.sitzplanZuweisung.keinVenueHinweis}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const mehrereEbenen = etagen.length > 1;
  const alleSprachen: Lang[] = ["de", ...zusatzSprachen];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Map className="h-4 w-4" />
          {mehrereEbenen ? t.sitzplanZuweisung.titelSaalplaeneEbenen : t.sitzplanZuweisung.titelSaalplan}
        </CardTitle>
        <CardDescription className="text-xs">{t.sitzplanZuweisung.beschreibung}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Language tabs for floor names */}
        {hatMehrSprachen && (
          <div className="flex gap-0.5 border-b border-border mb-1">
            {alleSprachen.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setAktiveSprache(lang)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors relative ${
                  aktiveSprache === lang ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {FLAG[lang]} {lang.toUpperCase()}
                {aktiveSprache === lang && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {etagen.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t.sitzplanZuweisung.keineEbene}</p>
        ) : (
          <div className="space-y-3">
            {etagen.map((etage, idx) => (
              <div key={etage.id} className="space-y-1.5">
                {/* Kontext beim Übersetzen: ohne diesen Hinweis sind bei
                    mehreren Abschnitten in fremdsprachigen Tabs nur leere,
                    nicht unterscheidbare Textfelder zu sehen. */}
                {aktiveSprache !== "de" && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {etage.name || fmt(t.sitzplanZuweisung.ebeneN, { n: idx + 1 })}
                    {sitzplaene.find((p) => p.id === etage.sitzplan_id) &&
                      ` · ${sitzplaene.find((p) => p.id === etage.sitzplan_id)!.name}`}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={getEtageName(etage, aktiveSprache)}
                    onChange={(e) => setEtageName(etage.id, aktiveSprache, e.target.value)}
                    placeholder={
                      aktiveSprache === "de"
                        ? fmt(t.sitzplanZuweisung.ebeneN, { n: idx + 1 })
                        : fmt(t.sitzplanZuweisung.nameUebersetzungPlaceholder, { lang: LOCALE_LABELS[aktiveSprache] })
                    }
                    className="h-7 flex-1 text-xs rounded-md border border-input bg-transparent px-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  {mehrereEbenen && (
                    <button
                      type="button"
                      onClick={() => etageEntfernen(etage.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {aktiveSprache === "de" && (
                  <Select
                    value={etage.sitzplan_id || KEIN_SAALPLAN}
                    onValueChange={(v) => etageAktualisieren(etage.id, { sitzplan_id: v === KEIN_SAALPLAN ? "" : v })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={KEIN_SAALPLAN}>{t.sitzplanZuweisung.keinSaalplanOption}</SelectItem>
                      {sitzplaene.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {mehrereEbenen && idx < etagen.length - 1 && <div className="h-px bg-border mt-1" />}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={etageHinzufuegen}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> {t.sitzplanZuweisung.ebeneHinzufuegen}
        </button>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={speichern} disabled={laedt}>
            {laedt ? t.common.speichernLaeuft : t.common.speichern}
          </Button>
          {gespeichert && <span className="text-xs text-green-600">✓ {t.common.gespeichert}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
