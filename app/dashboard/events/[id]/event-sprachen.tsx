"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Globe, Loader2, Check } from "lucide-react";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";

type LangContent = { titel: string; beschreibung: string };

const ADDITIONAL_LOCALES: Locale[] = ["en", "hu"];

export default function EventSprachen({
  eventId,
  initialSprachen,
  initialTranslations,
  deTitel,
  deBeschreibung,
}: {
  eventId: string;
  initialSprachen: string[];
  initialTranslations: Record<string, LangContent>;
  deTitel: string;
  deBeschreibung: string | null;
}) {
  const [zusatzSprachen, setZusatzSprachen] = useState<Locale[]>(
    (initialSprachen.filter((l) => l !== "de") as Locale[]).filter((l) =>
      ADDITIONAL_LOCALES.includes(l)
    )
  );
  const [aktiveSprache, setAktiveSprache] = useState<Locale>("de");
  const [translations, setTranslations] = useState<Partial<Record<Locale, LangContent>>>(
    Object.fromEntries(
      Object.entries(initialTranslations).filter(([k]) => k !== "de")
    ) as Partial<Record<Locale, LangContent>>
  );
  const [laden, setLaden] = useState(false);
  const [erfolg, setErfolg] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const alleSprachen: Locale[] = ["de", ...zusatzSprachen];

  function toggleSprache(lang: Locale) {
    const isActive = zusatzSprachen.includes(lang);
    setZusatzSprachen((prev) =>
      isActive ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
    if (isActive) {
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[lang];
        return next;
      });
      if (aktiveSprache === lang) setAktiveSprache("de");
    }
    setErfolg(false);
  }

  function setContent(lang: Locale, field: keyof LangContent, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [lang]: { ...((prev[lang] as LangContent) ?? { titel: "", beschreibung: "" }), [field]: value },
    }));
    setErfolg(false);
  }

  function getContent(lang: Locale): LangContent {
    if (lang === "de") return { titel: deTitel, beschreibung: deBeschreibung ?? "" };
    return (translations[lang] as LangContent) ?? { titel: "", beschreibung: "" };
  }

  async function handleSave() {
    setLaden(true);
    setFehler(null);
    setErfolg(false);

    const translationsClean: Record<string, LangContent> = {};
    for (const lang of zusatzSprachen) {
      const c = getContent(lang);
      if (c.titel.trim()) {
        translationsClean[lang] = { titel: c.titel.trim(), beschreibung: c.beschreibung.trim() };
      }
    }

    const res = await fetch(`/api/events/${eventId}/sprachen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprachen: alleSprachen, translations: translationsClean }),
    });

    setLaden(false);
    if (res.ok) {
      setErfolg(true);
    } else {
      setFehler("Fehler beim Speichern.");
    }
  }

  const content = getContent(aktiveSprache);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4" /> Sprachen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40 text-xs">
            <span>🇩🇪</span>
            <span className="font-medium">Deutsch</span>
          </div>
          {ADDITIONAL_LOCALES.map((lang) => {
            const active = zusatzSprachen.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleSprache(lang)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                <span>{lang === "en" ? "🇬🇧" : "🇭🇺"}</span>
                {LOCALE_LABELS[lang]}
                {active ? " ✓" : " +"}
              </button>
            );
          })}
        </div>

        {zusatzSprachen.length > 0 && (
          <>
            <div className="flex gap-0.5 border-b border-border">
              {alleSprachen.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setAktiveSprache(lang)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors relative ${
                    aktiveSprache === lang ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang === "de" ? "🇩🇪" : lang === "en" ? "🇬🇧" : "🇭🇺"} {LOCALE_LABELS[lang]}
                  {aktiveSprache === lang && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              ))}
            </div>

            {aktiveSprache !== "de" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Titel ({LOCALE_LABELS[aktiveSprache]})</Label>
                  <Input
                    value={content.titel}
                    onChange={(e) => setContent(aktiveSprache, "titel", e.target.value)}
                    placeholder={`Titel auf ${LOCALE_LABELS[aktiveSprache]}`}
                    className="text-sm h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Beschreibung ({LOCALE_LABELS[aktiveSprache]})</Label>
                  <textarea
                    className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={content.beschreibung}
                    onChange={(e) => setContent(aktiveSprache, "beschreibung", e.target.value)}
                    placeholder={`Beschreibung auf ${LOCALE_LABELS[aktiveSprache]}`}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Deutsch ist die Hauptsprache und wird direkt am Event gespeichert.
              </p>
            )}
          </>
        )}

        {fehler && <p className="text-xs text-destructive">{fehler}</p>}

        <Button
          size="sm"
          className="w-full"
          onClick={handleSave}
          disabled={laden}
          variant={erfolg ? "default" : "outline"}
        >
          {laden ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : erfolg ? (
            <Check className="h-3.5 w-3.5 mr-1.5" />
          ) : null}
          {laden ? "Wird gespeichert..." : erfolg ? "Gespeichert" : "Sprachen speichern"}
        </Button>
      </CardContent>
    </Card>
  );
}
