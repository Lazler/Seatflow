"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlignJustify, Armchair, CircleDot, Save, Trash2, Minus, Plus,
  RotateCw, Theater, ChevronDown, ChevronUp, Tags, Pencil, Check, X,
} from "lucide-react";
import {
  type SitzplanElement, type Buehne, type ElementTyp,
  type Preiskategorie,
} from "@/types/sitzplan";
import type { Auswahl } from "./sitzplan-canvas";

const TYP_META: Record<ElementTyp, { label: string; icon: React.ElementType; prefix: string }> = {
  reihe:      { label: "Reihe",        icon: AlignJustify, prefix: ""  },
  tischreihe: { label: "Tischreihe",   icon: Armchair,     prefix: "T" },
  rundtisch:  { label: "Runder Tisch", icon: CircleDot,    prefix: "R" },
};

// --- Wiederverwendbare Zahl-Input-Komponente ---
function ZahlInput({ label, value, min, max, onChange, einheit }: {
  label: string; value: number; min?: number; max?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="outline" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.max(min ?? 0, value - 1))} disabled={min !== undefined && value <= min}>
          <Minus className="h-3 w-3" />
        </Button>
        <Input type="number" value={value} min={min} max={max}
          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(Math.min(max ?? 999, Math.max(min ?? 0, v))); }}
          className="h-6 text-xs text-center px-1" />
        <Button size="icon" variant="outline" className="h-6 w-6 shrink-0"
          onClick={() => onChange(Math.min(max ?? 999, value + 1))} disabled={max !== undefined && value >= max}>
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

