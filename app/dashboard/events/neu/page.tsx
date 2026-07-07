import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NeuesEventFormular from "./event-formular";

export default async function NeuesEvent({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const { venue: vorausgewaehlteVenueId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/anmelden");

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name")
    .eq("veranstalter_id", user.id)
    .order("name");

  // Welche Venues haben schon einen Saalplan? (für den Hinweis im Formular)
  const venueIds = (venues ?? []).map((v) => v.id);
  const { data: plaene } = venueIds.length > 0
    ? await supabase.from("sitzplaene").select("venue_id").in("venue_id", venueIds)
    : { data: [] };
  const venuesMitPlan = new Set((plaene ?? []).map((p) => p.venue_id));
  const venuesAngereichert = (venues ?? []).map((v) => ({ ...v, hatPlan: venuesMitPlan.has(v.id) }));

  return (
    <NeuesEventFormular
      venues={venuesAngereichert}
      vorausgewaehlteVenueId={vorausgewaehlteVenueId}
    />
  );
}
