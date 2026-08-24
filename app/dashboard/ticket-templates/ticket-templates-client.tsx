"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash as Trash2, Check, PencilSimple as Pencil, CaretDown as ChevronDown, CaretUp as ChevronUp } from "@phosphor-icons/react";
import type { TicketDesign } from "@/types/ticket-design";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";
import type { TicketTemplate } from "./page";
import { useT, useLocale } from "@/components/i18n-provider";
import type { Dict } from "@/lib/i18n";

const PRESETS: { name: string; design: Partial<TicketDesign> }[] = [
  { name: "Dunkel",    design: { headerFarbe: "#0f172a", akzentFarbe: "#6366f1", hintergrundFarbe: "#ffffff", textFarbe: "#1e293b" } },
  { name: "Nacht",    design: { headerFarbe: "#18181b", akzentFarbe: "#f59e0b", hintergrundFarbe: "#fafafa", textFarbe: "#27272a" } },
  { name: "Ozean",    design: { headerFarbe: "#0369a1", akzentFarbe: "#38bdf8", hintergrundFarbe: "#ffffff", textFarbe: "#0c4a6e" } },
  { name: "Wald",     design: { headerFarbe: "#14532d", akzentFarbe: "#4ade80", hintergrundFarbe: "#f0fdf4", textFarbe: "#14532d" } },
  { name: "Rose",     design: { headerFarbe: "#881337", akzentFarbe: "#fb7185", hintergrundFarbe: "#fff1f2", textFarbe: "#881337" } },
  { name: "Minimal",  design: { headerFarbe: "#374151", akzentFarbe: "#9ca3af", hintergrundFarbe: "#ffffff", textFarbe: "#111827" } },
];

function presetLabel(t: Dict, name: string): string {
  const map: Record<string, string> = {
    Dunkel: t.ticketTemplates.presetDunkel,
    Nacht: t.ticketTemplates.presetNacht,
    Ozean: t.ticketTemplates.presetOzean,
    Wald: t.ticketTemplates.presetWald,
    Rose: t.ticketTemplates.presetRose,
    Minimal: t.ticketTemplates.presetMinimal,
  };
  return map[name] ?? name;
}

function ColorSwatch({ color, label, value, onChange }: {
  color: string; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded" />
        <div className="w-8 h-8 rounded-lg border-2 border-border shadow-sm cursor-pointer"
          style={{ backgroundColor: value }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-none">{label}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── Live preview ──────────────────────────────────────────────────────────── */
function TicketVorschau({ design, name }: { design: TicketDesign; name: string }) {
  const t = useT();
  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm select-none text-left"
      style={{ backgroundColor: design.hintergrundFarbe }}>
      <div style={{ height: 3, backgroundColor: design.akzentFarbe }} />
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ backgroundColor: design.headerFarbe }}>
        <div>
          <p className="text-white font-bold text-sm truncate max-w-[160px]">{name || t.ticketTemplates.previewEventname}</p>
          <p className="text-white/60 text-[10px]">{t.ticketTemplates.previewDatum}</p>
        </div>
        <div className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: design.akzentFarbe }}>
          {t.ticketTemplates.previewTicketTyp}
        </div>
      </div>
      <div className="px-4 py-3 flex gap-3 items-center">
        <div className="flex-1 space-y-1.5">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{t.ticketTemplates.labelInhaber}</p>
            <p className="text-xs font-bold" style={{ color: design.textFarbe }}>Max Mustermann</p>
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{t.ticketTemplates.labelPlatz}</p>
            <p className="text-sm font-bold" style={{ color: design.akzentFarbe }}>A-12</p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-md bg-muted border border-border flex items-center justify-center">
          <div className="w-10 h-10 grid grid-cols-4 gap-px opacity-50">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="rounded-[1px]" style={{ backgroundColor: i % 3 === 0 ? design.headerFarbe : "transparent" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-border/50 flex justify-between items-center"
        style={{ backgroundColor: "#f8fafc" }}>
        <p className="text-[9px]" style={{ color: "#94a3b8" }}>SeatFlow</p>
        <p className="text-[9px]" style={{ color: "#94a3b8" }}>
          {design.fusszeile || t.ticketTemplates.previewFusszeile}
        </p>
      </div>
    </div>
  );
}

