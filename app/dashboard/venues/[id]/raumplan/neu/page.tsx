import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LEERE_KONFIGURATION } from "@/types/sitzplan";
import { getServerDict } from "@/lib/i18n/server";

export default async function NeuerRaumplan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: venueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/anmelden");

  // Venue gehört dem Nutzer?
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("id", venueId)
    .eq("veranstalter_id", user.id)
    .single();

  if (!venue) notFound();

  // Neuen Raumplan anlegen
  const dict = await getServerDict();
  const { data: plan, error } = await supabase
    .from("sitzplaene")
    .insert({
      venue_id: venueId,
      name: dict.venueDetail.neuerSaalplan,
      konfiguration: LEERE_KONFIGURATION,
    })
    .select("id")
    .single();

  if (error || !plan) {
    redirect(`/dashboard/venues/${venueId}`);
  }

  redirect(`/dashboard/venues/${venueId}/raumplan/${plan.id}`);
}
