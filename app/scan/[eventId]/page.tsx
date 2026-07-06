import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import ScannerClient from "./scanner-client";
import ScannerZugang from "./scanner-zugang";

export default async function ScannerSeite({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, titel, veranstalter_id, scanner_pin")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const istBesitzer = !!user && event.veranstalter_id === user.id;

  // Kein Besitzer + keine PIN vergeben → kein Zugang möglich
  if (!istBesitzer && !event.scanner_pin) notFound();

  if (!istBesitzer) {
    // Einlasspersonal: PIN-Gate (Zählerstände kommen nach PIN-Prüfung,
    // damit nichts an Unbefugte leakt)
    return <ScannerZugang eventId={event.id} eventTitel={event.titel} />;
  }

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
