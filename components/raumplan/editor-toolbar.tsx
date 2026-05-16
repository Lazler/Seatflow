"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlignJustify, Armchair, CircleDot, Save, Trash2, Minus, Plus,
  RotateCw, Theater, ChevronDown, ChevronUp, Tags, Pencil, Check, X,
  Maximize2,
} from "lucide-react";
import {
  type SitzplanElement, type Buehne, type ElementTyp,
  type Preiskategorie,
} from "@/types/sitzplan";
import type { Auswahl } from "./sitzplan-canvas";

const TYP_META: Record<ElementTyp, { label: string; icon: React.ElementType }> = {
  reihe:      { label: "Reihe",        icon: AlignJustify },
  tischreihe: { label: "Tischreihe",   icon: Armchair     },
  rundtisch:  { label: "Runder Tisch", icon: CircleDot    },
};

const RAUM_PRESETS = [
  { label: "S",  breite: 700,  hoehe: 500,  title: "Klein (700×500)"       },
  { label: "M",  breite: 900,  hoehe: 620,  title: "Mittel (900×620)"      },
  { label: "L",  breite: 1200, hoehe: 800,  title: "Groß (1200×800)"       },
  { label: "XL", breite: 1400, hoehe: 900,  title: "Extra groß (1400×900)" },
];

// +/- in 10er-Schritten (für Raumgröße)
function ZahlInput10({ label, value, min, max, onChange, einheit }: {
  label: string; value: number; min?: number; max?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.max(min ?? 0, value - 10))}
          disabled={min !== undefined && value <= min}>
          <Minus className="h-3 w-3" />
        </Button>
        <Input type="number" value={value} min={min} max={max}
          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(Math.min(max ?? 9999, Math.max(min ?? 0, v))); }}
          className="h-6 text-xs text-center px-1" />
        <Button size="icon" variant="outline" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.min(max ?? 9999, value + 10))}
          disabled={max !== undefined && value >= max}>
          <Plus className="h-3 w-3" />
        </Button>
        {einheit && <span className="text-xs text-muted-foreground shrink-0">{einheit}</span>}
      </div>
    </div>
  );
}

// +/- in 1er-Schritten (für Element-Eigenschaften)
function ZahlInput({ label, value, min, max, onChange, einheit }: {
  label: string; value: number; min?: number; max?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.max(min ?? 0, value - 1))}
          disabled={min !== undefined && value <= min}>
          <Minus className="h-3 w-3" />
        </Button>
        <Input type="number" value={value} min={min} max={max}
          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(Math.min(max ?? 999, Math.max(min ?? 0, v))); }}
          className="h-6 text-xs text-center px-1" />
        <Button size="icon" variant="outline" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.min(max ?? 999, value + 1))}
          disabled={max !== undefined && value >= max}>
          <Plus className="h-3 w-3" />
        </Button>
        {einheit && <span className="text-xs text-muted-foreground shrink-0">{einheit}</span>}
      </div>
    </div>
  );
}

function WinkelSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        <RotateCw className="h-3 w-3" /> Winkel: {Math.round(value)}°
      </Label>
      <input type="range" min={-180} max={180} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-primary cursor-pointer" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>-180°</span>
        <button className="underline" onClick={() => onChange(0)}>Reset</button>
        <span>180°</span>
      </div>
    </div>
  );
}

