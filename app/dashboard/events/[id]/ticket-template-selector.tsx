"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, ExternalLink, Check } from "lucide-react";
import Link from "next/link";
import type { TicketDesign } from "@/types/ticket-design";

type Template = { id: string; name: string; design: TicketDesign };

export default function TicketTemplateSelector({
  eventId,
  templates,
  initialTemplateId,
}: {
  eventId: string;
  templates: Template[];
  initialTemplateId: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialTemplateId);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  function handleSelect(id: string | null) {
    setSelectedId(id);
    setSaved(false);
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("events").update({ ticket_template_id: id }).eq("id", eventId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Ticket-Template
          {saved && <span className="ml-auto text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" />Gespeichert</span>}
          {isPending && <span className="ml-auto text-xs text-muted-foreground">Speichern…</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-muted-foreground">Noch kein Template erstellt.</p>
            <Link href="/dashboard/ticket-templates"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> Templates verwalten
            </Link>
          </div>
        ) : (
          <>
            {/* None option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                selectedId === null
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <div className="flex gap-0.5">
                <div className="w-3 h-6 rounded-l-sm bg-slate-800" />
                <div className="w-3 h-6 rounded-r-sm bg-indigo-500" />
              </div>
              <span className="text-sm font-medium">Standard (SeatFlow)</span>
              {selectedId === null && <Check className="h-4 w-4 text-primary ml-auto" />}
            </button>

            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  selectedId === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="flex gap-0.5">
                  <div className="w-3 h-6 rounded-l-sm" style={{ backgroundColor: t.design.headerFarbe }} />
                  <div className="w-3 h-6 rounded-r-sm" style={{ backgroundColor: t.design.akzentFarbe }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.name}</p>
                  {t.design.kleingedrucktes && (
                    <p className="text-[10px] text-muted-foreground">inkl. Kleingedrucktes</p>
                  )}
                </div>
                {selectedId === t.id && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))}

            <Link href="/dashboard/ticket-templates"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
              <ExternalLink className="h-3 w-3" /> Templates bearbeiten
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
