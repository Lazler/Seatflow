"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/i18n-provider";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

type Venue = { id: string; name: string };
type LangContent = { titel: string; beschreibung: string };

const ADDITIONAL_LOCALES: Locale[] = ["en", "hu"];

export default function NeuesEventFormular({
  venues,
  vorausgewaehlteVenueId,
}: {
  venues: Venue[];
  vorausgewaehlteVenueId?: string;
}) {
  const router = useRouter();
  const t = useT();

  const [venueId, setVenueId] = useState(vorausgewaehlteVenueId ?? "");
  const [datum, setDatum] = useState("");
  const [einlassDatum, setEinlassDatum] = useState("");
  const [preisEuro, setPreisEuro] = useState("");
  const [maxTickets, setMaxTickets] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  // Multilingual content
  const [zusatzSprachen, setZusatzSprachen] = useState<Locale[]>([]);
  const [aktiveSprache, setAktiveSprache] = useState<Locale>("de");
  const [deContent, setDeContent] = useState<LangContent>({ titel: "", beschreibung: "" });
  const [translations, setTranslations] = useState<Partial<Record<Locale, LangContent>>>({});

  const alleSprachen: Locale[] = ["de", ...zusatzSprachen];

  function toggleSprache(lang: Locale) {
    setZusatzSprachen((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
    // Remove content if language deactivated
    setTranslations((prev) => {
      const next = { ...prev };
      if (translations[lang]) delete next[lang];
      return next;
    });
    if (aktiveSprache === lang) setAktiveSprache("de");
  }

  function setContent(lang: Locale, field: keyof LangContent, value: string) {
    if (lang === "de") {
      setDeContent((prev) => ({ ...prev, [field]: value }));
    } else {
      setTranslations((prev) => ({
        ...prev,
        [lang]: { ...((prev[lang] as LangContent) ?? { titel: "", beschreibung: "" }), [field]: value },
      }));
    }
  }

  function getContent(lang: Locale): LangContent {
    if (lang === "de") return deContent;
    return (translations[lang] as LangContent) ?? { titel: "", beschreibung: "" };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/anmelden"); return; }

    const preisInCent = Math.round(parseFloat(preisEuro.replace(",", ".")) * 100);
    if (isNaN(preisInCent) || preisInCent < 0) {
      setFehler("Ungültiger Ticketpreis.");
      setLaedt(false);
      return;
    }

    // Build translations object (only include langs with a title)
    const translationsClean: Record<string, { titel: string; beschreibung: string }> = {};
    for (const lang of zusatzSprachen) {
      const c = getContent(lang);
      if (c.titel.trim()) translationsClean[lang] = { titel: c.titel.trim(), beschreibung: c.beschreibung.trim() };
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        veranstalter_id: user.id,
        venue_id: venueId || null,
        titel: deContent.titel,
        beschreibung: deContent.beschreibung || null,
        datum: new Date(datum).toISOString(),
        einlass_datum: einlassDatum ? new Date(einlassDatum).toISOString() : null,
        ticket_preis_cent: preisInCent,
        max_tickets: maxTickets ? parseInt(maxTickets) : null,
        status: "entwurf",
        sprachen: alleSprachen,
        translations: translationsClean,
      })
      .select("id")
      .single();

    if (error) {
      setFehler("Event konnte nicht gespeichert werden.");
      setLaedt(false);
      return;
    }

    router.push(`/dashboard/events/${data.id}`);
  }

  const content = getContent(aktiveSprache);

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/events"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.eventForm.neuesEvent}</h1>
          <p className="text-muted-foreground text-sm">{t.eventForm.subtitle}</p>
        </div>
      </div>

      {venues.length === 0 && (
        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <p>
            {t.eventForm.keinVenue}{" "}
            <Link href="/dashboard/venues/neu" className="text-primary hover:underline">{t.eventForm.venuAnlegen}</Link>{" "}
            {t.eventForm.umAuszuwaehlen}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.eventForm.eventDetails}</CardTitle>
          <CardDescription>{t.eventForm.entwurfHinweis}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Language selection */}
            <div className="space-y-2">
              <Label className="text-sm">{t.eventForm.sprachenLabel}</Label>
              <p className="text-xs text-muted-foreground">{t.eventForm.sprachenHinweis}</p>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/40 text-sm">
                  <span>🇩🇪</span>
                  <span className="font-medium">Deutsch</span>
                  <span className="text-xs text-muted-foreground">(aktiv)</span>
                </div>
                {ADDITIONAL_LOCALES.map((lang) => {
                  const active = zusatzSprachen.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleSprache(lang)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
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
            </div>

            {/* Language tabs for content fields */}
            {alleSprachen.length > 1 && (
              <div className="flex gap-0.5 border-b border-border">
                {alleSprachen.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setAktiveSprache(lang)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors relative ${
                      aktiveSprache === lang ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "de" ? "🇩🇪" : lang === "en" ? "🇬🇧" : "🇭🇺"} {LOCALE_LABELS[lang]}
                    {aktiveSprache === lang && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </button>
                ))}
              </div>
            )}

            {alleSprachen.length > 1 && (
              <p className="text-xs text-muted-foreground -mt-2">
                {t.eventForm.uebersetzungTabHinweis.replace("{lang}", LOCALE_LABELS[aktiveSprache])}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="titel">{t.eventForm.titelLabel}</Label>
              <Input
                id="titel"
                placeholder={aktiveSprache === "de" ? t.eventForm.titelPlaceholder : ""}
                value={content.titel}
                onChange={(e) => setContent(aktiveSprache, "titel", e.target.value)}
                required={aktiveSprache === "de"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beschreibung">{t.eventForm.beschreibungLabel}</Label>
              <textarea
                id="beschreibung"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={aktiveSprache === "de" ? t.eventForm.beschreibungPlaceholder : ""}
                value={content.beschreibung}
                onChange={(e) => setContent(aktiveSprache, "beschreibung", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">{t.eventForm.venueLabel}</Label>
              <select
                id="venue"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
              >
                <option value="">{t.eventForm.keinVenueOption}</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="datum">{t.eventForm.datumLabel}</Label>
                <Input id="datum" type="datetime-local" value={datum} onChange={(e) => setDatum(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="einlass">{t.eventForm.einlassLabel}</Label>
                <Input id="einlass" type="datetime-local" value={einlassDatum} onChange={(e) => setEinlassDatum(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="preis">{t.eventForm.preisLabel}</Label>
                <Input
                  id="preis" type="text" inputMode="decimal"
                  placeholder={t.eventForm.preisPlaceholder}
                  value={preisEuro} onChange={(e) => setPreisEuro(e.target.value)} required
                />
                <p className="text-xs text-muted-foreground">{t.eventForm.preisHinweis}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTickets">{t.eventForm.maxLabel}</Label>
                <Input
                  id="maxTickets" type="number" min="1"
                  placeholder={t.eventForm.maxPlaceholder}
                  value={maxTickets} onChange={(e) => setMaxTickets(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t.eventForm.maxHinweis}</p>
              </div>
            </div>

            {fehler && <p className="text-sm text-destructive">{fehler}</p>}

            <Button type="submit" className="w-full" disabled={laedt}>
              {laedt ? t.eventForm.speichert : t.eventForm.anlegen}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