// --- Raumgröße ---
function RaumgroesseSection({ breite, hoehe, onChange }: {
  breite: number; hoehe: number;
  onChange: (breite: number, hoehe: number) => void;
}) {
  const [offen, setOffen] = useState(true);
  return (
    <Card className="border-slate-200">
      <CardHeader className="py-2 px-3">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5" /> Raumgröße
          </CardTitle>
          <span className="text-xs text-muted-foreground font-normal">{breite}×{hoehe}</span>
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-4 gap-1">
            {RAUM_PRESETS.map((p) => (
              <button
                key={p.label}
                title={p.title}
                onClick={() => onChange(p.breite, p.hoehe)}
                className={`text-xs py-1.5 rounded border transition-colors font-medium ${
                  breite === p.breite && hoehe === p.hoehe
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ZahlInput10 label="Breite" value={breite} min={400} max={2000}
              onChange={(v) => onChange(v, hoehe)} einheit="px" />
            <ZahlInput10 label="Höhe" value={hoehe} min={300} max={1500}
              onChange={(v) => onChange(breite, v)} einheit="px" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nach Größenänderung Elementpositionen prüfen.
          </p>
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
  const [offen, setOffen] = useState(false);
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null);
  const [entwurf, setEntwurf] = useState<Partial<Preiskategorie>>({});

  function startBearbeiten(k: Preiskategorie) {
    setBearbeiteId(k.id);
    setEntwurf({ name: k.name, preis_cent: k.preis_cent, farbe: k.farbe });
  }

  function speichern(id: string) {
    onChange(kategorien.map((k) => k.id === id ? { ...k, ...entwurf } : k));
    setBearbeiteId(null);
  }

  function hinzufuegen() {
    const farben = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
    const neu: Preiskategorie = {
      id: crypto.randomUUID(),
      name: `Kategorie ${kategorien.length + 1}`,
      preis_cent: 1500,
      farbe: farben[kategorien.length % farben.length],
    };
    onChange([...kategorien, neu]);
    startBearbeiten(neu);
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-2 px-3">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Tags className="h-3.5 w-3.5" /> Preiskategorien
            <span className="font-normal text-muted-foreground">({kategorien.length})</span>
          </CardTitle>
          {offen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-3 pb-3 space-y-2">
          {kategorien.map((k) =>
            bearbeiteId === k.id ? (
              <div key={k.id} className="space-y-2 p-2 rounded-md border border-amber-200 bg-amber-50/40">
                <div className="flex gap-1.5 items-center">
                  <input type="color" value={entwurf.farbe ?? k.farbe}
                    onChange={(e) => setEntwurf((d) => ({ ...d, farbe: e.target.value }))}
                    className="h-7 w-9 rounded cursor-pointer border border-input p-0.5" />
                  <Input value={entwurf.name ?? ""} onChange={(e) => setEntwurf((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Name" className="h-7 text-sm flex-1" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground shrink-0">Preis:</span>
                  <Input type="number" value={((entwurf.preis_cent ?? 0) / 100).toFixed(2)}
                    onChange={(e) => setEntwurf((d) => ({ ...d, preis_cent: Math.round(parseFloat(e.target.value) * 100) }))}
                    placeholder="0.00" className="h-7 text-sm" step="0.50" min="0" />
                  <span className="text-xs text-muted-foreground shrink-0">€</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={() => speichern(k.id)}>
                    <Check className="h-3 w-3 mr-1" /> Speichern
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setBearbeiteId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div key={k.id} className="flex items-center gap-2 py-1 group">
                <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-sm" style={{ backgroundColor: k.farbe }} />
                <span className="text-xs flex-1 truncate font-medium">{k.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
                <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startBearbeiten(k)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onChange(kategorien.filter((x) => x.id !== k.id))}
                  disabled={kategorien.length <= 1}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          )}
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={hinzufuegen}>
            <Plus className="h-3 w-3 mr-1" /> Kategorie hinzufügen
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// --- Bühne ---
function BuehneEigenschaften({ buehne, onChange }: { buehne: Buehne; onChange: (d: Partial<Buehne>) => void }) {
  const [offen, setOffen] = useState(false);
  return (
    <Card className="border-slate-200">
      <CardHeader className="py-2 px-3">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Theater className="h-3.5 w-3.5" /> Bühne / Bühnenbereich
          </CardTitle>
          {offen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-3 pb-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschriftung</Label>
            <Input value={buehne.label} onChange={(e) => onChange({ label: e.target.value })} className="h-7 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ZahlInput label="Breite" value={buehne.breite} min={80} max={1200} onChange={(v) => onChange({ breite: v })} einheit="px" />
            <ZahlInput label="Höhe"   value={buehne.hoehe}  min={20} max={300}  onChange={(v) => onChange({ hoehe:  v })} einheit="px" />
          </div>
          <WinkelSlider value={buehne.winkel} onChange={(v) => onChange({ winkel: v })} />
          <p className="text-xs text-muted-foreground">Auf dem Canvas ziehen zum Verschieben, Anfasser zum Skalieren.</p>
        </CardContent>
      )}
    </Card>
  );
}

// --- Element-Eigenschaften ---
function ElementEigenschaften({ el, kategorien, onChange, onLoeschen }: {
  el: SitzplanElement; kategorien: Preiskategorie[];
  onChange: (d: Partial<SitzplanElement>) => void; onLoeschen: () => void;
}) {
  const Icon = TYP_META[el.typ].icon;
  return (
    <Card className="border-amber-300 bg-amber-50/30 shadow-sm">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" /> {TYP_META[el.typ].label}
          </CardTitle>
          <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={onLoeschen}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Bezeichnung (max. 4 Zeichen)</Label>
          <Input value={el.bezeichnung} maxLength={4}
            onChange={(e) => onChange({ bezeichnung: e.target.value.toUpperCase().slice(0, 4) } as Partial<SitzplanElement>)}
            className="h-7 text-sm" />
        </div>

        {el.typ === "reihe" && (
          <div className="grid grid-cols-2 gap-2">
            <ZahlInput label="Sitze" value={el.anzahlSitze} min={1} max={60} onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
            <ZahlInput label="Abstand" value={el.sitzAbstand} min={24} max={60} onChange={(v) => onChange({ sitzAbstand: v } as Partial<SitzplanElement>)} einheit="px" />
          </div>
        )}

        {el.typ === "tischreihe" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <ZahlInput label="Tische" value={el.anzahlTische} min={1} max={20} onChange={(v) => onChange({ anzahlTische: v } as Partial<SitzplanElement>)} />
              <ZahlInput label="Sitze/Tisch" value={el.sitzeProTisch} min={1} max={10} onChange={(v) => onChange({ sitzeProTisch: v } as Partial<SitzplanElement>)} />
            </div>
            <ZahlInput label="Abstand zw. Tischen" value={el.tischAbstand} min={4} max={80} onChange={(v) => onChange({ tischAbstand: v } as Partial<SitzplanElement>)} einheit="px" />
          </div>
        )}

        {el.typ === "rundtisch" && (
          <div className="grid grid-cols-2 gap-2">
            <ZahlInput label="Sitze" value={el.anzahlSitze} min={2} max={20} onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
            <ZahlInput label="Radius" value={el.tischRadius} min={20} max={120} onChange={(v) => onChange({ tischRadius: v } as Partial<SitzplanElement>)} einheit="px" />
          </div>
        )}

        <WinkelSlider value={el.winkel} onChange={(v) => onChange({ winkel: v } as Partial<SitzplanElement>)} />

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Preiskategorie</Label>
          <div className="flex flex-col gap-1">
            {kategorien.map((k) => (
              <button key={k.id} onClick={() => onChange({ kategorie_id: k.id } as Partial<SitzplanElement>)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs border transition-colors text-left ${
                  el.kategorie_id === k.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-input hover:bg-muted"
                }`}>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: k.farbe }} />
                <span className="flex-1">{k.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
                {el.kategorie_id === k.id && <Check className="h-3 w-3 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Haupt-Toolbar ---
type Props = {
  elemente: SitzplanElement[];
  auswahl: Auswahl;
  buehne: Buehne;
  kategorien: Preiskategorie[];
  raumbreite: number;
  raumhoehe: number;
  speichernLaedt: boolean;
  gesamtSitze: number;
  onHinzufuegen: (typ: ElementTyp) => void;
  onLoeschen: (id: string) => void;
  onAktualisieren: (id: string, delta: Partial<SitzplanElement>) => void;
  onBuehneAktualisieren: (delta: Partial<Buehne>) => void;
  onKategorienAktualisieren: (k: Preiskategorie[]) => void;
  onRaumgroesseAktualisieren: (breite: number, hoehe: number) => void;
  onAuswaehlen: (a: Auswahl) => void;
  onSpeichern: () => void;
};

export default function EditorToolbar({
  elemente, auswahl, buehne, kategorien, raumbreite, raumhoehe,
  speichernLaedt, gesamtSitze,
  onHinzufuegen, onLoeschen, onAktualisieren, onBuehneAktualisieren,
  onKategorienAktualisieren, onRaumgroesseAktualisieren, onAuswaehlen, onSpeichern,
}: Props) {
  const ausgewaehltesElement = auswahl?.typ === "element"
    ? elemente.find((e) => e.id === auswahl.id) ?? null
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats + Speichern */}
      <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{gesamtSitze} Plätze</p>
          <p className="text-xs text-muted-foreground">{elemente.length} Elemente</p>
        </div>
        <Button size="sm" onClick={onSpeichern} disabled={speichernLaedt} className="shrink-0">
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {speichernLaedt ? "Lädt…" : "Speichern"}
        </Button>
      </div>

      {/* Elemente hinzufügen */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Hinzufügen</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(TYP_META) as [ElementTyp, typeof TYP_META[ElementTyp]][]).map(([typ, meta]) => (
            <button key={typ} onClick={() => onHinzufuegen(typ)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-md border border-input hover:bg-accent hover:border-primary/50 text-xs font-medium transition-colors">
              <meta.icon className="h-4 w-4" />
              <span className="leading-none text-center">{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollbarer Bereich */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Raumgröße */}
        <RaumgroesseSection
          breite={raumbreite}
          hoehe={raumhoehe}
          onChange={onRaumgroesseAktualisieren}
        />

        {/* Ausgewähltes Element ZUERST */}
        {ausgewaehltesElement ? (
          <ElementEigenschaften
            el={ausgewaehltesElement}
            kategorien={kategorien}
            onChange={(d) => onAktualisieren(ausgewaehltesElement.id, d)}
            onLoeschen={() => { onLoeschen(ausgewaehltesElement.id); onAuswaehlen(null); }}
          />
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-200 py-6 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Element auf dem Canvas<br />anklicken um es zu bearbeiten
            </p>
          </div>
        )}

        <PreiskategorienEditor kategorien={kategorien} onChange={onKategorienAktualisieren} />
        <BuehneEigenschaften buehne={buehne} onChange={onBuehneAktualisieren} />
      </div>
    </div>
  );
}
