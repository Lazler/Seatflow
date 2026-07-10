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
import { useT, useLocale } from "@/components/i18n-provider";

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
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";
  const datumText = new Date(datum).toLocaleDateString(dateLocale, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const hellHeader = design.headerStil === "hell";

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
        style={{
          backgroundColor: hellHeader ? "#ffffff" : design.headerFarbe,
          borderBottom: hellHeader ? `2px solid ${design.akzentFarbe}` : undefined,
        }}
      >
        <div>
          <p
            className="font-bold text-base leading-tight truncate max-w-[220px]"
            style={{ color: hellHeader ? design.textFarbe : "#ffffff" }}
          >
            {eventTitel || t.ticketDesigner.previewEventname}
          </p>
          <p className="text-xs mt-0.5" style={{ color: hellHeader ? "#94a3b8" : "rgba(255,255,255,0.6)" }}>{datumText}</p>
        </div>
        <div className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: design.akzentFarbe }}>
          {t.ticketDesigner.badgeTicket}
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-0">
        <div className="flex-1 px-5 py-4 space-y-3">
          {design.zeigeVeranstaltungsort && venue && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{t.ticketDesigner.labelVeranstaltungsort}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: design.textFarbe }}>{venue}</p>
            </div>
          )}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{t.ticketDesigner.labelInhaber}</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: design.textFarbe }}>Max Mustermann</p>
          </div>
          <div className="border-t border-dashed" style={{ borderColor: "#e2e8f0" }} />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-mono leading-none" style={{ color: design.akzentFarbe }}>A-12</p>
              {design.zeigeKategorie && (
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>{t.ticketDesigner.previewKategorie}</p>
              )}
            </div>
            <p className="text-sm" style={{ color: "#94a3b8" }}>29,00 €</p>
          </div>
        </div>

        {/* QR section */}
        {design.zeigeQrCode && (
          <div className="w-24 flex flex-col items-center justify-center py-4 px-3 relative">
            {/* Perforation (Abriss-Optik) */}
            <div className="absolute left-0 top-3 bottom-3 flex flex-col justify-between items-center">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="w-[3px] h-[3px] rounded-full" style={{ background: "#cbd5e1" }} />
              ))}
            </div>
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
            <p className="text-[8px] mt-1.5" style={{ color: "#94a3b8" }}>{t.ticketDesigner.einlassQr}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2 flex items-center justify-between border-t"
        style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
      >
        {design.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={design.logoUrl} alt="Logo" className="h-5 max-w-[80px] object-contain" />
        ) : (
          <p className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>SeatFlow</p>
        )}
        <p className="text-[9px]" style={{ color: "#94a3b8" }}>
          {design.fusszeile || t.ticketDesigner.previewFusszeile}
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
  const t = useT();
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

  const PRESETS: { name: string; label: string; design: Partial<TicketDesign> }[] = [
    { name: "Dunkel", label: t.ticketDesigner.presetDunkel, design: { headerStil: "farbig", headerFarbe: "#0f172a", akzentFarbe: "#6366f1", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Indigo", label: t.ticketDesigner.presetIndigo, design: { headerStil: "farbig", headerFarbe: "#4338ca", akzentFarbe: "#818cf8", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Emerald", label: t.ticketDesigner.presetEmerald, design: { headerStil: "farbig", headerFarbe: "#065f46", akzentFarbe: "#10b981", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Rot", label: t.ticketDesigner.presetRot, design: { headerStil: "farbig", headerFarbe: "#991b1b", akzentFarbe: "#ef4444", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
    { name: "Gold", label: t.ticketDesigner.presetGold, design: { headerStil: "farbig", headerFarbe: "#78350f", akzentFarbe: "#f59e0b", hintergrundFarbe: "#fffbeb", textFarbe: "#1e293b" } },
    { name: "Nacht", label: t.ticketDesigner.presetNacht, design: { headerStil: "farbig", headerFarbe: "#1e1b4b", akzentFarbe: "#a855f7", hintergrundFarbe: "#faf5ff", textFarbe: "#1e1b4b" } },
    // Druckoptimiert: weißer Header + Akzentlinie (spart Toner)
    { name: "Minimal", label: t.ticketDesigner.presetMinimal, design: { headerStil: "hell", headerFarbe: "#0f172a", akzentFarbe: "#6366f1", hintergrundFarbe: "#ffffff", textFarbe: "#0f172a" } },
    { name: "Linie Grün", label: t.ticketDesigner.presetLinieGruen, design: { headerStil: "hell", headerFarbe: "#065f46", akzentFarbe: "#10b981", hintergrundFarbe: "#ffffff", textFarbe: "#0f172a" } },
    { name: "Linie Amber", label: t.ticketDesigner.presetLinieAmber, design: { headerStil: "hell", headerFarbe: "#78350f", akzentFarbe: "#f59e0b", hintergrundFarbe: "#ffffff", textFarbe: "#0f172a" } },
  ];

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" /> {t.ticketDesigner.ticketDesign}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={speichern} disabled={isPending}>
          {gespeichert ? <><Check className="h-3.5 w-3.5 mr-1" /> {t.ticketDesigner.gespeichert}</> : t.common.speichern}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Live Preview */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> {t.ticketDesigner.vorschau}
          </p>
          <TicketVorschau design={design} eventTitel={eventTitel} datum={eventDatum} venue={venue} />
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <Label className="text-xs">{t.ticketDesigner.farbschema}</Label>
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
                  style={{ background: p.design.headerStil === "hell"
                    ? `linear-gradient(135deg, #ffffff, ${p.design.akzentFarbe})`
                    : `linear-gradient(135deg, ${p.design.headerFarbe}, ${p.design.akzentFarbe})` }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <FarbPicker label={t.ticketDesigner.kopfzeile} value={design.headerFarbe} onChange={(v) => update({ headerFarbe: v })} />
          <FarbPicker label={t.ticketDesigner.akzentfarbe} value={design.akzentFarbe} onChange={(v) => update({ akzentFarbe: v })} />
          <FarbPicker label={t.ticketDesigner.hintergrund} value={design.hintergrundFarbe} onChange={(v) => update({ hintergrundFarbe: v })} />
          <FarbPicker label={t.ticketDesigner.textfarbe} value={design.textFarbe} onChange={(v) => update({ textFarbe: v })} />
        </div>

        {/* Logo */}
        <div className="space-y-1">
          <Label className="text-xs">{t.ticketDesigner.logoUrlOptional}</Label>
          <Input
            value={design.logoUrl ?? ""}
            onChange={(e) => update({ logoUrl: e.target.value || undefined })}
            placeholder={t.ticketDesigner.logoUrlPlaceholder}
            className="h-8 text-xs"
          />
          <p className="text-[10px] text-muted-foreground">{t.ticketDesigner.logoHinweis}</p>
        </div>

        {/* Footer message */}
        <div className="space-y-1">
          <Label className="text-xs">{t.ticketDesigner.fusszeileOptional}</Label>
          <Input
            value={design.fusszeile ?? ""}
            onChange={(e) => update({ fusszeile: e.target.value || undefined })}
            placeholder={t.ticketDesigner.fusszeilePlaceholder}
            className="h-8 text-xs"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-0.5 border-t border-border pt-3">
          <Toggle label={t.ticketDesigner.toggleHellerHeader} value={design.headerStil === "hell"} onChange={(v) => update({ headerStil: v ? "hell" : "farbig" })} />
          <Toggle label={t.ticketDesigner.toggleVeranstaltungsort} value={design.zeigeVeranstaltungsort} onChange={(v) => update({ zeigeVeranstaltungsort: v })} />
          <Toggle label={t.ticketDesigner.toggleKategorie} value={design.zeigeKategorie} onChange={(v) => update({ zeigeKategorie: v })} />
          <Toggle label={t.ticketDesigner.toggleQrCode} value={design.zeigeQrCode} onChange={(v) => update({ zeigeQrCode: v })} />
        </div>

        <Button size="sm" className="w-full" onClick={speichern} disabled={isPending}>
          {gespeichert ? t.ticketDesigner.gespeichertCheck : t.ticketDesigner.designSpeichern}
        </Button>

        <p className="text-xs text-muted-foreground">
          {t.ticketDesigner.hinweis}
        </p>
      </CardContent>
    </Card>
  );
}
