"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextAlignJustify as AlignJustify, Armchair, Record as CircleDot, Minus, Plus, ArrowClockwise as RotateCw, MaskHappy as Theater, CaretDown as ChevronDown, CaretUp as ChevronUp, Tag as Tags, PencilSimple as Pencil, Check, X, ArrowsOutSimple as Maximize2, Users, TextT as Type, Rows as Rows3, MagicWand as Wand2 } from "@phosphor-icons/react";
import {
  type SitzplanElement, type Buehne, type ElementTyp, type Preiskategorie,
} from "@/types/sitzplan";
import { useT, useLocale } from "@/components/i18n-provider";
import { fmt, intlLocale } from "@/lib/i18n/buchung";

const TYP_ICON: Record<ElementTyp, React.ElementType> = {
  reihe:      AlignJustify,
  tischreihe: Armchair,
  rundtisch:  CircleDot,
  stehplatz:  Users,
  text:       Type,
};

const RAUM_PRESETS = [
  { label: "S",  breite: 700,  hoehe: 500  },
  { label: "M",  breite: 900,  hoehe: 620  },
  { label: "L",  breite: 1200, hoehe: 800  },
  { label: "XL", breite: 1400, hoehe: 900  },
];

const NO_SPIN = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function ZahlInput({ label, value, min, max, schritt = 10, onChange, einheit }: {
  label: string; value: number; min?: number; max?: number; schritt?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0"
          onClick={() => onChange(Math.max(min ?? 0, value - schritt))} disabled={min !== undefined && value <= min}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input type="number" value={value} min={min} max={max}
          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(Math.min(max ?? 9999, Math.max(min ?? 0, v))); }}
          className={`h-9 text-sm text-center px-0 flex-1 min-w-0 ${NO_SPIN}`} />
        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0"
          onClick={() => onChange(Math.min(max ?? 9999, value + schritt))} disabled={max !== undefined && value >= max}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
        {einheit && <span className="text-xs text-muted-foreground shrink-0">{einheit}</span>}
      </div>
    </div>
  );
}

