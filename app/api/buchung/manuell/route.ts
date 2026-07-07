import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbFehlerMeldung } from "@/lib/db-fehler";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  let body: {
    eventId?: string;
    sitzplaetze?: { sitzId: string; bezeichnung?: string; preisCent: number }[];
    gaestName?: string;
    gaestEmail?: string;
    status?: "bezahlt" | "ausstehend";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
  const { eventId, sitzplaetze, gaestName, gaestEmail, status } = body;

  // ── Eingaben prüfen (präzise Meldungen statt „Fehlende Felder") ──────────────
  if (!eventId) return NextResponse.json({ error: "Bitte ein Event wählen." }, { status: 400 });
  if (!Array.isArray(sitzplaetze) || sitzplaetze.length === 0) {
    return NextResponse.json({ error: "Bitte mindestens einen Platz wählen." }, { status: 400 });
  }
  if (!gaestName?.trim()) return NextResponse.json({ error: "Bitte einen Namen angeben." }, { status: 400 });
  if (!gaestEmail?.trim() || !/.+@.+\..+/.test(gaestEmail.trim())) {
    return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
  }
  if (status !== "bezahlt" && status !== "ausstehend") {
    return NextResponse.json({ error: "Ungültiger Zahlungsstatus." }, { status: 400 });
  }

  // ── Eigentümerschaft prüfen (User-Client, RLS) ───────────────────────────────
  const { data: event, error: eventFehler } = await supabase
    .from("events")
    .select("id, service_gebuehr_cent, veranstalter_id")
    .eq("id", eventId)
    .single();

  if (eventFehler || !event || event.veranstalter_id !== user.id) {
    return NextResponse.json({ error: "Event nicht gefunden oder kein Zugriff." }, { status: 404 });
  }

  // ── Schreiben über den Admin-Client ──────────────────────────────────────────
  // buchungen/tickets haben (bewusst) keine INSERT-RLS-Policy — geschrieben wird
  // serverseitig nach Eigentümer-Prüfung, genau wie im regulären Checkout.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    console.error("[buchung/manuell] SUPABASE_SERVICE_ROLE_KEY fehlt im Deployment");
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY fehlt im Deployment — setze die Variable in deinem Hosting und deploye neu. Details unter /api/health." },
      { status: 503 },
    );
  }

  const serviceGebuehrCent: number = event.service_gebuehr_cent ?? 0;
  const gesamtCent =
    sitzplaetze.reduce((s, p) => s + (p.preisCent ?? 0), 0) + sitzplaetze.length * serviceGebuehrCent;

  const { data: buchung, error: buchungsFehler } = await admin
    .from("buchungen")
    .insert({
      event_id: eventId,
      gaest_name: gaestName.trim(),
      gaest_email: gaestEmail.trim(),
      gesamt_cent: gesamtCent,
      status,
      notiz: "Manuell angelegt",
    })
    .select("id")
    .single();

  if (buchungsFehler || !buchung) {
    console.error("[buchung/manuell] Buchung-Insert fehlgeschlagen:", buchungsFehler);
    return NextResponse.json(
      { error: dbFehlerMeldung(buchungsFehler, "Buchung konnte nicht angelegt werden.") },
      { status: 500 },
    );
  }

  const { error: ticketFehler } = await admin.from("tickets").insert(
    sitzplaetze.map((p) => ({
      buchung_id: buchung.id,
      event_id: eventId,
      sitzplatz_id: p.sitzId,
      sitzplatz_bezeichnung: p.bezeichnung ?? p.sitzId,
      preis_cent: p.preisCent,
    })),
  );

  if (ticketFehler) {
    // Buchung ohne Tickets wäre inkonsistent → zurückrollen
    await admin.from("buchungen").delete().eq("id", buchung.id);
    const konflikt = ticketFehler.code === "23505";
    console.error("[buchung/manuell] Ticket-Insert fehlgeschlagen:", ticketFehler);
    return NextResponse.json(
      {
        error: konflikt
          ? "Mindestens einer der Plätze ist bereits vergeben. Bitte Auswahl aktualisieren."
          : dbFehlerMeldung(ticketFehler, "Tickets konnten nicht gespeichert werden."),
      },
      { status: konflikt ? 409 : 500 },
    );
  }

  return NextResponse.json({ id: buchung.id });
}
