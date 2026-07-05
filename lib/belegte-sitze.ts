import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Wie lange ein unbezahlter Checkout einen Sitz blockiert.
// Muss über der Stripe-Session-Lebensdauer (30 Min) liegen.
export const HOLD_MINUTEN = 35;

type TicketMitBuchung = {
  sitzplatz_id: string;
  buchungen: { status: string; created_at: string | null } | null;
};

/**
 * Liefert alle aktuell blockierten Sitzplatz-IDs eines Events:
 * bezahlte Tickets + frische unbezahlte Checkouts (Hold).
 * Abgelaufene unbezahlte Checkouts geben den Sitz wieder frei.
 */
export async function belegteSitzIdsLaden(eventId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tickets")
    .select("sitzplatz_id, buchungen!inner(status, created_at)")
    .eq("event_id", eventId);

  const cutoff = Date.now() - HOLD_MINUTEN * 60_000;
  return ((data ?? []) as unknown as TicketMitBuchung[])
    .filter((t) => {
      const b = t.buchungen;
      if (!b) return true; // defensiv: ohne Buchungsinfo blockieren
      if (b.status === "bezahlt") return true;
      if (b.status === "ausstehend") {
        const created = b.created_at ? new Date(b.created_at).getTime() : 0;
        return created >= cutoff; // frischer Hold blockiert, abgelaufener nicht
      }
      return false; // storniert / abgelaufen / erstattet
    })
    .map((t) => t.sitzplatz_id);
}
