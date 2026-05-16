import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import BuchungsDetail from "./buchungs-detail-client";
import { migrierteKonfiguration } from "@/types/sitzplan";

export default async function BuchungDetailSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data: buchung } = await supabase
    .from("buchungen")
    .select("id, gaest_name, gaest_email, gesamt_cent, status, erstellt_am, event_id, notiz")
    .eq("id", id)
    .single();

  if (!buchung) notFound();

  // Verify ownership via event
  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum, service_gebuehr_cent, sitzplan_id, veranstalter_id")
    .eq("id", buchung.event_id)
    .single();

  if (!event || event.veranstalter_id !== user.id) notFound();

  const [ticketsRes, kommentareRes, sitzplanRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, sitz_id, kategorie_id, preis_cent")
      .eq("buchung_id", id),
    supabase
      .from("buchungs_kommentare")
      .select("id, text, erstellt_am")
      .eq("buchung_id", id)
      .order("erstellt_am", { ascending: true }),
    event.sitzplan_id
      ? supabase.from("sitzplaene").select("konfiguration").eq("id", event.sitzplan_id).single()
      : { data: null },
  ]);

  const kategorienMap: Record<string, { name: string; farbe: string }> = {};
  if (sitzplanRes.data) {
    const konfig = migrierteKonfiguration(sitzplanRes.data.konfiguration);
    for (const k of konfig.kategorien) {
      kategorienMap[k.id] = { name: k.name, farbe: k.farbe };
    }
  }

  return (
    <BuchungsDetail
      buchung={buchung}
      event={{ id: event.id, titel: event.titel, datum: event.datum, serviceGebuehrCent: event.service_gebuehr_cent ?? 50 }}
      tickets={ticketsRes.data ?? []}
      kommentare={kommentareRes.data ?? []}
      kategorienMap={kategorienMap}
    />
  );
}
