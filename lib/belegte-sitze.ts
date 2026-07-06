import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Wie lange ein unbezahlter Checkout einen Sitz blockiert.
// Muss über der Stripe-Session-Lebensdauer (30 Min) liegen.
export const HOLD_MINUTEN = 35;

type TicketMitBuchung = {
  sitzplatz_id: string;
  buchungen: { status: string; erstellt_am: string | null } | null;
};

/**
 * Liefert alle aktuell blockierten Sitzplatz-IDs eines Events:
 * bezahlte Tickets + frische unbezahlte Checkouts (Hold).
 * Abgelaufene unbezahlte Checkouts geben den Sitz wieder frei.
 */
export async function belegteSitzIdsLaden(eventId: string): Promise<string[]> {
  // Darf die Buchungsseite NIE crashen (z. B. fehlender Service-Role-Key):
  // im Fehlerfall lieber keine Belegung anzeigen als eine tote Seite.
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("tickets")
      .select("sitzplatz_id, buchungen!inner(status, erstellt_am)")
      .eq("event_id", eventId);
    if (error) {
      console.error("belegteSitzIdsLaden:", error.message);
      // Fallback ohne Join: alle Tickets blockieren (konservativ)
      const { data: roh } = await admin
        .from("tickets")
        .select("sitzplatz_id")
        .eq("event_id", eventId);
      return (roh ?? []).map((t) => t.sitzplatz_id);
    }

    const cutoff = Date.now() - HOLD_MINUTEN * 60_000;
    return ((data ?? []) as unknown as TicketMitBuchung[])
      .filter((t) => {
        const b = t.buchungen;
        if (!b) return true; // defensiv: ohne Buchungsinfo blockieren
        if (b.status === "bezahlt") return true;
        if (b.status === "ausstehend") {
          const erstellt = b.erstellt_am ? new Date(b.erstellt_am).getTime() : 0;
          return erstellt >= cutoff; // frischer Hold blockiert, abgelaufener nicht
        }
        return false; // storniert / abgelaufen / erstattet
      })
      .map((t) => t.sitzplatz_id);
  } catch (e) {
    console.error("belegteSitzIdsLaden fehlgeschlagen:", e);
    return [];
  }
}
