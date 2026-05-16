"use client";

import { useState, useEffect } from "react";
import {
  AlignJustify, Armchair, CircleDot, Trash2, Minus, Plus, X, RotateCcw, Users,
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

// Blendet Browser-Spinner bei type="number" aus
const NO_SPINNER =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const FIELD_LABEL = "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground select-none whitespace-nowrap";
const NUM_INPUT   = `h-8 w-14 text-sm font-semibold text-center rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring ${NO_SPINNER}`;
const ICON_BTN    = "h-8 w-8 rounded-md border border-input bg-background hover:bg-accent flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

function Sep() {
  return <div className="w-px self-stretch bg-border shrink-0 mx-3" />;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <span className={FIELD_LABEL}>{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function Stepper({ label, value, min, max, onChange, einheit, schritt = 1 }: {
  label: string; value: number; min?: number; max?: number; schritt?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  function clamp(v: number) { return Math.min(max ?? 999, Math.max(min ?? 0, v)); }
  return (
    <Section label={label}>
      <button type="button" className={ICON_BTN}
        disabled={min !== undefined && value <= min}
        onClick={() => onChange(clamp(value - schritt))}>
        <Minus className="h-3 w-3" />
      </button>
      <input
        type="number" value={value} min={min} max={max}
        className={NUM_INPUT}
        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) onChange(clamp(v)); }}
      />
      <button type="button" className={ICON_BTN}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(clamp(value + schritt))}>
        <Plus className="h-3 w-3" />
      </button>
      {einheit && <span className="text-[10px] text-muted-foreground">{einheit}</span>}
    </Section>
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
  const [loeschen, setLoeschen] = useState(false);
  const sitzAnzahl = elementSitzIds(el).length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onSchliessen(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSchliessen]);

  useEffect(() => { setLoeschen(false); }, [el.id]);

  return (
    <div className="border-t-2 bg-background shrink-0 animate-slide-up"
      style={{ borderColor: FARBE_ELEMENT_SELEKTIERT }}>

      <div className="flex items-end gap-0 px-5 py-3 overflow-x-auto min-w-max">

        {/* ── Element-Identität ── */}
        <div className="flex items-end gap-3 shrink-0 pr-4">
          {/* Typ-Badge */}
          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Typ</span>
            <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-input bg-muted/40">
              <span className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                style={{ background: FARBE_ELEMENT_SELEKTIERT + "20" }}>
                <Icon className="h-3 w-3" style={{ color: FARBE_ELEMENT_SELEKTIERT }} />
              </span>
              <span className="text-xs font-semibold" style={{ color: FARBE_ELEMENT_SELEKTIERT }}>
                {typLabel}
              </span>
            </div>
          </div>

          {/* Bezeichnung */}
          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Bezeichnung</span>
            <input
              value={el.bezeichnung}
              maxLength={4}
              onChange={(e) =>
                onChange({ bezeichnung: e.target.value.toUpperCase().slice(0, 4) } as Partial<SitzplanElement>)
              }
              className="h-8 w-16 text-sm font-bold tracking-widest text-center rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Plätze-Badge */}
          <div className="flex flex-col gap-1.5">
            <span className={FIELD_LABEL}>Plätze</span>
            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-input bg-muted/40">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold tabular-nums">{sitzAnzahl}</span>
            </div>
          </div>
        </div>

        <Sep />

        {/* ── Typ-spezifische Felder ── */}
        <div className="flex items-end gap-4 px-4 shrink-0">
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
        </div>

        <Sep />

        {/* ── Winkel ── */}
        <div className="flex flex-col gap-1.5 px-4 w-52 shrink-0">
          <div className="flex items-center justify-between">
            <span className={FIELD_LABEL}>Winkel</span>
            <button type="button"
              onClick={() => onChange({ winkel: 0 } as Partial<SitzplanElement>)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted rounded px-1.5 py-0.5 transition-colors">
              <RotateCcw className="h-2.5 w-2.5" /> Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="range" min={-180} max={180} step={1} value={el.winkel}
              onChange={(e) => onChange({ winkel: Number(e.target.value) } as Partial<SitzplanElement>)}
              className="flex-1 h-1.5 accent-primary cursor-pointer" />
            <input type="number" min={-180} max={180} value={Math.round(el.winkel)}
              className={NUM_INPUT}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) onChange({ winkel: Math.min(180, Math.max(-180, v)) } as Partial<SitzplanElement>);
              }} />
            <span className="text-xs text-muted-foreground shrink-0">°</span>
          </div>
        </div>

        <Sep />

        {/* ── Preiskategorie ── */}
        <div className="flex flex-col gap-1.5 px-4 shrink-0">
          <span className={FIELD_LABEL}>Preiskategorie</span>
          <div className="flex gap-1.5 items-center">
            {kategorien.map((k) => {
              const aktiv = el.kategorie_id === k.id;
              return (
                <button key={k.id} type="button"
                  onClick={() => onChange({ kategorie_id: k.id } as Partial<SitzplanElement>)}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border-2 transition-all duration-100 ${
                    aktiv ? "text-white shadow-sm" : "border-input bg-background hover:bg-muted"
                  }`}
                  style={aktiv ? { background: k.farbe, borderColor: k.farbe } : {}}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: aktiv ? "rgba(255,255,255,0.9)" : k.farbe }} />
                  {k.name}
                  <span className={`text-[10px] font-normal ${aktiv ? "opacity-75" : "text-muted-foreground"}`}>
                    {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Sep />

        {/* ── Aktionen ── */}
        <div className="flex items-end gap-2 pl-4 shrink-0">
          {loeschen ? (
            <div className="flex items-center gap-2 border border-destructive/30 rounded-lg px-3 py-1.5 animate-slide-up"
              style={{ background: "color-mix(in srgb, var(--destructive) 8%, transparent)" }}>
              <Trash2 className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span className="text-xs font-medium text-destructive whitespace-nowrap">Wirklich löschen?</span>
              <button type="button" onClick={onLoeschen}
                className="h-7 px-2.5 rounded-md text-xs font-semibold bg-destructive text-white hover:opacity-90 transition-opacity">
                Ja
              </button>
              <button type="button" onClick={() => setLoeschen(false)}
                className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Abbrechen
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setLoeschen(true)}
              title="Element löschen"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onSchliessen}
            title="Schließen (Esc)"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
