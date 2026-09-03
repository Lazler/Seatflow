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

  // Admin-Client bevorzugt (kennt scanner_pin ohne RLS); wenn er nicht
  // verfügbar ist (z. B. Service-Key fehlt), Fallback auf Owner-Zugriff.
  let event: { id: string; titel: string; veranstalter_id: string; scanner_pin: string | null } | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("events")
      .select("id, titel, veranstalter_id, scanner_pin")
      .eq("id", eventId)
      .single();
    event = data;
  } catch {
    const { data } = await supabase
      .from("events")
      .select("id, titel, veranstalter_id, scanner_pin")
      .eq("id", eventId)
      .single();
    event = data;
  }

  if (!event) notFound();

  const istBesitzer = !!user && event.veranstalter_id === user.id;

  // Kein Besitzer + keine PIN vergeben → kein Zugang möglich
  if (!istBesitzer && !event.scanner_pin) notFound();

  if (!istBesitzer) {
    // Einlasspersonal: PIN-Gate (Zählerstände kommen nach PIN-Prüfung,
    // damit nichts an Unbefugte leakt)
    return <ScannerZugang eventId={event.id} eventTitel={event.titel} />;
  }

  // Zählerstände: Admin bevorzugt, sonst Owner-RLS
  let gesamt = 0;
  let eingelassen = 0;
  try {
    const admin = createAdminClient();
    const [g, e] = await Promise.all([
      admin.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", eventId),
      admin.from("tickets").select("id", { count: "exact", head: true })
        .eq("event_id", eventId).not("eingeloest_am", "is", null),
    ]);
    gesamt = g.count ?? 0;
    eingelassen = e.count ?? 0;
  } catch {
    const [g, e] = await Promise.all([
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", eventId),
      supabase.from("tickets").select("id", { count: "exact", head: true })
        .eq("event_id", eventId).not("eingeloest_am", "is", null),
    ]);
    gesamt = g.count ?? 0;
    eingelassen = e.count ?? 0;
  }

  return (
    <ScannerClient
      eventId={event.id}
      eventTitel={event.titel}
      gesamt={gesamt}
      initialEingelassen={eingelassen}
    />
  );
}