/* ─── Designer form ─────────────────────────────────────────────────────────── */
function TemplateDesigner({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: { name: string; design: TicketDesign };
  onSave: (name: string, design: TicketDesign) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const t = useT();
  const [name, setName] = useState(initial.name);
  const [design, setDesign] = useState<TicketDesign>(initial.design);
  const [showKlein, setShowKlein] = useState(!!initial.design.kleingedrucktes);

  function update(patch: Partial<TicketDesign>) {
    setDesign((d) => ({ ...d, ...patch }));
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      {/* Controls */}
      <div className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t.ticketTemplates.templateName}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t.ticketTemplates.templateNamePlaceholder} className="h-9" />
        </div>

        {/* Color presets */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">{t.ticketTemplates.farbschema}</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} type="button"
                onClick={() => update(p.design)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors text-left">
                <div className="flex gap-0.5">
                  <div className="w-3 h-6 rounded-l-sm" style={{ backgroundColor: p.design.headerFarbe }} />
                  <div className="w-3 h-6 rounded-r-sm" style={{ backgroundColor: p.design.akzentFarbe }} />
                </div>
                <span className="text-xs font-medium">{presetLabel(t, p.name)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">{t.ticketTemplates.farbenAnpassen}</p>
          <div className="grid grid-cols-2 gap-3">
            <ColorSwatch color={design.headerFarbe} label={t.ticketTemplates.header} value={design.headerFarbe}
              onChange={(v) => update({ headerFarbe: v })} />
            <ColorSwatch color={design.akzentFarbe} label={t.ticketTemplates.akzent} value={design.akzentFarbe}
              onChange={(v) => update({ akzentFarbe: v })} />
            <ColorSwatch color={design.hintergrundFarbe} label={t.ticketTemplates.hintergrund} value={design.hintergrundFarbe}
              onChange={(v) => update({ hintergrundFarbe: v })} />
            <ColorSwatch color={design.textFarbe} label={t.ticketTemplates.text} value={design.textFarbe}
              onChange={(v) => update({ textFarbe: v })} />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">{t.ticketTemplates.optionen}</p>
          <div className="space-y-1.5">
            {[
              { key: "zeigeVeranstaltungsort" as const, label: t.ticketTemplates.veranstaltungsortAnzeigen },
              { key: "zeigeKategorie" as const, label: t.ticketTemplates.kategorieAnzeigen },
              { key: "zeigeQrCode" as const, label: t.ticketTemplates.qrCodeAnzeigen },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={design[key]}
                  onChange={(e) => update({ [key]: e.target.checked })}
                  className="rounded border-border" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Logo + footer */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t.ticketTemplates.logoUrl}</Label>
            <Input value={design.logoUrl ?? ""} onChange={(e) => update({ logoUrl: e.target.value || undefined })}
              placeholder={t.ticketTemplates.logoUrlPlaceholder} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t.ticketTemplates.fusszeile}</Label>
            <Input value={design.fusszeile ?? ""} onChange={(e) => update({ fusszeile: e.target.value || undefined })}
              placeholder={t.ticketTemplates.fusszeilePlaceholder} className="h-8 text-xs" />
          </div>
        </div>

        {/* Kleingedrucktes */}
        <div className="rounded-xl border border-border overflow-hidden">
          <button type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            onClick={() => setShowKlein((v) => !v)}>
            <div>
              <p className="text-sm font-semibold">{t.ticketTemplates.kleingedrucktes}</p>
              <p className="text-xs text-muted-foreground">{t.ticketTemplates.kleingedrucktesHinweis}</p>
            </div>
            {showKlein ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showKlein && (
            <div className="border-t border-border p-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                {t.ticketTemplates.markdownHinweis} <code className="bg-muted px-1 rounded">{t.ticketTemplates.markdownUeberschrift}</code>{" "}
                <code className="bg-muted px-1 rounded">{t.ticketTemplates.markdownFett}</code>{" "}
                <code className="bg-muted px-1 rounded">{t.ticketTemplates.markdownListe}</code>
              </p>
              <Textarea
                value={design.kleingedrucktes ?? ""}
                onChange={(e) => update({ kleingedrucktes: e.target.value || undefined })}
                placeholder={t.ticketTemplates.kleingedrucktesPlaceholder}
                className="min-h-[180px] text-xs font-mono resize-y"
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.ticketTemplates.vorschau}</p>
        <TicketVorschau design={design} name={name} />

        {design.kleingedrucktes?.trim() && (
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t.ticketTemplates.kleingedrucktesVorschau}</p>
            <div className="prose prose-xs max-w-none text-xs text-muted-foreground">
              <div className="space-y-1">
                {design.kleingedrucktes.split("\n").map((line: string, i: number) => {
                  if (line.startsWith("# ")) return <p key={i} className="font-bold text-foreground text-xs">{line.slice(2)}</p>;
                  if (line.startsWith("## ")) return <p key={i} className="font-semibold text-foreground text-[11px]">{line.slice(3)}</p>;
                  if (line.startsWith("- ") || line.startsWith("* ")) return <p key={i} className="text-xs pl-2">• {line.slice(2)}</p>;
                  if (!line.trim()) return <div key={i} className="h-1" />;
                  return <p key={i} className="text-xs">{line}</p>;
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => onSave(name, design)} disabled={isSaving || !name.trim()} size="sm" className="flex-1">
            {isSaving ? t.ticketTemplates.speichernLaeuft : <><Check className="h-3.5 w-3.5 mr-1.5" />{t.common.speichern}</>}
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>{t.common.abbrechen}</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function TicketTemplatesClient({ initialTemplates }: { initialTemplates: TicketTemplate[] }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "hu" ? "hu-HU" : locale === "en" ? "en-GB" : "de-DE";
  const [templates, setTemplates] = useState<TicketTemplate[]>(initialTemplates);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  const editingTemplate = editingId && editingId !== "new"
    ? templates.find((t) => t.id === editingId)
    : null;

  async function handleSave(name: string, design: TicketDesign) {
    startTransition(async () => {
      if (editingId === "new") {
        const res = await fetch("/api/ticket-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, design }),
        });
        const neu = await res.json() as TicketTemplate;
        setTemplates((prev) => [neu, ...prev]);
      } else {
        const res = await fetch(`/api/ticket-templates/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, design }),
        });
        const updated = await res.json() as TicketTemplate;
        setTemplates((prev) => prev.map((t) => t.id === editingId ? updated : t));
      }
      setEditingId(null);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm(t.ticketTemplates.loeschenBestaetigung)) return;
    await fetch(`/api/ticket-templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.ticketTemplates.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.ticketTemplates.subtitle}
          </p>
        </div>
        {editingId !== "new" && (
          <Button onClick={() => setEditingId("new")} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> {t.ticketTemplates.neuesTemplate}
          </Button>
        )}
      </div>

      {/* New template designer */}
      {editingId === "new" && (
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-4">{t.ticketTemplates.neuesTemplateErstellen}</h2>
          <TemplateDesigner
            initial={{ name: "", design: { ...DEFAULT_TICKET_DESIGN } }}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
            isSaving={isPending}
          />
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 && editingId !== "new" && (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center space-y-3">
          <p className="text-muted-foreground text-sm">{t.ticketTemplates.keineTemplates}</p>
          <Button onClick={() => setEditingId("new")} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> {t.ticketTemplates.erstesTemplateErstellen}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Template header */}
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Color preview chips */}
              <div className="flex gap-1 shrink-0">
                <div className="w-5 h-8 rounded-l-md" style={{ backgroundColor: tpl.design.headerFarbe }} />
                <div className="w-5 h-8" style={{ backgroundColor: tpl.design.akzentFarbe }} />
                <div className="w-5 h-8 rounded-r-md border border-border" style={{ backgroundColor: tpl.design.hintergrundFarbe }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{tpl.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tpl.erstellt_am).toLocaleDateString(dateLocale)}
                  {tpl.design.kleingedrucktes && ` · ${t.ticketTemplates.kleingedrucktesVorhanden}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => setEditingId(editingId === tpl.id ? null : tpl.id)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(tpl.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Inline editor */}
            {editingId === tpl.id && (
              <div className="border-t border-border p-5">
                <TemplateDesigner
                  initial={{ name: tpl.name, design: tpl.design }}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                  isSaving={isPending}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
