import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { TicketPDF } from "@/lib/ticket-pdf";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";
import type { TicketDesign } from "@/types/ticket-design";
import React from "react";

export async function GET(req: NextRequest) {
  const buchungId = req.nextUrl.searchParams.get("buchungId");
  if (!buchungId) return NextResponse.json({ error: "buchungId fehlt" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  // Load buchung
  const { data: buchung } = await supabase
    .from("buchungen")
    .select("id, gaest_name, event_id, ticket_typ")
    .eq("id", buchungId)
    .single();

  if (!buchung) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from("events")
    .select("id, titel, datum, ticket_design, veranstalter_id, venues(name)")
    .eq("id", buchung.event_id)
    .single();

  if (!event || event.veranstalter_id !== user.id) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  // Load tickets
  const { data: tickets } = await supabase
    .from("tickets")
    .select("sitzplatz_id, sitzplatz_bezeichnung, preis_cent, qr_code")
    .eq("buchung_id", buchungId);

  if (!tickets?.length) return NextResponse.json({ error: "Keine Tickets" }, { status: 404 });

  const design: TicketDesign = (event.ticket_design as TicketDesign | null) ?? DEFAULT_TICKET_DESIGN;
  const venue = event.venues && !Array.isArray(event.venues)
    ? (event.venues as unknown as { name: string }).name
    : undefined;
  const ticketTyp = buchung.ticket_typ as { name: string } | null;

  // Generate one QR code per ticket (using qr_code unique identifier)
  const ticketDataList = await Promise.all(
    tickets.map(async (t) => ({
      eventTitel: event.titel,
      eventDatum: new Date(event.datum),
      venue,
      sitzplaetze: [{ sitzId: t.sitzplatz_id, bezeichnung: t.sitzplatz_bezeichnung, preisCent: t.preis_cent }],
      buchungId: buchungId,
      gaestName: buchung.gaest_name,
      ticketTypName: ticketTyp?.name,
      qrCodeDataUrl: await QRCode.toDataURL(t.qr_code, { width: 200, margin: 1, errorCorrectionLevel: "M" }),
      design,
    }))
  );

  const pdfBuffer = await renderToBuffer(
    React.createElement(TicketPDF, { tickets: ticketDataList }) as Parameters<typeof renderToBuffer>[0]
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tickets-${buchungId.slice(0, 8)}.pdf"`,
    },
  });
}
