"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronUp, Tickets, GripVertical, X } from "lucide-react";
import type { TicketTyp, PflichtFeld, PreisRegel } from "@/types/ticket-typ";
import { regelLabel } from "@/types/ticket-typ";

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

function euro(cent: number) {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function PreisRegelEditor({ regel, onChange }: { regel: PreisRegel; onChange: (r: PreisRegel) => void }) {
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
            {typ === "basis" ? "Normal" : typ === "fest" ? "Festpreis" : typ === "prozent" ? "Prozent" : "Rabatt"}
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
          <span className="text-sm text-muted-foreground">€ pro Ticket (unabhängig vom Sitzpreis)</span>
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
          <span className="text-sm text-muted-foreground">% des Sitzpreises</span>
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
          <span className="text-sm text-muted-foreground">€ Nachlass auf den Sitzpreis</span>
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
  return (
    <div className="flex gap-2 items-start p-2.5 rounded-lg bg-muted/40 border border-border">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1.5 shrink-0" />
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          placeholder="Feldbezeichnung (z.B. Schülerausweis-Nr.)"
          value={feld.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="h-7 text-xs col-span-2"
        />
        <select
          value={feld.typ}
          onChange={(e) => onChange({ typ: e.target.value as PflichtFeld["typ"] })}
          className="h-7 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="text">Text</option>
          <option value="zahl">Zahl</option>
          <option value="email">E-Mail</option>
          <option value="auswahl">Auswahl (Dropdown)</option>
        </select>
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            id={`pflicht-${feld.id}`}
            checked={feld.pflicht}
            onChange={(e) => onChange({ pflicht: e.target.checked })}
            className="h-3.5 w-3.5"
          />
          <label htmlFor={`pflicht-${feld.id}`} className="text-xs text-muted-foreground">Pflichtfeld</label>
        </div>
        {feld.typ === "auswahl" && (
          <div className="col-span-2">
            <Input
              placeholder="Optionen, kommagetrennt (z.B. Klasse 1, Klasse 2)"
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

function TypEditor({ typ, onChange, onDelete }: {
  typ: TicketTyp;
  onChange: (t: Partial<TicketTyp>) => void;
  onDelete: () => void;
}) {
  const [offen, setOffen] = useState(!typ.name);

  return (
    <div className={`rounded-xl border transition-colors ${typ.aktiv ? "border-border" : "border-border/50 opacity-60"}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button type="button" onClick={() => setOffen((v) => !v)} className="flex-1 flex items-center gap-2 text-left min-w-0">
          {offen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="font-medium text-sm truncate">{typ.name || <span className="text-muted-foreground italic">Unbenannt</span>}</span>
          {typ.name && <span className="text-xs text-muted-foreground shrink-0">{regelLabel(typ.preis_regel)}</span>}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange({ aktiv: !typ.aktiv })}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              typ.aktiv ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {typ.aktiv ? "Aktiv" : "Inaktiv"}
          </button>
          <button type="button" onClick={onDelete} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {offen && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={typ.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="z.B. Schülerticket, Seniorenticket"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max. pro Buchung (optional)</Label>
              <Input
                type="number" min="1"
                value={typ.max_pro_buchung ?? ""}
                onChange={(e) => onChange({ max_pro_buchung: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Unbegrenzt"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kurzbeschreibung (optional, sichtbar für Kunden)</Label>
            <Input
              value={typ.beschreibung ?? ""}
              onChange={(e) => onChange({ beschreibung: e.target.value })}
              placeholder="z.B. Nur mit gültigem Schülerausweis"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Preisregel</Label>
            <PreisRegelEditor
              regel={typ.preis_regel}
              onChange={(r) => onChange({ preis_regel: r })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Zusatzfelder beim Checkout</Label>
              <button
                type="button"
                onClick={() => onChange({ pflichtfelder: [...typ.pflichtfelder, NEUES_FELD()] })}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Feld hinzufügen
              </button>
            </div>
            {typ.pflichtfelder.length === 0 ? (
              <p className="text-xs text-muted-foreground">Keine zusätzlichen Felder — nur Name &amp; E-Mail werden abgefragt.</p>
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

export default function TicketTypen({ eventId, initialTypen }: { eventId: string; initialTypen: TicketTyp[] }) {
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
          <Tickets className="h-4 w-4" /> Ticket-Typen
        </CardTitle>
        {typen.length > 0 && (
          <Button size="sm" variant="outline" onClick={speichern} disabled={isPending}>
            {gespeichert ? "✓ Gespeichert" : "Speichern"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {typen.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Noch keine Typen definiert. Alle Kunden zahlen den normalen Sitzpreis.
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
              />
            ))}
          </div>
        )}
        <Button
          type="button" size="sm" variant="outline" className="w-full"
          onClick={() => setTypen((prev) => [...prev, NEUER_TYP()])}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Ticket-Typ hinzufügen
        </Button>
        {typen.length > 0 && (
          <Button size="sm" className="w-full" onClick={speichern} disabled={isPending}>
            {gespeichert ? "✓ Gespeichert" : "Speichern"}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Kunden wählen beim Checkout ihren Typ — der Preis und eventuelle Pflichtfelder passen sich automatisch an.
        </p>
      </CardContent>
    </Card>
  );
}
