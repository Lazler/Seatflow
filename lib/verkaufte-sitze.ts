import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sitzAnzeige, sitzGehoertZuFloor } from "@/types/sitzplan";

type EtageRef = { id: string; sitzplan_id: string };

/**
 * Alle verkauften (bezahlten) Sitz-IDs, die auf einem Sitzplan liegen —
 * über alle Events hinweg, die den Plan direkt oder als Etage nutzen.
 * IDs kommen plan-lokal zurück (Floor-Präfix entfernt) und schützen im
 * Editor Elemente vor destruktiven Änderungen.
 */
export async function verkaufteSitzIdsFuerPlan(planId: string): Promise<string[]> {
  // Editor darf nie am Plan-Schutz sterben — Fehler ⇒ kein Schutz, aber Seite lädt
  try {
    return await ladeVerkaufteSitzIds(planId);
  } catch (e) {
    console.error("verkaufteSitzIdsFuerPlan fehlgeschlagen:", e);
    return [];
  }
}

async function ladeVerkaufteSitzIds(planId: string): Promise<string[]> {
  const admin = createAdminClient();

  // Events, die den Plan direkt oder in etagen[] referenzieren
  const [direkt, mitEtagen] = await Promise.all([
    admin.from("events").select("id").eq("sitzplan_id", planId),
    admin.from("events").select("id, etagen").not("etagen", "is", null),
  ]);

  const eventIds = new Set<string>((direkt.data ?? []).map((e) => e.id));
  // Etagen-IDs, deren sitzplan_id auf diesen Plan zeigt (für Präfix-Match)
  const passendeEtagenIds = new Set<string>();
  for (const ev of mitEtagen.data ?? []) {
    const etagen = (ev.etagen as EtageRef[] | null) ?? [];
    for (const et of etagen) {
      if (et.sitzplan_id === planId) {
        eventIds.add(ev.id);
        passendeEtagenIds.add(et.id);
      }
    }
  }
  if (eventIds.size === 0) return [];

  const { data: tickets } = await admin
    .from("tickets")
    .select("sitzplatz_id, event_id, buchungen!inner(status)")
    .in("event_id", [...eventIds]);

  const ids = new Set<string>();
  for (const t of (tickets ?? []) as unknown as {
    sitzplatz_id: string; event_id: string;
    buchungen: { status: string } | null;
  }[]) {
    if (t.buchungen?.status !== "bezahlt") continue;
    const roh = t.sitzplatz_id;
    if (!roh.includes(":")) {
      // Unpräfixiert: direktes Event ODER Legacy — zählt für diesen Plan
      ids.add(roh);
    } else if ([...passendeEtagenIds].some((eid) => sitzGehoertZuFloor(roh, eid))) {
      ids.add(sitzAnzeige(roh));
    }
  }
  return [...ids];
}
