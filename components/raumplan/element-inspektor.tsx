"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlignJustify, Armchair, CircleDot, Trash2, Minus, Plus, Check, X } from "lucide-react";
import {
  type SitzplanElement, type Preiskategorie, type ElementTyp,
  FARBE_ELEMENT_SELEKTIERT,
} from "@/types/sitzplan";

const TYP_META: Record<ElementTyp, { label: string; icon: React.ElementType }> = {
  reihe:      { label: "Reihe",        icon: AlignJustify },
  tischreihe: { label: "Tischreihe",   icon: Armchair     },
  rundtisch:  { label: "Runder Tisch", icon: CircleDot    },
};

function Stepper({ label, value, min, max, onChange, einheit, schritt = 1 }: {
  label: string; value: number; min?: number; max?: number; schritt?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">{label}</Label>
      <div className="flex items-center gap-0.5">
        <Button size="icon" variant="outline" className="h-7 w-7 shrink-0"
          onClick={() => onChange(Math.max(min ?? 0, value - schritt))}
          disabled={min !== undefined && value <= min}>
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number" value={value} min={min} max={max}
          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(Math.min(max ?? 999, Math.max(min ?? 0, v))); }}
          className="h-7 text-xs text-center px-1 w-14"
        />
        <Button size="icon" variant="outline" className="h-7 w-7 shrink-0"
          onClick={() => onChange(Math.min(max ?? 999, value + schritt))}
          disabled={max !== undefined && value >= max}>
          <Plus className="h-3 w-3" />
        </Button>
        {einheit && <span className="text-[10px] text-muted-foreground ml-0.5 shrink-0">{einheit}</span>}
      </div>
    </div>
  );
}

type Props = {
  el: SitzplanElement;
  kategorien: Preiskategorie[];
  onChange: (delta: Partial<SitzplanElement>) => void;
  onLoeschen: () => void;
  onSchliessen: () => void;
};

export default function ElementInspektor({ el, kategorien, onChange, onLoeschen, onSchliessen }: Props) {
  const { icon: Icon, label: typLabel } = TYP_META[el.typ];

  return (
    <div
      className="border-t-2 bg-background shrink-0 overflow-x-auto"
      style={{ borderColor: FARBE_ELEMENT_SELEKTIERT }}
    >
      <div className="flex items-start gap-4 px-4 py-3 min-w-max">
        {/* Typ + Bezeichnung */}
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ background: FARBE_ELEMENT_SELEKTIERT + "22" }}>
              <Icon className="h-3 w-3" style={{ color: FARBE_ELEMENT_SELEKTIERT }} />
            </span>
            <span className="text-xs font-semibold" style={{ color: FARBE_ELEMENT_SELEKTIERT }}>{typLabel}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Bezeichnung</Label>
            <Input
              value={el.bezeichnung} maxLength={4}
              onChange={(e) => onChange({ bezeichnung: e.target.value.toUpperCase().slice(0, 4) } as Partial<SitzplanElement>)}
              className="h-7 text-xs w-16 text-center font-bold"
            />
          </div>
        </div>

        <div className="w-px self-stretch bg-border shrink-0" />

        {/* Typ-spezifische Felder */}
        <div className="flex items-end gap-3">
          {el.typ === "reihe" && (<>
            <Stepper label="Sitze" value={el.anzahlSitze} min={1} max={60} onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
            <Stepper label="Abstand" value={el.sitzAbstand} min={24} max={60} einheit="px" onChange={(v) => onChange({ sitzAbstand: v } as Partial<SitzplanElement>)} />
          </>)}

          {el.typ === "tischreihe" && (<>
            <Stepper label="Tische" value={el.anzahlTische} min={1} max={20} onChange={(v) => onChange({ anzahlTische: v } as Partial<SitzplanElement>)} />
            <Stepper label="Sitze/Tisch" value={el.sitzeProTisch} min={1} max={10} onChange={(v) => onChange({ sitzeProTisch: v } as Partial<SitzplanElement>)} />
            <Stepper label="Tischabstand" value={el.tischAbstand} min={4} max={80} einheit="px" onChange={(v) => onChange({ tischAbstand: v } as Partial<SitzplanElement>)} />
          </>)}

          {el.typ === "rundtisch" && (<>
            <Stepper label="Sitze" value={el.anzahlSitze} min={2} max={20} onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
            <Stepper label="Radius" value={el.tischRadius} min={20} max={120} einheit="px" onChange={(v) => onChange({ tischRadius: v } as Partial<SitzplanElement>)} />
          </>)}
        </div>

        <div className="w-px self-stretch bg-border shrink-0" />

        {/* Winkel */}
        <div className="flex flex-col gap-1 w-40 shrink-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Winkel: {Math.round(el.winkel)}°</Label>
          <input
            type="range" min={-180} max={180} step={1} value={el.winkel}
            onChange={(e) => onChange({ winkel: Number(e.target.value) } as Partial<SitzplanElement>)}
            className="w-full h-1.5 accent-primary cursor-pointer mt-1"
          />
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground text-left underline"
            onClick={() => onChange({ winkel: 0 } as Partial<SitzplanElement>)}
          >
            Reset
          </button>
        </div>

        <div className="w-px self-stretch bg-border shrink-0" />

        {/* Kategorie */}
        <div className="flex flex-col gap-1 shrink-0">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Preiskategorie</Label>
          <div className="flex gap-1.5 flex-wrap">
            {kategorien.map((k) => (
              <button
                key={k.id}
                onClick={() => onChange({ kategorie_id: k.id } as Partial<SitzplanElement>)}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs border transition-colors font-medium ${
                  el.kategorie_id === k.id
                    ? "text-white border-transparent"
                    : "border-input bg-background hover:bg-muted"
                }`}
                style={el.kategorie_id === k.id ? { background: k.farbe, borderColor: k.farbe } : {}}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: el.kategorie_id === k.id ? "white" : k.farbe }} />
                {k.name}
                <span className="text-[10px] opacity-75">
                  {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
                {el.kategorie_id === k.id && <Check className="h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px self-stretch bg-border shrink-0" />

        {/* Aktionen */}
        <div className="flex items-center gap-1 self-center shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onLoeschen} title="Element löschen">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={onSchliessen} title="Auswahl aufheben">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
