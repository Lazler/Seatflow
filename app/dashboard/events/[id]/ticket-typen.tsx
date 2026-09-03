"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash as Trash2, CaretDown as ChevronDown, CaretUp as ChevronUp, Ticket as Tickets, DotsSixVertical as GripVertical, X } from "@phosphor-icons/react";
import type { TicketTyp, PflichtFeld, PreisRegel } from "@/types/ticket-typ";
import { useT, useLocale } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";
import { LOCALE_LABELS } from "@/lib/i18n";

type Lang = "de" | "en" | "hu";
const FLAG: Record<Lang, string> = { de: "DE", en: "EN", hu: "HU" };
const dateLocaleFor = (l: Lang) => (l === "hu" ? "hu-HU" : l === "en" ? "en-GB" : "de-DE");

const NEUER_TYP = (): TicketTyp => ({
  id: crypto.randomUUID(),
  name: "",
  beschreibung: "",
  preis_regel: { typ: "basis" },
  pflichtfelder: [],
  max_pro_buchung: undefined,
  aktiv: true,
});

const NEUES_FELD = (): PflichtFeld => ({
  id: crypto.randomUUID(),
  label: "",
  typ: "text",
  pflicht: true,
});

function PreisRegelEditor({ regel, onChange }: { regel: PreisRegel; onChange: (r: PreisRegel) => void }) {
  const t = useT();
  return (
    <div className="space-y-2">
      <div className="flex rounded-md border border-input overflow-hidden text-xs">
        {(["basis", "fest", "prozent", "rabatt_cent"] as const).map((typ) => (
          <button
            key={typ}
            type="button"
            onClick={() => {
              if (typ === "basis") onChange({ typ: "basis" });
              else if (typ === "fest") onChange({ typ: "fest", cent: 1000 });
              else if (typ === "prozent") onChange({ typ: "prozent", prozent: 50 });
              else onChange({ typ: "rabatt_cent", cent: 500 });
            }}
            className={`flex-1 py-1.5 font-medium transition-colors ${
              regel.typ === typ
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {typ === "basis" ? t.ticketTypen.regelNormal : typ === "fest" ? t.ticketTypen.regelFest : typ === "prozent" ? t.ticketTypen.regelProzent : t.ticketTypen.regelRabatt}
          </button>
        ))}
      </div>
      {regel.typ === "fest" && (
        <div className="flex items-center gap-2">
          <Input
            type="number" min="0" step="0.01"
            value={(regel.cent / 100).toFixed(2)}
            onChange={(e) => onChange({ typ: "fest", cent: Math.round(parseFloat(e.target.value || "0") * 100) })}
            className="h-8 text-sm w-28"
          />
          <span className="text-sm text-muted-foreground">{t.ticketTypen.festHinweis}</span>
        </div>
      )}
      {regel.typ === "prozent" && (
        <div className="flex items-center gap-2">
          <Input
            type="number" min="1" max="100"
            value={regel.prozent}
            onChange={(e) => onChange({ typ: "prozent", prozent: Math.min(100, Math.max(1, parseInt(e.target.value || "50"))) })}
            className="h-8 text-sm w-20"
          />
          <span className="text-sm text-muted-foreground">{t.ticketTypen.prozentHinweis}</span>
        </div>
      )}
      {regel.typ === "rabatt_cent" && (
        <div className="flex items-center gap-2">
          <Input
            type="number" min="0" step="0.01"
            value={(regel.cent / 100).toFixed(2)}
            onChange={(e) => onChange({ typ: "rabatt_cent", cent: Math.round(parseFloat(e.target.value || "0") * 100) })}
            className="h-8 text-sm w-28"
          />
          <span className="text-sm text-muted-foreground">{t.ticketTypen.rabattHinweis}</span>
        </div>
      )}
    </div>
  );
}

function PflichtFeldEditor({ feld, onChange, onDelete }: {
  feld: PflichtFeld;
  onChange: (f: Partial<PflichtFeld>) => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <div className="flex gap-2 items-start p-2.5 rounded-lg bg-muted/40 border border-border">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1.5 shrink-0" />
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          placeholder={t.ticketTypen.feldLabelPlaceholder}
          value={feld.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="h-7 text-xs col-span-2"
        />
        <select
          value={feld.typ}
          onChange={(e) => onChange({ typ: e.target.value as PflichtFeld["typ"] })}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="text">{t.ticketTypen.feldText}</option>
          <option value="zahl">{t.ticketTypen.feldZahl}</option>
          <option value="email">{t.ticketTypen.feldEmail}</option>
          <option value="auswahl">{t.ticketTypen.feldAuswahl}</option>
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            id={`pflicht-${feld.id}`}
            checked={feld.pflicht}
            onChange={(e) => onChange({ pflicht: e.target.checked })}
            className="h-3.5 w-3.5"
          />
          <label htmlFor={`pflicht-${feld.id}`} className="text-xs text-muted-foreground">{t.ticketTypen.pflichtfeld}</label>
        </div>
        {feld.typ === "auswahl" && (
          <div className="col-span-2">
            <Input
              placeholder={t.ticketTypen.optionenPlaceholder}
              value={(feld.optionen ?? []).join(", ")}
              onChange={(e) => onChange({ optionen: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              className="h-7 text-xs"
            />
          </div>
        )}
      </div>
      <button type="button" onClick={onDelete} className="text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function TypEditor({ typ, onChange, onDelete, zusatzSprachen = [] }: {
  typ: TicketTyp;
  onChange: (t: Partial<TicketTyp>) => void;
  onDelete: () => void;
  zusatzSprachen?: Lang[];
}) {
  const t = useT();
  const locale = useLocale();
  const [offen, setOffen] = useState(!typ.name);
  const [aktiveSprache, setAktiveSprache] = useState<Lang>("de");
  const alleSprachen: Lang[] = ["de", ...zusatzSprachen];
  const hatMehrSprachen = zusatzSprachen.length > 0;

  const euroFmt = (cent: number) =>
    (cent / 100).toLocaleString(dateLocaleFor(locale), { style: "currency", currency: "EUR" });
  function regelKurz(regel: PreisRegel): string {
    switch (regel.typ) {
      case "basis": return t.ticketTypen.regelLabelNormal;
      case "fest": return fmt(t.ticketTypen.regelLabelFest, { preis: euroFmt(regel.cent) });
      case "prozent": return fmt(t.ticketTypen.regelLabelProzent, { prozent: regel.prozent });
      case "rabatt_cent": return fmt(t.ticketTypen.regelLabelRabatt, { preis: euroFmt(regel.cent) });
    }
  }

  function getName(lang: Lang) {
    if (lang === "de") return typ.name;
    return typ.translations?.[lang]?.name ?? "";
  }
  function getBeschreibung(lang: Lang) {
    if (lang === "de") return typ.beschreibung ?? "";
    return typ.translations?.[lang]?.beschreibung ?? "";
  }
  function setName(lang: Lang, value: string) {
    if (lang === "de") { onChange({ name: value }); return; }
    onChange({ translations: { ...typ.translations, [lang]: { ...typ.translations?.[lang], name: value } } });
  }
  function setBeschreibung(lang: Lang, value: string) {
    if (lang === "de") { onChange({ beschreibung: value }); return; }
    onChange({ translations: { ...typ.translations, [lang]: { ...typ.translations?.[lang], beschreibung: value } } });
  }

  return (
    <div className={`rounded-xl border transition-colors ${typ.aktiv ? "border-border" : "border-border/50 opacity-60"}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button type="button" onClick={() => setOffen((v) => !v)} className="flex-1 flex items-center gap-2 text-left min-w-0">
          {offen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="font-medium text-sm truncate">{typ.name || <span className="text-muted-foreground italic">{t.ticketTypen.unbenannt}</span>}</span>
          {typ.name && <span className="text-xs text-muted-foreground shrink-0">{regelKurz(typ.preis_regel)}</span>}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange({ aktiv: !typ.aktiv })}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              typ.aktiv ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {typ.aktiv ? t.ticketTypen.aktiv : t.ticketTypen.inaktiv}
          </button>
          <button type="button" onClick={onDelete} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {offen && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {/* Language tabs for name/description */}
          {hatMehrSprachen && (
            <div className="flex gap-0.5 border-b border-border -mx-3 px-3">
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
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">
                {t.ticketTypen.nameLabel} {aktiveSprache !== "de" ? `(${FLAG[aktiveSprache]} ${aktiveSprache.toUpperCase()})` : "*"}
              </Label>
              <Input
                value={getName(aktiveSprache)}
                onChange={(e) => setName(aktiveSprache, e.target.value)}
                placeholder={aktiveSprache === "de" ? t.ticketTypen.namePlaceholder : fmt(t.ticketTypen.nameUebersetzungPlaceholder, { lang: LOCALE_LABELS[aktiveSprache] })}
                className="h-8 text-sm"
                required={aktiveSprache === "de"}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t.ticketTypen.maxProBuchung}</Label>
              <Input
                type="number" min="1"
                value={typ.max_pro_buchung ?? ""}
                onChange={(e) => onChange({ max_pro_buchung: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder={t.ticketTypen.unbegrenzt}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              {t.ticketTypen.kurzbeschreibung} {aktiveSprache !== "de" ? `(${FLAG[aktiveSprache]} ${aktiveSprache.toUpperCase()})` : t.ticketTypen.kurzbeschreibungOptional}
            </Label>
            <Input
              value={getBeschreibung(aktiveSprache)}
              onChange={(e) => setBeschreibung(aktiveSprache, e.target.value)}
              placeholder={aktiveSprache === "de" ? t.ticketTypen.beschreibungPlaceholder : fmt(t.ticketTypen.beschreibungUebersetzungPlaceholder, { lang: LOCALE_LABELS[aktiveSprache] })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t.ticketTypen.preisregel}</Label>
            <PreisRegelEditor
              regel={typ.preis_regel}
              onChange={(r) => onChange({ preis_regel: r })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t.ticketTypen.zusatzfelder}</Label>
              <button
                type="button"
                onClick={() => onChange({ pflichtfelder: [...typ.pflichtfelder, NEUES_FELD()] })}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {t.ticketTypen.feldHinzufuegen}
              </button>
            </div>
            {typ.pflichtfelder.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.ticketTypen.keineFelder}</p>
            ) : (
              <div className="space-y-1.5">
                {typ.pflichtfelder.map((feld, fi) => (
                  <PflichtFeldEditor
                    key={feld.id}
                    feld={feld}
                    onChange={(patch) => {
                      const felder = typ.pflichtfelder.map((f, i) => i === fi ? { ...f, ...patch } : f);
                      onChange({ pflichtfelder: felder });
                    }}
                    onDelete={() => onChange({ pflichtfelder: typ.pflichtfelder.filter((_, i) => i !== fi) })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketTypen({ eventId, initialTypen, eventSprachen = ["de"] }: { eventId: string; initialTypen: TicketTyp[]; eventSprachen?: string[] }) {
  const zusatzSprachen = (eventSprachen.filter((l) => l !== "de") as Lang[]).filter((l) =>
    ["en", "hu"].includes(l)
  );
  const t = useT();
  const [typen, setTypen] = useState<TicketTyp[]>(initialTypen);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const router = useRouter();

  function updateTyp(id: string, patch: Partial<TicketTyp>) {
    setTypen((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
  }

  async function speichern() {
    const supabase = createClient();
    await supabase.from("events").update({ ticket_typen: typen.length ? typen : null }).eq("id", eventId);
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2000);
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tickets className="h-4 w-4" /> {t.ticketTypen.titel}
        </CardTitle>
        {typen.length > 0 && (
          <Button size="sm" variant="outline" onClick={speichern} disabled={isPending}>
            {gespeichert ? `✓ ${t.common.gespeichert}` : t.common.speichern}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {typen.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              {t.ticketTypen.keineTypen}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {typen.map((typ) => (
              <TypEditor
                key={typ.id}
                typ={typ}
                onChange={(patch) => updateTyp(typ.id, patch)}
                onDelete={() => setTypen((prev) => prev.filter((t) => t.id !== typ.id))}
                zusatzSprachen={zusatzSprachen}
              />
            ))}
          </div>
        )}
        <Button
          type="button" size="sm" variant="outline" className="w-full"
          onClick={() => setTypen((prev) => [...prev, NEUER_TYP()])}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> {t.ticketTypen.ticketTypHinzufuegen}
        </Button>
        {typen.length > 0 && (
          <Button size="sm" className="w-full" onClick={speichern} disabled={isPending}>
            {gespeichert ? `✓ ${t.common.gespeichert}` : t.common.speichern}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          {t.ticketTypen.fusszeile}
        </p>
      </CardContent>
    </Card>
  );
}
