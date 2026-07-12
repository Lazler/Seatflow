"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash as Trash2, Tag, CircleNotch as Loader2, Copy, Check } from "@phosphor-icons/react";
import { useT, useLocale } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";

type Gutschein = {
  id: string;
  name: string;
  rabatt: { typ: "prozent" | "fest"; wert: number };
  gueltig_bis: string | null;
  max_einloesungen: number | null;
  eingeloest: number;
  aktiv: boolean;
  codes: string[];
  erstellt_am: string;
};

function CopyButton({ text }: { text: string }) {
  const t = useT();
  const [kopiert, setKopiert] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setKopiert(true);
        setTimeout(() => setKopiert(false), 1500);
      }}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title={t.gutscheine.kopieren}
    >
      {kopiert ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export default function GutscheineClient() {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";

  function euro(wert: number) {
    return wert.toLocaleString(dateLocale, { style: "currency", currency: "EUR" });
  }

  function rabattLabel(g: Gutschein) {
    return g.rabatt.typ === "prozent"
      ? fmt(t.gutscheine.rabattProzent, { wert: g.rabatt.wert })
      : fmt(t.gutscheine.rabattFest, { wert: euro(g.rabatt.wert) });
  }

  const [gutscheine, setGutscheine] = useState<Gutschein[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [formOffen, setFormOffen] = useState(false);
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [loeschtId, setLoeschtId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [rabattTyp, setRabattTyp] = useState<"prozent" | "fest">("prozent");
  const [rabattWert, setRabattWert] = useState("");
  const [code, setCode] = useState("");
  const [gueltigBis, setGueltigBis] = useState("");
  const [maxEinloesungen, setMaxEinloesungen] = useState("");

  const laden = useCallback(async () => {
    setLaedt(true);
    const res = await fetch("/api/vouchers");
    if (res.ok) setGutscheine(await res.json());
    setLaedt(false);
  }, []);

  useEffect(() => { laden(); }, [laden]);

  function formZuruecksetzen() {
    setName(""); setRabattTyp("prozent"); setRabattWert(""); setCode("");
    setGueltigBis(""); setMaxEinloesungen(""); setFehler(null);
  }

  async function erstellen(e: React.FormEvent) {
    e.preventDefault();
    const wert = parseFloat(rabattWert.replace(",", "."));
    if (!wert || wert <= 0) { setFehler(t.gutscheine.fehlerUngueltig); return; }
    if (rabattTyp === "prozent" && wert > 100) { setFehler(t.gutscheine.fehlerMaxProzent); return; }
    setSpeichert(true); setFehler(null);

    const res = await fetch("/api/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, rabattTyp, rabattWert: wert, code,
        gueltigBisDatum: gueltigBis || undefined,
        maxEinloesungen: maxEinloesungen ? parseInt(maxEinloesungen) : undefined,
      }),
    });

    const data = await res.json() as { id?: string; error?: string };
    if (!res.ok) { setFehler(data.error ?? t.gutscheine.fehlerErstellen); setSpeichert(false); return; }

    setSpeichert(false);
    setFormOffen(false);
    formZuruecksetzen();
    laden();
  }

  async function loeschen(id: string) {
    setLoeschtId(id);
    await fetch(`/api/vouchers/${id}`, { method: "DELETE" });
    setLoeschtId(null);
    setGutscheine((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{t.gutscheine.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t.gutscheine.subtitle}
          </p>
        </div>
        {!formOffen && (
          <Button size="sm" onClick={() => setFormOffen(true)} className="self-start sm:self-auto shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> {t.gutscheine.gutscheinErstellen}
          </Button>
        )}
      </div>

      {/* Create form */}
      {formOffen && (
        <Card className="border-primary/30 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="h-4 w-4" /> {t.gutscheine.neuerGutschein}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={erstellen} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.gutscheine.nameLabel}</Label>
                  <Input
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder={t.gutscheine.namePlaceholder} required className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.gutscheine.codeLabel}</Label>
                  <Input
                    value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder={t.gutscheine.codePlaceholder} required className="h-9 font-mono"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.gutscheine.rabattart}</Label>
                  <div className="flex rounded-md border border-input overflow-hidden h-9">
                    {(["prozent", "fest"] as const).map((typ) => (
                      <button
                        key={typ} type="button" onClick={() => setRabattTyp(typ)}
                        className={`flex-1 text-sm font-medium transition-colors ${
                          rabattTyp === typ
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {typ === "prozent" ? t.gutscheine.prozent : t.gutscheine.festbetrag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.gutscheine.rabattwertLabel}</Label>
                  <div className="relative">
                    <Input
                      value={rabattWert} onChange={(e) => setRabattWert(e.target.value)}
                      placeholder={rabattTyp === "prozent" ? "20" : "10,00"}
                      required className="h-9 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                      {rabattTyp === "prozent" ? "%" : "€"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.gutscheine.gueltigBisLabel}</Label>
                  <Input
                    type="date" value={gueltigBis}
                    onChange={(e) => setGueltigBis(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t.gutscheine.maxEinloesungenLabel}</Label>
                  <Input
                    type="number" min="1" value={maxEinloesungen}
                    onChange={(e) => setMaxEinloesungen(e.target.value)}
                    placeholder={t.gutscheine.unbegrenztPlaceholder} className="h-9"
                  />
                </div>
              </div>

              {fehler && <p className="text-sm text-destructive">{fehler}</p>}

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={speichert}>
                  {speichert ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {t.common.erstellen}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setFormOffen(false); formZuruecksetzen(); }}>
                  {t.common.abbrechen}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {laedt ? (
        <div className="flex items-center justify-center py-16 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.gutscheine.laden}
        </div>
      ) : gutscheine.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">{t.gutscheine.keineGutscheine}</p>
          <p className="text-sm mt-1">{t.gutscheine.keineGutscheineText}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.gutscheine.colName}</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.gutscheine.colCodes}</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.gutscheine.colRabatt}</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">{t.gutscheine.colEingeloest}</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">{t.gutscheine.colGueltigBis}</th>
                <th className="text-left px-3 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{t.gutscheine.colStatus}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gutscheine.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3 font-medium">{g.name}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {g.codes.length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        g.codes.map((c) => (
                          <span key={c} className="inline-flex items-center gap-0.5 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {c}
                            <CopyButton text={c} />
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-semibold text-primary">{rabattLabel(g)}</td>
                  <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">
                    {g.eingeloest}{g.max_einloesungen ? ` / ${g.max_einloesungen}` : ""}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground hidden md:table-cell text-xs">
                    {g.gueltig_bis
                      ? new Date(g.gueltig_bis).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })
                      : t.gutscheine.unbegrenzt}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={g.aktiv ? "default" : "secondary"} className="text-xs">
                      {g.aktiv ? t.gutscheine.aktiv : t.gutscheine.inaktiv}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => loeschen(g.id)}
                      disabled={loeschtId === g.id}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-30"
                      title={t.common.loeschen}
                    >
                      {loeschtId === g.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tr className="border-t border-border bg-muted/20">
              <td colSpan={7} className="px-4 py-2.5 text-xs text-muted-foreground">
                {fmt(gutscheine.length === 1 ? t.gutscheine.anzahl : t.gutscheine.anzahl_pl, { n: gutscheine.length })}
              </td>
            </tr>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t.gutscheine.footerHinweis}
      </p>
    </div>
  );
}
