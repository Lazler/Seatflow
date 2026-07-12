import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SitzplanEditor from "@/components/raumplan/sitzplan-editor";
import type { SitzplanKonfiguration } from "@/types/sitzplan";
import { verkaufteSitzIdsFuerPlan } from "@/lib/verkaufte-sitze";

export default async function RaumplanEditor({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id: venueId, planId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plan } = await supabase
    .from("sitzplaene")
    .select("id, name, konfiguration, venues(id, name, veranstalter_id)")
    .eq("id", planId)
    .single();

  if (!plan) notFound();

  const venue = plan.venues as unknown as {
    id: string;
    name: string;
    veranstalter_id: string;
  } | null;

  if (!venue || venue.veranstalter_id !== user!.id) notFound();

  // Verkaufte Plätze schützen den Plan vor destruktiven Änderungen
  const verkaufteSitzIds = await verkaufteSitzIdsFuerPlan(planId);

  return (
    <SitzplanEditor
      planId={plan.id}
      planName={plan.name}
      venueId={venueId}
      venueName={venue.name}
      initialKonfiguration={plan.konfiguration as SitzplanKonfiguration}
      verkaufteSitzIds={verkaufteSitzIds}
    />
  );
}
