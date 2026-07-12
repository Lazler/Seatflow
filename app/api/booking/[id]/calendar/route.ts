import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsDatum(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Kalender-Datei (.ics) zur Buchung — "Zum Kalender hinzufügen".
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Ungültige Buchung" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: buchung } = await admin
    .from("buchungen")
    .select("id, status, event_id")
    .eq("id", id)
    .single();
  if (!buchung || buchung.status !== "bezahlt") {
    return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });
  }

  const { data: event } = await admin
    .from("events")
    .select("titel, datum, einlass_datum, venues(name, adresse)")
    .eq("id", buchung.event_id)
    .single();
  if (!event) return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });

  const venue = event.venues && !Array.isArray(event.venues)
    ? (event.venues as unknown as { name: string; adresse: string | null })
    : null;
  const start = new Date(event.datum);
  const ende = new Date(start.getTime() + 3 * 60 * 60 * 1000); // Default: 3 h
  const ort = venue ? [venue.name, venue.adresse].filter(Boolean).join(", ") : "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SeatFlow//Tickets//DE",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${buchung.id}@seatflow.app`,
    `DTSTAMP:${icsDatum(new Date(event.datum))}`,
    `DTSTART:${icsDatum(start)}`,
    `DTEND:${icsDatum(ende)}`,
    `SUMMARY:${icsEscape(event.titel)}`,
    ort ? `LOCATION:${icsEscape(ort)}` : null,
    `DESCRIPTION:${icsEscape(`Tickets: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://seatflow.app"}/buchung/${buchung.id}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
