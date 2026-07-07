import "server-only";

// Übersetzt Postgres-/Supabase-Fehler in verständliche Meldungen für den
// Admin-Bereich. Der Rohfehler gehört ins Server-Log (console.error), die
// Rückgabe hier ist die dem Nutzer angezeigte Klartext-Meldung.
type DbFehler = { code?: string | null; message?: string | null; details?: string | null } | null;

export function dbFehlerMeldung(error: DbFehler, fallback = "Aktion fehlgeschlagen."): string {
  if (!error) return fallback;

  switch (error.code) {
    case "23505": // unique_violation
      return "Ein Eintrag mit diesen Werten existiert bereits.";
    case "23503": // foreign_key_violation
      return "Ein verknüpfter Datensatz fehlt oder wurde gelöscht.";
    case "23502": // not_null_violation
      return "Ein Pflichtfeld fehlt.";
    case "23514": // check_violation
      return "Ein Wert ist ungültig (z. B. ein unerlaubter Status).";
    case "42501": // insufficient_privilege
      return "Keine Berechtigung für diese Aktion.";
    case "42P01": // undefined_table
      return "Eine Datenbank-Tabelle fehlt — bitte ausstehende Migration ausführen.";
    case "42703": // undefined_column
      return "Eine Datenbank-Spalte fehlt — bitte ausstehende Migration ausführen.";
    case "PGRST301": // JWT/permission
    case "PGRST204": // kein Treffer bei .single()
      return "Keine Berechtigung oder Datensatz nicht gefunden.";
  }

  // RLS-Verstöße kommen teils ohne Code, nur als Meldungstext
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("row-level security") || msg.includes("permission denied")) {
    return "Keine Berechtigung für diese Aktion.";
  }

  return fallback;
}
