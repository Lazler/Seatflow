"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle, Copy } from "lucide-react";

type Plan = { id: string; name: string };

export default function SitzplanListe({ venueId, plaene }: { venueId: string; plaene: Plan[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loescht, setLoescht] = useState<string | null>(null);
  const [dupliziert, setDupliziert] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  // Kopiert einen Plan samt Konfiguration und öffnet die Kopie im Editor
  async function duplizieren(plan: Plan) {
    setDupliziert(plan.id);
    setFehler(null);
    const supabase = createClient();
    const { data: original, error: ladeFehler } = await supabase
      .from("sitzplaene")
      .select("konfiguration")
      .eq("id", plan.id)
      .single();
    if (ladeFehler || !original) {
      setFehler("Plan konnte nicht geladen werden.");
      setDupliziert(null);
      return;
    }
    const { data: kopie, error: insertFehler } = await supabase
      .from("sitzplaene")
      .insert({
        venue_id: venueId,
        name: `${plan.name} (Kopie)`,
        konfiguration: original.konfiguration,
      })
      .select("id")
      .single();
    setDupliziert(null);
    if (insertFehler || !kopie) { setFehler("Duplizieren fehlgeschlagen."); return; }
    router.push(`/dashboard/venues/${venueId}/raumplan/${kopie.id}`);
  }

  async function loeschen(planId: string) {
    setLoescht(planId);
    setFehler(null);
    const supabase = createClient();

    // Check if any events reference this sitzplan
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("sitzplan_id", planId);

    if ((count ?? 0) > 0) {
      setFehler(`Dieser Plan ist ${count} Event${count === 1 ? "" : "s"} zugewiesen und kann nicht gelöscht werden.`);
      setLoescht(null);
      setConfirming(null);
      return;
    }

    const { error } = await supabase.from("sitzplaene").delete().eq("id", planId);
    setLoescht(null);
    setConfirming(null);
    if (error) { setFehler("Löschen fehlgeschlagen."); return; }
    router.refresh();
  }

  if (plaene.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground mb-3">Noch kein Raumplan angelegt.</p>
        <Button size="sm" asChild>
          <Link href={`/dashboard/venues/${venueId}/raumplan/neu`}>Ersten Raumplan erstellen</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {fehler && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive mb-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {fehler}
        </div>
      )}
      {plaene.map((plan) => (
        <div key={plan.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span className="text-sm font-medium truncate flex-1 min-w-0 mr-2">{plan.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/dashboard/venues/${venueId}/raumplan/${plan.id}`}>Bearbeiten</Link>
            </Button>
            <Button size="icon" variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
              title="Plan duplizieren" aria-label={`${plan.name} duplizieren`}
              onClick={() => duplizieren(plan)} disabled={dupliziert === plan.id}>
              {dupliziert === plan.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Copy className="h-3.5 w-3.5" />}
            </Button>
            {confirming === plan.id ? (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs"
                  onClick={() => loeschen(plan.id)} disabled={loescht === plan.id}>
                  {loescht === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Löschen"}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                  onClick={() => { setConfirming(null); setFehler(null); }}>
                  Abbrechen
                </Button>
              </div>
            ) : (
              <Button size="icon" variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                onClick={() => { setConfirming(plan.id); setFehler(null); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
