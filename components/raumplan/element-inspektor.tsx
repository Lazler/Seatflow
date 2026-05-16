"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap select-none">
      {children}
    </span>
  );
}

function Divider() {
  return <div className="w-px self-stretch bg-border shrink-0 mx-1" />;
}

function Stepper({ label, value, min, max, onChange, einheit, schritt = 1 }: {
  label: string; value: number; min?: number; max?: number; schritt?: number;
  onChange: (v: number) => void; einheit?: string;
}) {
  const atMin = min !== undefined && value <= min;
  const atMax = max !== undefined && value >= max;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min ?? 0, value - schritt))}
          disabled={atMin}
          className="h-8 w-8 rounded-md border border-input bg-background hover:bg-accent flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="number" value={value} min={min} max={max}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max ?? 999, Math.max(min ?? 0, v)));
          }}
          className="h-8 w-14 text-sm font-semibold text-center rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max ?? 999, value + schritt))}
          disabled={atMax}
          className="h-8 w-8 rounded-md border border-input bg-background hover:bg-accent flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
        </button>
        {einheit && <span className="text-[10px] text-muted-foreground shrink-0 ml-0.5">{einheit}</span>}
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
  const [loeschenBestaetigen, setLoeschenBestaetigen] = useState(false);
  const sitzAnzahl = elementSitzIds(el).length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSchliessen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSchliessen]);

  // Bestätigungsdialog zurücksetzen wenn das Element wechselt
  useEffect(() => {
    setLoeschenBestaetigen(false);
  }, [el.id]);

  return (
    <div
      className="border-t-2 bg-background shrink-0 animate-slide-up"
      style={{ borderColor: FARBE_ELEMENT_SELEKTIERT }}
    >
      <div className="flex items-center gap-0 px-4 py-2.5 min-w-max overflow-x-auto">

        {/* ── Typ-Badge + Bezeichnung ── */}
        <div className="flex items-center gap-4 pr-4 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: FARBE_ELEMENT_SELEKTIERT + "18" }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: FARBE_ELEMENT_SELEKTIERT }} />
              </span>
              <span className="text-sm font-semibold" style={{ color: FARBE_ELEMENT_SELEKTIERT }}>
                {typLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                <Users className="h-2.5 w-2.5" />
                {sitzAnzahl} {sitzAnzahl === 1 ? "Platz" : "Plätze"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel>Bezeichnung</FieldLabel>
              <Input
                value={el.bezeichnung}
                maxLength={4}
                onChange={(e) =>
                  onChange({ bezeichnung: e.target.value.toUpperCase().slice(0, 4) } as Partial<SitzplanElement>)
                }
                className="h-8 text-sm w-16 text-center font-bold tracking-wider"
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* ── Typ-spezifische Felder ── */}
        <div className="flex items-end gap-4 px-4 shrink-0">
          {el.typ === "reihe" && (<>
            <Stepper
              label="Sitze" value={el.anzahlSitze} min={1} max={60}
              onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)}
            />
            <Stepper
              label="Sitzabstand" value={el.sitzAbstand} min={24} max={60} einheit="px"
              onChange={(v) => onChange({ sitzAbstand: v } as Partial<SitzplanElement>)}
            />
          </>)}

          {el.typ === "tischreihe" && (<>
            <Stepper
              label="Tische" value={el.anzahlTische} min={1} max={20}
              onChange={(v) => onChange({ anzahlTische: v } as Partial<SitzplanElement>)}
            />
            <Stepper
              label="Sitze / Tisch" value={el.sitzeProTisch} min={1} max={10}
              onChange={(v) => onChange({ sitzeProTisch: v } as Partial<SitzplanElement>)}
            />
            <Stepper
              label="Tischabstand" value={el.tischAbstand} min={4} max={80} einheit="px"
              onChange={(v) => onChange({ tischAbstand: v } as Partial<SitzplanElement>)}
            />
          </>)}

          {el.typ === "rundtisch" && (<>
            <Stepper
              label="Sitze" value={el.anzahlSitze} min={2} max={20}
              onChange={(v) => onChange({ anzahlSitze: v } as Partial<SitzplanElement>)}
            />
            <Stepper
              label="Radius" value={el.tischRadius} min={20} max={120} einheit="px"
              onChange={(v) => onChange({ tischRadius: v } as Partial<SitzplanElement>)}
            />
          </>)}
        </div>

        <Divider />

        {/* ── Winkel ── */}
        <div className="flex flex-col gap-1.5 px-4 w-56 shrink-0">
          <div className="flex items-center justify-between">
            <FieldLabel>Winkel</FieldLabel>
            <button
              type="button"
              onClick={() => onChange({ winkel: 0 } as Partial<SitzplanElement>)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors rounded px-1 py-0.5 hover:bg-muted"
            >
              <RotateCcw className="h-2.5 w-2.5" /> Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range" min={-180} max={180} step={1} value={el.winkel}
              onChange={(e) => onChange({ winkel: Number(e.target.value) } as Partial<SitzplanElement>)}
              className="flex-1 h-1.5 accent-primary cursor-pointer"
            />
            <input
              type="number" min={-180} max={180} value={Math.round(el.winkel)}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v)) onChange({ winkel: Math.min(180, Math.max(-180, v)) } as Partial<SitzplanElement>);
              }}
              className="h-8 w-14 text-sm font-semibold text-center rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground shrink-0">°</span>
          </div>
        </div>

        <Divider />

        {/* ── Preiskategorie ── */}
        <div className="flex flex-col gap-1.5 px-4 shrink-0">
          <FieldLabel>Preiskategorie</FieldLabel>
          <div className="flex gap-2">
            {kategorien.map((k) => {
              const aktiv = el.kategorie_id === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => onChange({ kategorie_id: k.id } as Partial<SitzplanElement>)}
                  className={`flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium border-2 transition-all duration-100 ${
                    aktiv
                      ? "text-white shadow-sm"
                      : "border-input bg-background hover:bg-muted text-foreground"
                  }`}
                  style={aktiv ? { background: k.farbe, borderColor: k.farbe } : {}}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/20"
                    style={{ background: aktiv ? "rgba(255,255,255,0.85)" : k.farbe }}
                  />
                  <span>{k.name}</span>
                  <span className={`text-[10px] font-normal ${aktiv ? "opacity-75" : "text-muted-foreground"}`}>
                    {(k.preis_cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* ── Aktionen ── */}
        <div className="flex items-center gap-2 pl-4 shrink-0">
          {loeschenBestaetigen ? (
            <div className="flex items-center gap-2 bg-destructive/8 border border-destructive/25 rounded-lg px-3 py-1.5 animate-slide-up">
              <Trash2 className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span className="text-xs font-medium text-destructive whitespace-nowrap">Löschen?</span>
              <button
                type="button"
                onClick={onLoeschen}
                className="h-6 px-2.5 rounded-md text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 transition-colors"
              >
                Ja
              </button>
              <button
                type="button"
                onClick={() => setLoeschenBestaetigen(false)}
                className="h-6 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Nein
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLoeschenBestaetigen(true)}
              title="Element löschen"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onSchliessen}
            title="Auswahl aufheben (Esc)"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
