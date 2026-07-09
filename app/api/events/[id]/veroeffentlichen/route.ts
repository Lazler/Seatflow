import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { effectivePlan, PLAN_SEAT_LIMIT } from "@/lib/plan";
import { zaehleBuchbarePlaetze } from "@/lib/event-plaetze";
import { pruefeVeroeffentlichung } from "@/lib/event-bereitschaft";
import { dbFehlerMeldung } from "@/lib/db-fehler";
import { demoBlockiert } from "@/lib/demo";

// Veröffentlichen läuft server-seitig, damit Readiness UND die Free-Tarif-
// Grenze (max. Plätze) verbindlich durchgesetzt werden — nicht nur in der UI.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const demo = demoBlockiert(user.id); if (demo) return demo;

  const { data: event } = await supabase
    .from("events")
    .select("id, status, venue_id, sitzplan_id, etagen, bild_url, veranstalter_id")
    .eq("id", id)
    .eq("veranstalter_id", user.id)
    .single();

  if (!event) return NextResponse.json({ error: "Event nicht gefunden oder kein Zugriff." }, { status: 404 });

  const { data: profil } = await supabase
    .from("veranstalter_profile")
    .select("plan, abo_bis")
    .eq("id", user.id)
    .single();
  const plan = effectivePlan(profil?.plan ?? "free", profil?.abo_bis ?? null);

  const { hatSaalplan, plaetze } = await zaehleBuchbarePlaetze(
    supabase,
    event.sitzplan_id as string | null,
    (event.etagen as { sitzplan_id: string }[] | null) ?? null,
  );

  const { anforderungen, harteBlocker } = pruefeVeroeffentlichung({
    eventId: event.id,
    hatVenue: !!event.venue_id,
    hatSaalplan,
    buchbarePlaetze: plaetze,
    hatBild: !!event.bild_url,
    plan,
    sitzLimit: PLAN_SEAT_LIMIT[plan],
  });

  if (harteBlocker > 0) {
    const blocker = anforderungen.find((a) => a.pflicht && !a.erfuellt)!;
    return NextResponse.json(
      { error: blocker.hinweis ? `${blocker.label}: ${blocker.hinweis}` : blocker.label, code: "NICHT_BEREIT" },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "veroeffentlicht" })
    .eq("id", id);

  if (error) {
    console.error("[veroeffentlichen] Update fehlgeschlagen:", error);
    return NextResponse.json({ error: dbFehlerMeldung(error, "Veröffentlichen fehlgeschlagen.") }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
