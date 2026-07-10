"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash as Trash2, CircleNotch as Loader2, Copy } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/components/i18n-provider";
import { fmt } from "@/lib/i18n/buchung";

type Plan = { id: string; name: string };

export default function SitzplanListe({ venueId, plaene }: { venueId: string; plaene: Plan[] }) {
  const router = useRouter();
  const dict = useT();
  const t = dict.sitzplanListe;
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loescht, setLoescht] = useState<string | null>(null);
  const [dupliziert, setDupliziert] = useState<string | null>(null);

  // Kopiert einen Plan samt Konfiguration und öffnet die Kopie im Editor
  async function duplizieren(plan: Plan) {
    setDupliziert(plan.id);
    const supabase = createClient();
    const { data: original, error: ladeFehler } = await supabase
      .from("sitzplaene")
      .select("konfiguration")
      .eq("id", plan.id)
      .single();
    if (ladeFehler || !original) {
      toast.error(t.planLadeFehler);
      setDupliziert(null);
      return;
    }
    const kopieName = fmt(t.kopieSuffix, { name: plan.name });
    const { data: kopie, error: insertFehler } = await supabase
      .from("sitzplaene")
      .insert({
        venue_id: venueId,
        name: kopieName,
        konfiguration: original.konfiguration,
      })
      .select("id")
      .single();
    setDupliziert(null);
    if (insertFehler || !kopie) { toast.error(t.duplizierenFehlgeschlagen); return; }
    toast.success(t.planDupliziert, fmt(t.planDupliziertText, { name: kopieName }));
    router.push(`/dashboard/venues/${venueId}/raumplan/${kopie.id}`);
  }

  async function loeschen(planId: string) {
    setLoescht(planId);
    const supabase = createClient();

    // Check if any events reference this sitzplan
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("sitzplan_id", planId);

    if ((count ?? 0) > 0) {
      const n = count ?? 0;
      toast.error(t.loeschenNichtMoeglich, fmt(n === 1 ? t.planZugewiesen : t.planZugewiesen_pl, { n }));
      setLoescht(null);
      setConfirming(null);
      return;
    }

    const { error } = await supabase.from("sitzplaene").delete().eq("id", planId);
    setLoescht(null);
    setConfirming(null);
    if (error) { toast.error(t.loeschenFehlgeschlagen, error.message); return; }
    toast.success(t.planGeloescht);
    router.refresh();
  }

  if (plaene.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-3">{t.keinSaalplan}</p>
        <Button size="sm" asChild>
          <Link href={`/dashboard/venues/${venueId}/raumplan/neu`}>{t.erstenSaalplanErstellen}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {plaene.map((plan) => (
        <div key={plan.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span className="text-sm font-medium truncate flex-1 min-w-0 mr-2">{plan.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/dashboard/venues/${venueId}/raumplan/${plan.id}`}>{dict.common.bearbeiten}</Link>
            </Button>
            <Button size="icon" variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
              title={t.planDuplizieren} aria-label={fmt(dict.eventDuplizieren.ariaLabel, { titel: plan.name })}
              onClick={() => duplizieren(plan)} disabled={dupliziert === plan.id}>
              {dupliziert === plan.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Copy className="h-3.5 w-3.5" />}
            </Button>
            {confirming === plan.id ? (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs"
                  onClick={() => loeschen(plan.id)} disabled={loescht === plan.id}>
                  {loescht === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : dict.common.loeschen}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                  onClick={() => setConfirming(null)}>
                  {dict.common.abbrechen}
                </Button>
              </div>
            ) : (
              <Button size="icon" variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                onClick={() => setConfirming(plan.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