// --- Raumgröße ---
function RaumgroesseSection({ breite, hoehe, onChange }: {
  breite: number; hoehe: number;
  onChange: (b: number, h: number) => void;
}) {
  const t = useT();
  const [offen, setOffen] = useState(true);
  return (
    <Card className="border-slate-200 rounded-none border-x-0 border-t-0 shadow-none">
      <CardHeader className="py-2 px-4">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5" /> {t.editorToolbar.raumgroesse}
          </CardTitle>
          <span className="text-xs text-muted-foreground font-normal">{breite}×{hoehe}</span>
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-4 pb-3 space-y-3">
          <div className="grid grid-cols-4 gap-1">
            {RAUM_PRESETS.map((p) => (
              <button key={p.label} title={`${p.breite}×${p.hoehe}`}
                onClick={() => onChange(p.breite, p.hoehe)}
                className={`text-xs py-2.5 rounded border transition-colors font-medium ${
                  breite === p.breite && hoehe === p.hoehe
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-muted"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <ZahlInput label={t.editorToolbar.breite} value={breite} min={400} max={2000} onChange={(v) => onChange(v, hoehe)} einheit="px" />
            <ZahlInput label={t.editorToolbar.hoehe}  value={hoehe}  min={300} max={1500} onChange={(v) => onChange(breite, v)} einheit="px" />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// --- Preiskategorien ---
function PreiskategorienEditor({ kategorien, onChange }: {
  kategorien: Preiskategorie[];
  onChange: (k: Preiskategorie[]) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [offen, setOffen] = useState(false);
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null);
  const [entwurf, setEntwurf] = useState<Partial<Preiskategorie>>({});

  function startBearbeiten(k: Preiskategorie) { setBearbeiteId(k.id); setEntwurf({ name: k.name, preis_cent: k.preis_cent, farbe: k.farbe }); }
  function speichern(id: string) { onChange(kategorien.map((k) => k.id === id ? { ...k, ...entwurf } : k)); setBearbeiteId(null); }
  function hinzufuegen() {
    const farben = ["#d9481f", "#c99a3a", "#4b4f9a", "#3a3c40", "#17181a", "#c0311b"];
    const neu: Preiskategorie = { id: crypto.randomUUID(), name: fmt(t.editorToolbar.kategorieName, { n: kategorien.length + 1 }), preis_cent: 1500, farbe: farben[kategorien.length % farben.length] };
    onChange([...kategorien, neu]);
    startBearbeiten(neu);
  }

  return (
    <Card className="border-slate-200 rounded-none border-x-0 shadow-none">
      <CardHeader className="py-2 px-4">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Tags className="h-3.5 w-3.5" /> {t.editorToolbar.preiskategorien} <span className="font-normal text-muted-foreground">({kategorien.length})</span>
          </CardTitle>
          {offen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-4 pb-3 space-y-2">
          {kategorien.map((k) => bearbeiteId === k.id ? (
            <div key={k.id} className="space-y-2 p-2 rounded-md border border-amber-200 bg-amber-50/40">
              <div className="flex gap-1.5 items-center">
                <input type="color" value={entwurf.farbe ?? k.farbe}
                  onChange={(e) => setEntwurf((d) => ({ ...d, farbe: e.target.value }))}
                  className="h-7 w-9 rounded cursor-pointer border border-input p-0.5" />
                <Input value={entwurf.name ?? ""} onChange={(e) => setEntwurf((d) => ({ ...d, name: e.target.value }))}
                  placeholder={t.editorToolbar.namePlaceholder} className="h-7 text-sm flex-1" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground shrink-0">{t.editorToolbar.preis}</span>
                <Input type="number" value={((entwurf.preis_cent ?? 0) / 100).toFixed(2)}
                  onChange={(e) => setEntwurf((d) => ({ ...d, preis_cent: Math.round(parseFloat(e.target.value) * 100) }))}
                  className="h-7 text-sm" step="0.50" min="0" />
                <span className="text-xs text-muted-foreground shrink-0">€</span>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={() => speichern(k.id)}><Check className="h-3 w-3 mr-1" /> OK</Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setBearbeiteId(null)}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          ) : (
            <div key={k.id} className="flex items-center gap-2 py-1 group">
              <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: k.farbe }} />
              <span className="text-xs flex-1 truncate font-medium">{k.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{(k.preis_cent / 100).toLocaleString(intlLocale(locale), { style: "currency", currency: "EUR" })}</span>
              <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startBearbeiten(k)}><Pencil className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onChange(kategorien.filter((c) => c.id !== k.id))} disabled={kategorien.length <= 1}><X className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={hinzufuegen}><Plus className="h-3 w-3 mr-1" /> {t.editorToolbar.kategorieHinzufuegen}</Button>
        </CardContent>
      )}
    </Card>
  );
}

// --- Bühne ---
function BuehneEigenschaften({ buehne, onChange }: { buehne: Buehne; onChange: (d: Partial<Buehne>) => void }) {
  const t = useT();
  const [offen, setOffen] = useState(false);
  return (
    <Card className="border-slate-200 rounded-none border-x-0 shadow-none">
      <CardHeader className="py-2 px-4">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Theater className="h-3.5 w-3.5" /> {t.editorToolbar.buehnePodium}
          </CardTitle>
          {offen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-4 pb-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t.editorToolbar.beschriftung}</Label>
            <Input value={buehne.label} onChange={(e) => onChange({ label: e.target.value })} className="h-7 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ZahlInput label={t.editorToolbar.breite} value={buehne.breite} min={80} max={1200} schritt={10} onChange={(v) => onChange({ breite: v })} einheit="px" />
            <ZahlInput label={t.editorToolbar.hoehe}   value={buehne.hoehe}  min={20} max={300}  schritt={10} onChange={(v) => onChange({ hoehe:  v })} einheit="px" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <RotateCw className="h-3 w-3" /> {fmt(t.editorToolbar.winkel, { winkel: Math.round(buehne.winkel) })}
            </Label>
            <input type="range" min={-180} max={180} step={1} value={buehne.winkel}
              onChange={(e) => onChange({ winkel: Number(e.target.value) })}
              className="w-full h-1.5 accent-primary cursor-pointer" />
          </div>
          <p className="text-xs text-muted-foreground">{t.editorToolbar.canvasZiehen}</p>
        </CardContent>
      )}
    </Card>
  );
}

// --- Haupt-Toolbar (nur globale Einstellungen) ---
type Props = {
  elemente: SitzplanElement[];
  buehne: Buehne;
  kategorien: Preiskategorie[];
  raumbreite: number;
  raumhoehe: number;
  gesamtSitze: number;
  onHinzufuegen: (typ: ElementTyp) => void;
  onBuehneAktualisieren: (delta: Partial<Buehne>) => void;
  onKategorienAktualisieren: (k: Preiskategorie[]) => void;
  onRaumgroesseAktualisieren: (breite: number, hoehe: number) => void;
  onBestuhlungErzeugen: (reihen: number, sitzeProReihe: number, mittelgang: boolean) => void;
  onVorlage: (typ: "theater" | "kabarett" | "misch") => void;
};

const VORLAGEN_TYPEN: ("theater" | "kabarett" | "misch")[] = ["theater", "kabarett", "misch"];

// --- Bestuhlungs-Generator ---
function BestuhlungsGenerator({ leer, onErzeugen, onVorlage }: {
  leer: boolean;
  onErzeugen: (reihen: number, sitze: number, gang: boolean) => void;
  onVorlage: (typ: "theater" | "kabarett" | "misch") => void;
}) {
  const t = useT();
  const [offen, setOffen] = useState(leer);
  const [reihen, setReihen] = useState(8);
  const [sitze, setSitze] = useState(12);
  const [gang, setGang] = useState(true);

  return (
    <Card className="border-slate-200 rounded-none border-x-0 border-t-0 shadow-none">
      <CardHeader className="py-2 px-4">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5" /> {t.editorToolbar.bestuhlungErzeugen}
          </CardTitle>
          {offen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-4 pb-3 space-y-3">
          {leer && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">{t.editorToolbar.vorlagenHinweis}</p>
              {VORLAGEN_TYPEN.map((typ) => (
                <button key={typ} onClick={() => onVorlage(typ)}
                  className="w-full text-left rounded-lg border border-input hover:border-primary/50 hover:bg-accent px-3 py-2.5 transition-colors">
                  <span className="text-sm font-medium block">{t.editorToolbar.vorlagen[typ].label}</span>
                  <span className="text-xs text-muted-foreground">{t.editorToolbar.vorlagen[typ].desc}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] text-muted-foreground uppercase">{t.editorToolbar.oderEigene}</span>
                <div className="h-px bg-border flex-1" />
              </div>
            </div>
          )}
          <ZahlInput label={t.editorToolbar.reihen} value={reihen} min={1} max={30} schritt={1} onChange={setReihen} />
          <ZahlInput label={t.editorToolbar.sitzeProReihe} value={sitze} min={2} max={40} schritt={1} onChange={setSitze} />
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t.editorToolbar.mittelgang}</Label>
            <button type="button" onClick={() => setGang(!gang)}
              role="switch" aria-checked={gang}
              className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${gang ? "bg-primary" : "bg-input"}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${gang ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
          <Button size="sm" className="w-full h-9" onClick={() => onErzeugen(reihen, sitze, gang)}>
            <Rows3 className="h-3.5 w-3.5 mr-1.5" />
            {fmt(t.editorToolbar.plaetzeErzeugen, { n: reihen * sitze })}
          </Button>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t.editorToolbar.generatorHinweis}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export default function EditorToolbar({
  elemente, buehne, kategorien, raumbreite, raumhoehe, gesamtSitze,
  onHinzufuegen, onBuehneAktualisieren, onKategorienAktualisieren, onRaumgroesseAktualisieren,
  onBestuhlungErzeugen, onVorlage,
}: Props) {
  const t = useT();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hinzufügen */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {t.editorToolbar.elementHinzufuegen}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(TYP_ICON) as ElementTyp[]).map((typ) => {
            const Icon = TYP_ICON[typ];
            return (
              <button key={typ} onClick={() => onHinzufuegen(typ)}
                className="flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-lg border border-input hover:bg-accent hover:border-primary/50 text-xs font-medium transition-colors min-h-[60px]">
                <Icon className="h-4.5 w-4.5" />
                <span className="leading-none text-center">{t.editorToolbar.elementTypen[typ]}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2.5">
          {elemente.length} {elemente.length !== 1 ? t.editorToolbar.elementPl : t.editorToolbar.elementSg} · {gesamtSitze} {t.editorToolbar.plaetze}
        </p>
      </div>

      {/* Globale Einstellungen */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        <BestuhlungsGenerator
          leer={elemente.length === 0}
          onErzeugen={onBestuhlungErzeugen}
          onVorlage={onVorlage}
        />
        <RaumgroesseSection breite={raumbreite} hoehe={raumhoehe} onChange={onRaumgroesseAktualisieren} />
        <PreiskategorienEditor kategorien={kategorien} onChange={onKategorienAktualisieren} />
        <BuehneEigenschaften buehne={buehne} onChange={onBuehneAktualisieren} />
      </div>

      <div className="px-4 py-3 border-t border-border shrink-0 text-xs text-muted-foreground text-center leading-relaxed">
        {t.editorToolbar.elementInspektor}
      </div>
    </div>
  );
}
