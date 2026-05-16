"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlignJustify, Armchair, CircleDot, Trash2, Minus, Plus,
  RotateCcw, ChevronLeft, Users, Check,
} from "lucide-react";
import {
  type SitzplanElement, type Preiskategorie, type ElementTyp,
  FARBE_ELEMENT_SELEKTIERT, elementSitzIds,
} from "@/types/sitzplan";

const TYP_META: Record<ElementTyp, { label: string; icon: React.ElementType }> = {
  reihe:      { label: "Reihe",        icon: AlignJustify },
  tischreihe: { label: "Tischreihe",   icon: Armchair     },
  rundtisch:  { label: "Runder Tisch", icon: CircleDot    },
};

const NO_SPIN = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1 select-none">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-border mx-4" />;
}

function Stepper({ label, value, min, max, onChange, einheit, schritt = 1 }: {
  label: string; value: number; min?: number; max?: number; schritt?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  function clamp(v: number) { return Math.min(max ?? 9999, Math.max(min ?? 0, v)); }
  return (
    <div className="flex items-center justify-between px-4 py-1.5">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <button type="button"
          className="h-7 w-7 rounded-md border border-input bg-background hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={min !== undefined && value <= min}
          onClick={() => onChange(clamp(value - schritt))}>
          <Minus className="h-3 w-3" />
        </button>
        <input type="number" value={value} min={min} max={max}
          className={`h-7 w-14 text-sm font-medium text-center rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring ${NO_SPIN}`}
          onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(clamp(v)); }}
        />
        <button type="button"
          className="h-7 w-7 rounded-md border border-input bg-background hover:bg-accent flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={max !== undefined && value >= max}
          onClick={() => onChange(clamp(value + schritt))}>
          <Plus className="h-3 w-3" />
        </button>
        {einheit && <span className="text-xs text-muted-foreground w-5">{einheit}</span>}
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

export default function ElementEigenschaftenPanel({ el, kategorien, onChange, onLoeschen, onSchliessen }: Props) {
  const { icon: Icon, label: typLabel } = TYP_META[el.typ];
  const [loeschen, setLoeschen] = useState(false);
  const sitzAnzahl = elementSitzIds(el).length;
  const aktiveKat = kategorien.find((k) => k.id === el.kategorie_id);

  useEffect(() => { setLoeschen(false); }, [el.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onSchliessen(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSchliessen]);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-slide-up">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0"
        style={{ borderBottomColor: FARBE_ELEMENT_SELEKTIERT + "60" }}>
        <button type="button" onClick={onSchliessen}
          className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: FARBE_ELEMENT_SELEKTIERT + "20" }}>
            <Icon className="h-3.5 w-3.5" style={{ color: FARBE_ELEMENT_SELEKTIERT }} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: FARBE_ELEMENT_SELEKTIERT }}>
              {typLabel}
            </p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5 shrink-0">
            <Users className="h-2.5 w-2.5" />
            {sitzAnzahl}
          </span>
        </div>
      </div>

      {/* ── Scrollbarer Inhalt ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Bezeichnung */}
        <SectionLabel>Bezeichnung</SectionLabel>
        <div className="px-4 pb-2">
          <input
            value={el.bezeichnung} maxLength={4}
            onChange={(e) => onChange({ bezeichnung: e.target.value.toUpperCase().slice(0, 4) } as Partial<SitzplanElement>)}
            className="h-9 w-full text-center text-base font-bold tracking-widest rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="A"
          />
        </div>

        <Divider />

        {/* Typ-spezifische Konfiguration */}
        <SectionLabel>Konfiguration</SectionLabel>

        {el.typ === "reihe" && (<>
          <Stepper label="Sitze" value={el.anzahlSitze} min={1} max={60}
            onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
          <Stepper label="Sitzabstand" value={el.sitzAbstand} min={24} max={60} einheit="px"
            onChange={(v) => onChange({ sitzAbstand: v } as Partial<SitzplanElement>)} />
        </>)}

        {el.typ === "tischreihe" && (<>
          <Stepper label="Tische" value={el.anzahlTische} min={1} max={20}
            onChange={(v) => onChange({ anzahlTische: v } as Partial<SitzplanElement>)} />
          <Stepper label="Sitze / Tisch" value={el.sitzeProTisch} min={1} max={10}
            onChange={(v) => onChange({ sitzeProTisch: v } as Partial<SitzplanElement>)} />
          <Stepper label="Tischabstand" value={el.tischAbstand} min={4} max={80} einheit="px"
            onChange={(v) => onChange({ tischAbstand: v } as Partial<SitzplanElement>)} />
        </>)}

        {el.typ === "rundtisch" && (<>
          <Stepper label="Sitze" value={el.anzahlSitze} min={2} max={20}
            onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)} />
          <Stepper label="Radius" value={el.tischRadius} min={20} max={120} einheit="px"
            onChange={(v) => onChange({ tischRadius: v } as Partial<SitzplanElement>)} />
        </>)}

        <Divider />

        {/* Winkel */}
        <SectionLabel>Winkel</SectionLabel>
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <input type="range" min={-180} max={180} step={1} value={el.winkel}
              onChange={(e) => onChange({ winkel: Number(e.target.value) } as Partial<SitzplanElement>)}
              className="flex-1 h-1.5 accent-primary cursor-pointer" />
            <input type="number" min={-180} max={180} value={Math.round(el.winkel)}
              className={`h-7 w-14 text-sm font-medium text-center rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring ${NO_SPIN}`}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) onChange({ winkel: Math.min(180, Math.max(-180, v)) } as Partial<SitzplanElement>);
              }} />
            <span className="text-xs text-muted-foreground w-4">°</span>
          </div>
          <button type="button"
            onClick={() => onChange({ winkel: 0 } as Partial<SitzplanElement>)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 transition-colors w-full">
            <RotateCcw className="h-3 w-3" /> Winkel zurücksetzen
          </button>
        </div>

        <Divider />

        {/* Preiskategorie */}
        <SectionLabel>Preiskategorie</SectionLabel>
        <div className="px-4 pb-3 space-y-1.5">
          {kategorien.map((k) => {
            const aktiv = el.kategorie_id === k.id;
            return (
              <button key={k.id} type="button"
                onClick={() => onChange({ kategorie_id: k.id } as Partial<SitzplanElement>)}
                className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg border-2 transition-all text-left ${
                  aktiv ? "text-white shadow-sm" : "border-input bg-background hover:bg-muted"
                }`}
                style={aktiv ? { background: k.farbe, borderColor: k.farbe } : {}}>
                <span className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: aktiv ? "rgba(255,255,255,0.9)" : k.farbe }} />
                <span className="flex-1 text-sm font-medium">{k.name}</span>
                <span className={`text-xs font-normal ${aktiv ? "opacity-80" : "text-muted-foreground"}`}>
                  {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
                {aktiv && <Check className="h-3.5 w-3.5 shrink-0 opacity-90" />}
              </button>
            );
          })}
        </div>

      </div>

      {/* ── Footer: Löschen ── */}
      <div className="shrink-0 px-4 py-3 border-t border-border">
        {loeschen ? (
          <div className="rounded-lg border border-destructive/30 p-3 space-y-2 animate-slide-up"
            style={{ background: "color-mix(in srgb, var(--destructive) 8%, transparent)" }}>
            <p className="text-sm font-medium text-destructive">Element wirklich löschen?</p>
            <p className="text-xs text-muted-foreground">
              {typLabel} „{el.bezeichnung}" mit {sitzAnzahl} {sitzAnzahl === 1 ? "Platz" : "Plätzen"} wird entfernt.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" className="flex-1" onClick={onLoeschen}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Löschen
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLoeschen(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setLoeschen(true)}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-input text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Element löschen
          </button>
        )}
      </div>
    </div>
  );
}
