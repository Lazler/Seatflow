import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import ScannerClient from "./scanner-client";

export default async function ScannerSeite({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data: event } = await supabase
    .from("events")
    .select("id, titel, veranstalter_id")
    .eq("id", eventId)
    .eq("veranstalter_id", user.id)
    .single();

  if (!event) notFound();

  const admin = createAdminClient();
  const [{ count: gesamt }, { count: eingelassen }] = await Promise.all([
    admin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
    admin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .not("eingeloest_am", "is", null),
  ]);

  return (
    <ScannerClient
      eventId={event.id}
      eventTitel={event.titel}
      gesamt={gesamt ?? 0}
      initialEingelassen={eingelassen ?? 0}
    />
  );
}
