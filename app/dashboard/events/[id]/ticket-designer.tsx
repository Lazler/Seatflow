"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Eye, DownloadSimple as Download, Check } from "@phosphor-icons/react";
import type { TicketDesign } from "@/types/ticket-design";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";

/* ─── Live Preview ──────────────────────────────────────────────────────────── */
function TicketVorschau({
  design,
  eventTitel,
  datum,
  venue,
}: {
  design: TicketDesign;
  eventTitel: string;
  datum: string;
  venue?: string;
}) {
  const datumText = new Date(datum).toLocaleDateString("de-DE", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      className="rounded-xl overflow-hidden border border-border shadow-lg select-none"
      style={{ backgroundColor: design.hintergrundFarbe, fontFamily: "system-ui, sans-serif" }}
    >
      {/* Accent stripe */}
      <div style={{ height: 4, backgroundColor: design.akzentFarbe }} />

      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ backgroundColor: design.headerFarbe }}
      >
        <div>
          <p className="text-white font-bold text-base leading-tight truncate max-w-[220px]">
            {eventTitel || "Eventname"}
          </p>
          <p className="text-white/60 text-xs mt-0.5">{datumText}</p>
        </div>
        <div className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: design.akzentFarbe }}>
          TICKET
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-0">
        <div className="flex-1 px-5 py-4 space-y-3">
          {design.zeigeVeranstaltungsort && venue && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Veranstaltungsort</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: design.textFarbe }}>{venue}</p>
            </div>
          )}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Inhaber</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: design.textFarbe }}>Max Mustermann</p>
          </div>
          <div className="border-t border-dashed" style={{ borderColor: "#e2e8f0" }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold font-mono" style={{ color: design.akzentFarbe }}>A-12</p>
              {design.zeigeKategorie && (
                <p className="text-xs" style={{ color: "#64748b" }}>Parkett</p>
              )}
            </div>
            <p className="text-sm" style={{ color: "#64748b" }}>29,00 €</p>
          </div>
        </div>

        {/* QR section */}
        {design.zeigeQrCode && (
          <div
            className="w-24 flex flex-col items-center justify-center py-4 px-3 border-l border-dashed"
            style={{ borderColor: "#e2e8f0" }}
          >
            {/* Fake QR grid */}
            <div className="w-16 h-16 rounded grid grid-cols-8 gap-px p-1" style={{ backgroundColor: "#f1f5f9" }}>
              {Array.from({ length: 64 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-[1px]"
                  style={{ backgroundColor: (i * 7 + 3) % 11 > 5 || [0,1,8,9,16,17,56,57,48,49,6,7,14,15,62,63].includes(i) ? "#1e293b" : "transparent" }}
                />
              ))}
            </div>
            <p className="text-[8px] mt-1.5" style={{ color: "#94a3b8" }}>Einlass-QR</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2 flex items-center justify-between border-t"
        style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
      >
        {design.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={design.logoUrl} alt="Logo" className="h-5 max-w-[80px] object-contain" />
        ) : (
          <p className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>SeatFlow</p>
        )}
        <p className="text-[9px]" style={{ color: "#94a3b8" }}>
          {design.fusszeile || "Buchung #A1B2C3D4"}
        </p>
      </div>
    </div>
  );
}

/* ─── Color Swatch Picker ───────────────────────────────────────────────────── */
function FarbPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-md border border-input overflow-hidden shrink-0 cursor-pointer">
          <div className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono flex-1"
          maxLength={7}
        />
      </div>
    </div>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────────────────── */
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-1.5"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={`w-9 h-5 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-input"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

