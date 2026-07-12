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
import { ArrowLeft, Info, CaretDown, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";

type Venue = { id: string; name: string; hatPlan?: boolean };
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

  // Mehrsprachige Inhalte — DE ist immer sichtbar, Übersetzungen optional
  const [deContent, setDeContent] = useState<LangContent>({ titel: "", beschreibung: "" });
  const [zusatzSprachen, setZusatzSprachen] = useState<Locale[]>([]);
  const [translations, setTranslations] = useState<Partial<Record<Locale, LangContent>>>({});
  const [sprachenOffen, setSprachenOffen] = useState(false);

  const alleSprachen: Locale[] = ["de", ...zusatzSprachen];
  const gewaehlteVenue = venues.find((v) => v.id === venueId);
  const venueOhnePlan = !!gewaehlteVenue && gewaehlteVenue.hatPlan === false;

  function toggleSprache(lang: Locale) {
    setZusatzSprachen((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
    setTranslations((prev) => {
      const next = { ...prev };
      if (translations[lang]) delete next[lang];
      return next;
    });
  }

  function setTranslation(lang: Locale, field: keyof LangContent, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [lang]: { ...((prev[lang] as LangContent) ?? { titel: "", beschreibung: "" }), [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setLaedt(true);

    const preisInCent = Math.round(parseFloat(preisEuro.replace(",", ".")) * 100);
    if (isNaN(preisInCent) || preisInCent < 0) {
      setFehler(t.eventForm.ungueltigerPreis);
      setLaedt(false);
      return;
    }

    const translationsClean: Record<string, { titel: string; beschreibung: string }> = {};
    for (const lang of zusatzSprachen) {
      const c = translations[lang];
      if (c?.titel.trim()) translationsClean[lang] = { titel: c.titel.trim(), beschreibung: c.beschreibung.trim() };
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venue_id: venueId || null,
        titel: deContent.titel,
        beschreibung: deContent.beschreibung || null,
        datum: new Date(datum).toISOString(),
        einlass_datum: einlassDatum ? new Date(einlassDatum).toISOString() : null,
        ticket_preis_cent: preisInCent,
        max_tickets: maxTickets ? parseInt(maxTickets) : null,
        sprachen: alleSprachen,
        translations: translationsClean,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setFehler(json.error ?? t.eventForm.speichernFehler);
      setLaedt(false);
      return;
    }
    router.push(`/dashboard/events/${json.id}`);
  }

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
            <Link href="/dashboard/venues/new" className="text-primary hover:underline">{t.eventForm.venuAnlegen}</Link>{" "}
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
            {/* ── Kern-Felder ── */}
            <div className="space-y-2">
              <Label htmlFor="titel">{t.eventForm.titelLabel}</Label>
              <Input
                id="titel"
                placeholder={t.eventForm.titelPlaceholder}
                value={deContent.titel}
                onChange={(e) => setDeContent((p) => ({ ...p, titel: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beschreibung">{t.eventForm.beschreibungLabel}</Label>
              <textarea
                id="beschreibung"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t.eventForm.beschreibungPlaceholder}
                value={deContent.beschreibung}
                onChange={(e) => setDeContent((p) => ({ ...p, beschreibung: e.target.value }))}
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
              {venueOhnePlan && (
                <p className="flex items-start gap-1.5 text-xs text-amber-600">
                  <WarningCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {t.eventForm.keinSaalplanWarnung}
                </p>
              )}
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

            {/* ── Weitere Sprachen (optional, eingeklappt) ── */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setSprachenOffen((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <CaretDown className={`h-4 w-4 transition-transform ${sprachenOffen ? "rotate-180" : ""}`} />
                {t.eventForm.sprachenLabel} <span className="text-xs font-normal">(optional)</span>
                {zusatzSprachen.length > 0 && (
                  <span className="text-xs font-normal text-primary">· {zusatzSprachen.map((l) => l.toUpperCase()).join(", ")}</span>
                )}
              </button>

              {sprachenOffen && (
                <div className="mt-3 space-y-4">
                  <p className="text-xs text-muted-foreground">{t.eventForm.sprachenHinweis}</p>
                  <div className="flex gap-2 flex-wrap">
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
                          <span className="text-[10px] font-bold border border-border rounded px-1">{lang.toUpperCase()}</span>
                          {LOCALE_LABELS[lang]}{active ? " ✓" : " +"}
                        </button>
                      );
                    })}
                  </div>

                  {zusatzSprachen.map((lang) => (
                    <div key={lang} className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border">
                      <p className="text-xs font-semibold">{LOCALE_LABELS[lang]}</p>
                      <Input
                        placeholder={`${t.eventForm.titelLabel} (${lang.toUpperCase()})`}
                        value={translations[lang]?.titel ?? ""}
                        onChange={(e) => setTranslation(lang, "titel", e.target.value)}
                        className="h-9 text-sm"
                      />
                      <textarea
                        placeholder={`${t.eventForm.beschreibungLabel} (${lang.toUpperCase()})`}
                        value={translations[lang]?.beschreibung ?? ""}
                        onChange={(e) => setTranslation(lang, "beschreibung", e.target.value)}
                        className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              )}
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
