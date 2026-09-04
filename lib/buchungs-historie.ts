import { createAdminClient } from "@/lib/supabase/admin";

// Order-Timeline pro Buchung — Server-seitige Prozessschritte (Zahlung,
// Ticket-Versand, Erstattung). Bewusst über den Admin-Client statt einer
// eigenen RLS-Policy fürs Schreiben: alle Aufrufer sind bereits geprüfte
// Server-Routen. Protokollierung darf den eigentlichen Ablauf nie zum
// Scheitern bringen — Fehler landen nur im Server-Log.
export type BuchungsEreignisTyp =
  | "erstellt"
  | "bezahlt"
  | "ticket_gesendet"
  | "ticket_sende_fehler"
  | "erstattet"
  | "bearbeitet";

// system = automatisiert (Stripe-Webhook, initiale Ticket-Mail nach Zahlung).
// veranstalter/gast = durch eine Person ausgelöst — akteurName ist z.B. die
// E-Mail des Veranstalters oder der Gastname, für die Anzeige im Verlauf.
export type Akteur = { typ: "veranstalter" | "gast"; name?: string | null };

export async function protokolliereEreignis(
  buchungId: string,
  typ: BuchungsEreignisTyp,
  details?: string | null,
  akteur?: Akteur,
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("buchungs_ereignisse")
      .insert({
        buchung_id: buchungId,
        typ,
        details: details ?? null,
        akteur_typ: akteur?.typ ?? "system",
        akteur_name: akteur?.name ?? null,
      });
    if (error) console.error("[buchungs-historie] Insert fehlgeschlagen:", error.message);
  } catch (err) {
    console.error("[buchungs-historie] Protokollierung fehlgeschlagen:", err);
  }
}

// Grobe, für Gäste/Veranstalter unbedenkliche Fehlerbeschreibung — die rohe
// SMTP-/Provider-Fehlermeldung landet nur im Server-Log, nie in der UI.
export function grobeVersandFehlerbeschreibung(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : "";
  if (msg.includes("invalid") && msg.includes("recipient")) return "E-Mail-Adresse wurde vom Mailserver abgelehnt.";
  if (msg.includes("auth")) return "Anmeldung beim Mailserver fehlgeschlagen.";
  if (msg.includes("timeout") || msg.includes("econnrefused") || msg.includes("enotfound")) return "Mailserver war nicht erreichbar.";
  return "Der Versand ist beim Mailserver fehlgeschlagen.";
}
