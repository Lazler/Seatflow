"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TextAlignJustify as AlignJustify, Armchair, Record as CircleDot, Minus, Plus, PencilSimple as Pencil, Check, X, Users, TextT as Type, Rows as Rows3, MagicWand as Wand2, ArrowsOutSimple as Maximize2, MaskHappy as Theater, ArrowsInSimple as AlignCenter } from "@phosphor-icons/react";
import {
  type ElementTyp, type Preiskategorie,
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

const VORLAGEN_TYPEN: ("theater" | "kabarett" | "misch")[] = ["theater", "kabarett", "misch"];

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

function AbschnittsTitel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" /> {children}
    </p>
  );
}

// ── Modal: "Element hinzufügen" — Bühne verhält sich wie die anderen Kacheln:
// ein Klick wählt sie aus, ihre Eigenschaften erscheinen im selben rechten
// Auswahl-Panel wie bei jedem anderen Element (sie existiert nur schon immer,
// statt neu erzeugt zu werden). ─────────────────────────────────────────────
export function ElementHinzufuegenInhalt({ onHinzufuegen, onBuehneAuswaehlen }: {
  onHinzufuegen: (typ: ElementTyp) => void;
  onBuehneAuswaehlen: () => void;
}) {
  const t = useT();
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(TYP_ICON) as ElementTyp[]).map((typ) => {
        const Icon = TYP_ICON[typ];
        return (
          <button key={typ} onClick={() => onHinzufuegen(typ)}
            className="flex flex-col items-center gap-1.5 py-4 px-1 rounded-lg border border-input hover:bg-accent hover:border-brand/50 text-xs font-medium transition-colors min-h-[64px]">
            <Icon className="h-5 w-5" />
            <span className="leading-none text-center">{t.editorToolbar.elementTypen[typ]}</span>
          </button>
        );
      })}
      <button onClick={onBuehneAuswaehlen}
        className="flex flex-col items-center gap-1.5 py-4 px-1 rounded-lg border border-input hover:bg-accent hover:border-brand/50 text-xs font-medium transition-colors min-h-[64px]">
        <Theater className="h-5 w-5" />
        <span className="leading-none text-center">{t.editorToolbar.buehnePodium}</span>
      </button>
    </div>
  );
}

// ── Modal: "Preiskategorien" ────────────────────────────────────────────────
export function PreiskategorienInhalt({ kategorien, onChange }: {
  kategorien: Preiskategorie[];
  onChange: (k: Preiskategorie[]) => void;
}) {
  const t = useT();
  const locale = useLocale();
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
    <div className="space-y-2">
      {kategorien.map((k) => bearbeiteId === k.id ? (
        <div key={k.id} className="space-y-2 p-2 rounded-md border border-brand/40 bg-brand-soft/40">
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
          <span className="text-sm flex-1 truncate font-medium">{k.name}</span>
          <span className="text-xs font-mono text-muted-foreground shrink-0">{(k.preis_cent / 100).toLocaleString(intlLocale(locale), { style: "currency", currency: "EUR" })}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startBearbeiten(k)}><Pencil className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onChange(kategorien.filter((c) => c.id !== k.id))} disabled={kategorien.length <= 1}><X className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={hinzufuegen}><Plus className="h-3 w-3 mr-1" /> {t.editorToolbar.kategorieHinzufuegen}</Button>
    </div>
  );
}

// ── Modal: "Planeinstellungen" (Raumgröße + Bestuhlungs-Generator) ─────────
export function PlaneinstellungenInhalt({
  raumbreite, raumhoehe, onRaumgroesseAktualisieren, onInhaltZentrieren,
  leer, onBestuhlungErzeugen, onVorlage,
}: {
  raumbreite: number; raumhoehe: number; onRaumgroesseAktualisieren: (b: number, h: number) => void;
  onInhaltZentrieren: () => void;
  leer: boolean;
  onBestuhlungErzeugen: (reihen: number, sitzeProReihe: number, mittelgang: boolean) => void;
  onVorlage: (typ: "theater" | "kabarett" | "misch") => void;
}) {
  const t = useT();
  const [reihen, setReihen] = useState(8);
  const [sitze, setSitze] = useState(12);
  const [gang, setGang] = useState(true);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <AbschnittsTitel icon={Wand2}>{t.editorToolbar.bestuhlungErzeugen}</AbschnittsTitel>
        {leer && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t.editorToolbar.vorlagenHinweis}</p>
            {VORLAGEN_TYPEN.map((typ) => (
              <button key={typ} onClick={() => onVorlage(typ)}
                className="w-full text-left rounded-lg border border-input hover:border-brand/50 hover:bg-accent px-3 py-2.5 transition-colors">
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
            className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${gang ? "bg-brand" : "bg-input"}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${gang ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
        <Button size="sm" className="w-full h-9" onClick={() => onBestuhlungErzeugen(reihen, sitze, gang)}>
          <Rows3 className="h-3.5 w-3.5 mr-1.5" />
          {fmt(t.editorToolbar.plaetzeErzeugen, { n: reihen * sitze })}
        </Button>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{t.editorToolbar.generatorHinweis}</p>
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <AbschnittsTitel icon={Maximize2}>{t.editorToolbar.raumgroesse}</AbschnittsTitel>
        <div className="grid grid-cols-4 gap-1">
          {RAUM_PRESETS.map((p) => (
            <button key={p.label} title={`${p.breite}×${p.hoehe}`}
              onClick={() => onRaumgroesseAktualisieren(p.breite, p.hoehe)}
              className={`text-xs py-2.5 rounded border transition-colors font-medium ${
                raumbreite === p.breite && raumhoehe === p.hoehe
                  ? "border-brand bg-brand-soft text-brand-deep"
                  : "border-input hover:bg-muted"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <ZahlInput label={t.editorToolbar.breite} value={raumbreite} min={400} max={2000} onChange={(v) => onRaumgroesseAktualisieren(v, raumhoehe)} einheit="px" />
          <ZahlInput label={t.editorToolbar.hoehe}  value={raumhoehe}  min={300} max={1500} onChange={(v) => onRaumgroesseAktualisieren(raumbreite, v)} einheit="px" />
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={onInhaltZentrieren}>
          <AlignCenter className="h-3.5 w-3.5 mr-1.5" /> {t.editorToolbar.inhaltZentrieren}
        </Button>
      </div>
    </div>
  );
}
