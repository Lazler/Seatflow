import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import BuchungsDetail from "./buchungs-detail-client";

export default async function BuchungDetailSeite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: buchung } = await supabase
    .from("buchungen")
    .select("id, gaest_name, gaest_email, gesamt_cent, status, erstellt_am, event_id, notiz, ticket_typ, stripe_payment_intent")
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

  const [ticketsRes, kommentareRes, ereignisseRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, sitzplatz_id, sitzplatz_bezeichnung, preis_cent")
      .eq("buchung_id", id),
    supabase
      .from("buchungs_kommentare")
      .select("id, text, erstellt_am")
      .eq("buchung_id", id)
      .order("erstellt_am", { ascending: true }),
    supabase
      .from("buchungs_ereignisse")
      .select("id, typ, details, erstellt_am")
      .eq("buchung_id", id)
      .order("erstellt_am", { ascending: true }),
  ]);

  return (
    <BuchungsDetail
      buchung={buchung}
      event={{ id: event.id, titel: event.titel, datum: event.datum, serviceGebuehrCent: event.service_gebuehr_cent ?? 50 }}
      tickets={ticketsRes.data ?? []}
      kommentare={kommentareRes.data ?? []}
      ereignisse={ereignisseRes.data ?? []}
    />
  );
}