// --- Preiskategorien verwalten ---
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
    const neu: Preiskategorie = {
      id: crypto.randomUUID(),
      name: "Neue Kategorie",
      preis_cent: 1000,
      farbe: "#64748b",
    };
    onChange([...kategorien, neu]);
    startBearbeiten(neu);
  }

  function loeschen(id: string) {
    onChange(kategorien.filter((k) => k.id !== id));
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-2 px-3">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
          <CardTitle className="text-xs text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <Tags className="h-3.5 w-3.5" /> Preiskategorien
          </CardTitle>
          {offen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </CardHeader>
      {offen && (
        <CardContent className="px-3 pb-3 space-y-2">
          {kategorien.map((k) => (
            bearbeiteId === k.id ? (
              <div key={k.id} className="space-y-2 p-2 rounded-md border border-amber-200 bg-amber-50/40">
                <div className="flex gap-1.5">
                  <input type="color" value={entwurf.farbe ?? k.farbe}
                    onChange={(e) => setEntwurf((d) => ({ ...d, farbe: e.target.value }))}
                    className="h-6 w-8 rounded cursor-pointer border-0 p-0" />
                  <Input value={entwurf.name ?? ""} onChange={(e) => setEntwurf((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Name" className="h-6 text-xs flex-1" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Input type="number" value={(entwurf.preis_cent ?? 0) / 100}
                    onChange={(e) => setEntwurf((d) => ({ ...d, preis_cent: Math.round(parseFloat(e.target.value) * 100) }))}
                    placeholder="Preis €" className="h-6 text-xs" step="0.50" min="0" />
                  <span className="text-xs text-muted-foreground shrink-0">€</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-xs flex-1" onClick={() => speichern(k.id)}>
                    <Check className="h-3 w-3 mr-1" /> OK
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setBearbeiteId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div key={k.id} className="flex items-center gap-2 py-1">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: k.farbe }} />
                <span className="text-xs flex-1 truncate font-medium">{k.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => startBearbeiten(k)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => loeschen(k.id)}
                  disabled={kategorien.length <= 1}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-xs" onClick={hinzufuegen}>
            <Plus className="h-3 w-3 mr-1" /> Kategorie hinzufügen
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// --- Bühne-Eigenschaften ---
function BuehneEigenschaften({ buehne, onChange }: { buehne: Buehne; onChange: (d: Partial<Buehne>) => void }) {
  const [offen, setOffen] = useState(false);
  return (
    <Card className="border-slate-200">
      <CardHeader className="py-2 px-3">
        <button className="flex items-center justify-between w-full" onClick={() => setOffen(!offen)}>
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
            <Input value={buehne.label} onChange={(e) => onChange({ label: e.target.value })} className="h-6 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ZahlInput label="Breite" value={buehne.breite} min={80} max={800} onChange={(v) => onChange({ breite: v })} einheit="px" />
            <ZahlInput label="Höhe"   value={buehne.hoehe}  min={20} max={200} onChange={(v) => onChange({ hoehe:  v })} einheit="px" />
          </div>
          <WinkelSlider value={buehne.winkel} onChange={(v) => onChange({ winkel: v })} />
          <p className="text-xs text-muted-foreground">Tipp: Bühne auf dem Canvas anklicken → Anfasser zum Skalieren.</p>
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
    <Card className="border-amber-300 bg-amber-50/40">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-xs text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" /> {TYP_META[el.typ].label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Bezeichnung</Label>
          <Input value={el.bezeichnung} maxLength={4}
            onChange={(e) => onChange({ bezeichnung: e.target.value.toUpperCase().slice(0, 4) } as Partial<SitzplanElement>)}
            className="h-6 text-xs" />
        </div>

        {el.typ === "reihe" && (<>
          <ZahlInput label="Anzahl Sitze" value={el.anzahlSitze} min={1} max={50} onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
          <ZahlInput label="Sitzabstand"  value={el.sitzAbstand} min={24} max={60} onChange={(v) => onChange({ sitzAbstand: v } as Partial<SitzplanElement>)} einheit="px" />
        </>)}

        {el.typ === "tischreihe" && (<>
          <ZahlInput label="Anzahl Tische"   value={el.anzahlTische}   min={1} max={20} onChange={(v) => onChange({ anzahlTische:   v } as Partial<SitzplanElement>)} />
          <ZahlInput label="Sitze pro Tisch" value={el.sitzeProTisch}  min={1} max={10} onChange={(v) => onChange({ sitzeProTisch:  v } as Partial<SitzplanElement>)} />
          <ZahlInput label="Tischabstand"    value={el.tischAbstand}   min={4} max={80} onChange={(v) => onChange({ tischAbstand:   v } as Partial<SitzplanElement>)} einheit="px" />
        </>)}

        {el.typ === "rundtisch" && (<>
          <ZahlInput label="Sitze ringsum" value={el.anzahlSitze}  min={2} max={20}  onChange={(v) => onChange({ anzahlSitze:  v } as Partial<SitzplanElement>)} />
          <ZahlInput label="Tischradius"   value={el.tischRadius}  min={20} max={120} onChange={(v) => onChange({ tischRadius:  v } as Partial<SitzplanElement>)} einheit="px" />
        </>)}

        <WinkelSlider value={el.winkel} onChange={(v) => onChange({ winkel: v } as Partial<SitzplanElement>)} />

        {/* Preiskategorie */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Preiskategorie</Label>
          <div className="flex flex-col gap-1">
            {kategorien.map((k) => (
              <button key={k.id} onClick={() => onChange({ kategorie_id: k.id } as Partial<SitzplanElement>)}
                className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs border transition-colors text-left ${
                  el.kategorie_id === k.id ? "border-primary bg-primary/5 font-medium" : "border-input hover:bg-muted"
                }`}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: k.farbe }} />
                <span className="flex-1">{k.name}</span>
                <span className="text-muted-foreground">
                  {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
                {el.kategorie_id === k.id && <Check className="h-3 w-3 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <Button size="sm" variant="destructive" className="w-full" onClick={onLoeschen}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Element löschen
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Haupt-Toolbar ---
type Props = {
  elemente: SitzplanElement[]; auswahl: Auswahl; buehne: Buehne;
  kategorien: Preiskategorie[];
  speichernLaedt: boolean; gesamtSitze: number;
  onHinzufuegen: (typ: ElementTyp) => void;
  onLoeschen: (id: string) => void;
  onAktualisieren: (id: string, delta: Partial<SitzplanElement>) => void;
  onBuehneAktualisieren: (delta: Partial<Buehne>) => void;
  onKategorienAktualisieren: (k: Preiskategorie[]) => void;
  onAuswaehlen: (a: Auswahl) => void;
  onSpeichern: () => void;
};

export default function EditorToolbar({
  elemente, auswahl, buehne, kategorien, speichernLaedt, gesamtSitze,
  onHinzufuegen, onLoeschen, onAktualisieren, onBuehneAktualisieren,
  onKategorienAktualisieren, onAuswaehlen, onSpeichern,
}: Props) {
  const ausgewaehltesElement = auswahl?.typ === "element"
    ? elemente.find((e) => e.id === auswahl.id) ?? null : null;

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-sm font-medium">{elemente.length} Elemente</p>
          <p className="text-xs text-muted-foreground">{gesamtSitze} Sitze gesamt</p>
        </div>
        <div className="flex gap-1">
          {kategorien.slice(0, 3).map((k) => (
            <Badge key={k.id} variant="outline" className="text-xs py-0 px-1.5" style={{ borderColor: k.farbe, color: k.farbe }}>
              {k.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Element hinzufügen */}
      <div className="shrink-0 space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Hinzufügen</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(TYP_META) as [ElementTyp, typeof TYP_META[ElementTyp]][]).map(([typ, meta]) => (
            <button key={typ} onClick={() => onHinzufuegen(typ)}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-md border border-input hover:bg-accent text-xs font-medium transition-colors">
              <meta.icon className="h-4 w-4" />
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollbarer Bereich */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        <PreiskategorienEditor kategorien={kategorien} onChange={onKategorienAktualisieren} />
        <BuehneEigenschaften buehne={buehne} onChange={onBuehneAktualisieren} />

        {ausgewaehltesElement ? (
          <ElementEigenschaften
            el={ausgewaehltesElement}
            kategorien={kategorien}
            onChange={(d) => onAktualisieren(ausgewaehltesElement.id, d)}
            onLoeschen={() => { onLoeschen(ausgewaehltesElement.id); onAuswaehlen(null); }}
          />
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
            Element auf dem Canvas anklicken
          </p>
        )}
      </div>

      <Button onClick={onSpeichern} disabled={speichernLaedt} className="w-full shrink-0">
        <Save className="h-4 w-4 mr-1.5" />
        {speichernLaedt ? "Speichern…" : "Raumplan speichern"}
      </Button>
    </div>
  );
}
