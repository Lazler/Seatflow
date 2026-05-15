"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlignJustify,
  Armchair,
  CircleDot,
  Save,
  Trash2,
  Minus,
  Plus,
  RotateCw,
  Theater,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  type SitzplanElement,
  type SitzKategorie,
  type Buehne,
  type ElementTyp,
} from "@/types/sitzplan";
import type { Auswahl } from "./sitzplan-canvas";
import { useState } from "react";

const TYP_META: Record<ElementTyp, { label: string; icon: React.ElementType; prefix: string }> = {
  reihe:      { label: "Reihe",        icon: AlignJustify, prefix: "" },
  tischreihe: { label: "Tischreihe",   icon: Armchair,    prefix: "T" },
  rundtisch:  { label: "Runder Tisch", icon: CircleDot,   prefix: "R" },
};

type Props = {
  elemente: SitzplanElement[];
  auswahl: Auswahl;
  buehne: Buehne;
  speichernLaedt: boolean;
  gesamtSitze: number;
  onHinzufuegen: (typ: ElementTyp) => void;
  onLoeschen: (id: string) => void;
  onAktualisieren: (id: string, delta: Partial<SitzplanElement>) => void;
  onBuehneAktualisieren: (delta: Partial<Buehne>) => void;
  onAuswaehlen: (a: Auswahl) => void;
  onSpeichern: () => void;
};

function ZahlInput({
  label,
  value,
  min,
  max,
  onChange,
  einheit,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  einheit?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.max(min ?? 0, value - 1))}
          disabled={min !== undefined && value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max ?? 999, Math.max(min ?? 0, v)));
          }}
          className="h-6 text-xs text-center px-1"
        />
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.min(max ?? 999, value + 1))}
          disabled={max !== undefined && value >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
        {einheit && <span className="text-xs text-muted-foreground shrink-0">{einheit}</span>}
      </div>
    </div>
  );
}

function KategorieWahl({
  value,
  onChange,
}: {
  value: SitzKategorie;
  onChange: (k: SitzKategorie) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Kategorie</Label>
      <div className="flex gap-1.5">
        {(["standard", "premium"] as SitzKategorie[]).map((k) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`flex-1 py-1 rounded text-xs font-medium border transition-colors ${
              value === k
                ? k === "premium"
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-blue-600 text-white border-blue-600"
                : "bg-background text-muted-foreground border-input hover:bg-muted"
            }`}
          >
            {k === "premium" ? "Premium" : "Standard"}
          </button>
        ))}
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
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>-180°</span>
        <button className="underline" onClick={() => onChange(0)}>Reset</button>
        <span>180°</span>
      </div>
    </div>
  );
}

