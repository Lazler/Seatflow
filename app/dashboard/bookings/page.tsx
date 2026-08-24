import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BuchungenListe from "./buchungen-liste";

export default async function BuchungenSeite() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("id, titel")
    .eq("veranstalter_id", user.id);

  const eventIds = (events ?? []).map((e) => e.id);

  const { data: buchungen } = eventIds.length > 0
    ? await supabase
        .from("buchungen")
        .select("id, gaest_name, gaest_email, gesamt_cent, status, erstellt_am, event_id, notiz")
        .in("event_id", eventIds)
        .order("erstellt_am", { ascending: false })
    : { data: [] };

  return <BuchungenListe buchungen={buchungen ?? []} events={events ?? []} />;
}