/* ─── Main Designer ─────────────────────────────────────────────────────────── */
export default function TicketDesigner({
  eventId,
  eventTitel,
  eventDatum,
  venue,
  initialDesign,
}: {
  eventId: string;
  eventTitel: string;
  eventDatum: string;
  venue?: string;
  initialDesign: TicketDesign | null;
}) {
  const [design, setDesign] = useState<TicketDesign>(initialDesign ?? DEFAULT_TICKET_DESIGN);
  const [gespeichert, setGespeichert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function update(patch: Partial<TicketDesign>) {
    setDesign((prev) => ({ ...prev, ...patch }));
  }

  async function speichern() {
    const supabase = createClient();
    await supabase.from("events").update({ ticket_design: design }).eq("id", eventId);
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2000);
    startTransition(() => router.refresh());
  }

  const PRESETS: { name: string; design: Partial<TicketDesign> }[] = [
    { name: "Dunkel", design: { headerFarbe: "#0f172a", akzentFarbe: "#6366f1", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Indigo", design: { headerFarbe: "#4338ca", akzentFarbe: "#818cf8", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Emerald", design: { headerFarbe: "#065f46", akzentFarbe: "#10b981", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Rot", design: { headerFarbe: "#991b1b", akzentFarbe: "#ef4444", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Gold", design: { headerFarbe: "#78350f", akzentFarbe: "#f59e0b", hintergrundFarbe: "#fffbeb", textFarbe: "#1e293b" } },
    { name: "Nacht", design: { headerFarbe: "#1e1b4b", akzentFarbe: "#a855f7", hintergrundFarbe: "#faf5ff", textFarbe: "#1e1b4b" } },
  ];

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" /> Ticket-Design
        </CardTitle>
        <Button size="sm" variant="outline" onClick={speichern} disabled={isPending}>
          {gespeichert ? <><Check className="h-3.5 w-3.5 mr-1" /> Gespeichert</> : "Speichern"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Live Preview */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Vorschau
          </p>
          <TicketVorschau design={design} eventTitel={eventTitel} datum={eventDatum} venue={venue} />
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <Label className="text-xs">Farbschema</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => update(p.design)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-input hover:bg-muted transition-colors text-xs"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                  style={{ background: `linear-gradient(135deg, ${p.design.headerFarbe}, ${p.design.akzentFarbe})` }}
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <FarbPicker label="Kopfzeile" value={design.headerFarbe} onChange={(v) => update({ headerFarbe: v })} />
          <FarbPicker label="Akzentfarbe" value={design.akzentFarbe} onChange={(v) => update({ akzentFarbe: v })} />
          <FarbPicker label="Hintergrund" value={design.hintergrundFarbe} onChange={(v) => update({ hintergrundFarbe: v })} />
          <FarbPicker label="Textfarbe" value={design.textFarbe} onChange={(v) => update({ textFarbe: v })} />
        </div>

        {/* Logo */}
        <div className="space-y-1">
          <Label className="text-xs">Logo-URL (optional)</Label>
          <Input
            value={design.logoUrl ?? ""}
            onChange={(e) => update({ logoUrl: e.target.value || undefined })}
            placeholder="https://deine-domain.de/logo.png"
            className="h-8 text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Erscheint in der Fußzeile des Tickets.</p>
        </div>

        {/* Footer message */}
        <div className="space-y-1">
          <Label className="text-xs">Fußzeile (optional)</Label>
          <Input
            value={design.fusszeile ?? ""}
            onChange={(e) => update({ fusszeile: e.target.value || undefined })}
            placeholder="z.B. Kein Umtausch · veranstalter.de"
            className="h-8 text-xs"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-0.5 border-t border-border pt-3">
          <Toggle label="Veranstaltungsort anzeigen" value={design.zeigeVeranstaltungsort} onChange={(v) => update({ zeigeVeranstaltungsort: v })} />
          <Toggle label="Ticketkategorie anzeigen" value={design.zeigeKategorie} onChange={(v) => update({ zeigeKategorie: v })} />
          <Toggle label="QR-Code anzeigen" value={design.zeigeQrCode} onChange={(v) => update({ zeigeQrCode: v })} />
        </div>

        <Button size="sm" className="w-full" onClick={speichern} disabled={isPending}>
          {gespeichert ? "✓ Gespeichert" : "Design speichern"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Das Design wird auf alle Ticket-PDFs angewendet, die bei neuen Buchungen verschickt werden.
        </p>
      </CardContent>
    </Card>
  );
}