// --- Bühne Properties ---
function BuehneEigenschaften({ buehne, onChange }: { buehne: Buehne; onChange: (d: Partial<Buehne>) => void }) {
  const [offen, setOffen] = useState(false);
  return (
    <Card className="border-slate-300 bg-slate-50/40">
      <CardHeader className="py-2 px-3">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setOffen(!offen)}
        >
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Theater className="h-3.5 w-3.5" /> Bühne
          </CardTitle>
          {offen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-3 pb-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschriftung</Label>
            <Input
              value={buehne.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className="h-6 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ZahlInput label="Breite" value={buehne.breite} min={80} max={800} onChange={(v) => onChange({ breite: v })} einheit="px" />
            <ZahlInput label="Höhe" value={buehne.hoehe} min={20} max={200} onChange={(v) => onChange({ hoehe: v })} einheit="px" />
          </div>
          <p className="text-xs text-muted-foreground">
            Oder: Bühne auf dem Canvas anklicken und mit den Anfassern skalieren/drehen.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

// --- Element Properties ---
function ElementEigenschaften({
  el,
  onChange,
  onLoeschen,
}: {
  el: SitzplanElement;
  onChange: (d: Partial<SitzplanElement>) => void;
  onLoeschen: () => void;
}) {
  return (
    <Card className="border-amber-300 bg-amber-50/40">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
          {(() => { const Icon = TYP_META[el.typ].icon; return <Icon className="h-3.5 w-3.5" />; })()}
          {TYP_META[el.typ].label} bearbeiten
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Bezeichnung</Label>
          <Input
            value={el.bezeichnung}
            onChange={(e) => onChange({ bezeichnung: e.target.value.toUpperCase().slice(0, 4) } as Partial<SitzplanElement>)}
            className="h-6 text-xs"
            maxLength={4}
          />
        </div>

        {/* Typ-spezifische Felder */}
        {el.typ === "reihe" && (
          <>
            <ZahlInput label="Anzahl Sitze" value={el.anzahlSitze} min={1} max={50} onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
            <ZahlInput label="Sitzabstand" value={el.sitzAbstand} min={24} max={60} onChange={(v) => onChange({ sitzAbstand: v } as Partial<SitzplanElement>)} einheit="px" />
          </>
        )}

        {el.typ === "tischreihe" && (
          <>
            <ZahlInput label="Anzahl Tische" value={el.anzahlTische} min={1} max={20} onChange={(v) => onChange({ anzahlTische: v } as Partial<SitzplanElement>)} />
            <ZahlInput label="Sitze pro Tisch" value={el.sitzeProTisch} min={1} max={10} onChange={(v) => onChange({ sitzeProTisch: v } as Partial<SitzplanElement>)} />
            <ZahlInput label="Tischabstand" value={el.tischAbstand} min={4} max={80} onChange={(v) => onChange({ tischAbstand: v } as Partial<SitzplanElement>)} einheit="px" />
          </>
        )}

        {el.typ === "rundtisch" && (
          <>
            <ZahlInput label="Sitze ringsum" value={el.anzahlSitze} min={2} max={20} onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
            <ZahlInput label="Tischradius" value={el.tischRadius} min={20} max={120} onChange={(v) => onChange({ tischRadius: v } as Partial<SitzplanElement>)} einheit="px" />
          </>
        )}

        <WinkelSlider value={el.winkel} onChange={(v) => onChange({ winkel: v } as Partial<SitzplanElement>)} />
        <KategorieWahl value={el.kategorie} onChange={(k) => onChange({ kategorie: k } as Partial<SitzplanElement>)} />

        <Button size="sm" variant="destructive" className="w-full" onClick={onLoeschen}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Element löschen
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Haupt-Toolbar ---
export default function EditorToolbar({
  elemente,
  auswahl,
  buehne,
  speichernLaedt,
  gesamtSitze,
  onHinzufuegen,
  onLoeschen,
  onAktualisieren,
  onBuehneAktualisieren,
  onAuswaehlen,
  onSpeichern,
}: Props) {
  const ausgewaehltesElement = auswahl?.typ === "element"
    ? elemente.find((e) => e.id === auswahl.id) ?? null
    : null;

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Kopf */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-sm font-medium">{elemente.length} Elemente</p>
          <p className="text-xs text-muted-foreground">{gesamtSitze} Sitze gesamt</p>
        </div>
      </div>

      {/* Hinzufügen */}
      <div className="shrink-0 space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Hinzufügen</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(TYP_META) as [ElementTyp, typeof TYP_META[ElementTyp]][]).map(([typ, meta]) => (
            <button
              key={typ}
              onClick={() => onHinzufuegen(typ)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-md border border-input hover:bg-accent hover:text-accent-foreground text-xs font-medium transition-colors"
            >
              <meta.icon className="h-4 w-4" />
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollbarer Bereich */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {/* Bühne */}
        <BuehneEigenschaften buehne={buehne} onChange={onBuehneAktualisieren} />

        {/* Ausgewähltes Element */}
        {ausgewaehltesElement ? (
          <ElementEigenschaften
            el={ausgewaehltesElement}
            onChange={(d) => onAktualisieren(ausgewaehltesElement.id, d)}
            onLoeschen={() => {
              onLoeschen(ausgewaehltesElement.id);
              onAuswaehlen(null);
            }}
          />
        ) : auswahl?.typ !== "buehne" && (
          <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
            Element auf dem Canvas anklicken
          </p>
        )}
      </div>

      {/* Speichern */}
      <Button onClick={onSpeichern} disabled={speichernLaedt} className="w-full shrink-0">
        <Save className="h-4 w-4 mr-1.5" />
        {speichernLaedt ? "Speichern..." : "Raumplan speichern"}
      </Button>
    </div>
  );
}
