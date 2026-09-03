import type { SupabaseClient } from "@supabase/supabase-js";
import { migrierteKonfiguration, elementSitzIds } from "@/types/sitzplan";

// Zählt die buchbaren Plätze (Sitze + Stehplatz-Kapazität) eines Events über
// alle zugewiesenen Saalpläne/Etagen. Gemeinsam genutzt von der Event-Seite
// und der Veröffentlichungs-API, damit Anzeige und Durchsetzung übereinstimmen.
export async function zaehleBuchbarePlaetze(
  supabase: SupabaseClient,
  sitzplanId: string | null,
  etagen: { sitzplan_id: string }[] | null,
): Promise<{ hatSaalplan: boolean; plaetze: number }> {
  const planIds = [
    ...(sitzplanId ? [sitzplanId] : []),
    ...(etagen?.map((e) => e.sitzplan_id).filter(Boolean) ?? []),
  ];
  if (planIds.length === 0) return { hatSaalplan: false, plaetze: 0 };

  const { data } = await supabase
    .from("sitzplaene")
    .select("konfiguration")
    .in("id", [...new Set(planIds)]);

  let plaetze = 0;
  for (const p of data ?? []) {
    const konf = migrierteKonfiguration(p.konfiguration);
    plaetze += konf.elemente.reduce((s, el) => s + elementSitzIds(el).length, 0);
  }
  return { hatSaalplan: true, plaetze };
}
