import { createClient } from "@/lib/supabase/server";
import TicketTemplatesClient from "./ticket-templates-client";
import type { TicketDesign } from "@/types/ticket-design";

export type TicketTemplate = {
  id: string;
  name: string;
  design: TicketDesign;
  erstellt_am: string;
};

export default async function TicketTemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("ticket_templates")
    .select("id, name, design, erstellt_am")
    .eq("veranstalter_id", user!.id)
    .order("erstellt_am", { ascending: false });

  return <TicketTemplatesClient initialTemplates={(templates as TicketTemplate[]) ?? []} />;
}
