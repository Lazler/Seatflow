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

  return (
    <NeuesEventFormular
      venues={venues ?? []}
      vorausgewaehlteVenueId={vorausgewaehlteVenueId}
    />
  );
}
