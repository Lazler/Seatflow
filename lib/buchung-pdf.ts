import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { TicketPDF } from "@/lib/ticket-pdf";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";
import type { TicketDesign } from "@/types/ticket-design";
import { sitzAnzeige } from "@/types/sitzplan";

// Erzeugt das Ticket-PDF einer Buchung (alle Tickets). Wird vom
// Veranstalter-Endpoint UND vom Gast-Self-Service genutzt.
// Rückgabe null = Buchung/Tickets nicht gefunden.
export async function generiereBuchungsPdf(
  buchungId: string,
  opts: { nurBezahlte?: boolean } = {},
): Promise<{ pdf: Buffer; dateiname: string } | null> {
  const admin = createAdminClient();

  const { data: buchung } = await admin
    .from("buchungen")
    .select("id, gaest_name, event_id, ticket_typ, status")
    .eq("id", buchungId)
    .single();
  if (!buchung) return null;
  if (opts.nurBezahlte && buchung.status !== "bezahlt") return null;

  const { data: event } = await admin
    .from("events")
    .select("id, titel, datum, ticket_design, ticket_template_id, venues(name)")
    .eq("id", buchung.event_id)
    .single();
  if (!event) return null;

  let design: TicketDesign = (event.ticket_design as TicketDesign | null) ?? DEFAULT_TICKET_DESIGN;
  if (event.ticket_template_id) {
    const { data: tmpl } = await admin
      .from("ticket_templates")
      .select("design")
      .eq("id", event.ticket_template_id)
      .single();
    if (tmpl?.design) design = tmpl.design as TicketDesign;
  }

  const { data: tickets } = await admin
    .from("tickets")
    .select("sitzplatz_id, sitzplatz_bezeichnung, preis_cent, qr_code")
    .eq("buchung_id", buchungId);
  if (!tickets?.length) return null;

  const venue = event.venues && !Array.isArray(event.venues)
    ? (event.venues as unknown as { name: string }).name
    : undefined;
  const ticketTyp = buchung.ticket_typ as { name: string } | null;

  const ticketDataList = await Promise.all(
    tickets.map(async (t) => ({
      eventTitel: event.titel,
      eventDatum: new Date(event.datum),
      venue,
      sitzplaetze: [{ sitzId: sitzAnzeige(t.sitzplatz_id), bezeichnung: t.sitzplatz_bezeichnung, preisCent: t.preis_cent }],
      buchungId,
      gaestName: buchung.gaest_name,
      ticketTypName: ticketTyp?.name,
      qrCodeDataUrl: await QRCode.toDataURL(t.qr_code, { width: 200, margin: 1, errorCorrectionLevel: "M" }),
      design,
    }))
  );

  const pdf = await renderToBuffer(
    React.createElement(TicketPDF, { tickets: ticketDataList }) as never
  );

  const slug = event.titel.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  return { pdf: Buffer.from(pdf), dateiname: `tickets-${slug}.pdf` };
}
