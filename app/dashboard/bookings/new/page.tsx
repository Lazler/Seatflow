import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuchungNeuClient from "./buchung-neu-client";

export default async function BuchungNeuSeite() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("id, titel, datum, sitzplan_id, service_gebuehr_cent")
    .eq("veranstalter_id", user.id)
    .in("status", ["veroeffentlicht", "entwurf"])
    .order("datum", { ascending: true });

  return <BuchungNeuClient events={events ?? []} />;
}
