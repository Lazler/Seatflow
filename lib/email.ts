import { Resend } from "resend";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { TicketPDF } from "@/lib/ticket-pdf";
import { DEFAULT_TICKET_DESIGN } from "@/types/ticket-design";
import type { TicketDesign } from "@/types/ticket-design";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

type TicketMailParams = {
  to: string;
  guestName: string;
  eventTitel: string;
  eventDatum: Date;
  venue?: string;
  buchungId: string;
  sitze: { sitzId: string; kategorieName: string; preisCent: number; qrCode?: string }[];
  gesamtCent: number;
  ticketTypName?: string;
  design?: TicketDesign | null;
  sprache?: "de" | "en" | "hu";
  poweredBySeatflow?: boolean;
};

export async function sendTicketMail(params: TicketMailParams) {
  const { to, guestName, eventTitel, eventDatum, venue, buchungId, sitze, gesamtCent, ticketTypName, design } = params;

  const lang = params.sprache ?? "de";
  const emailStrings = {
    de: {
      hallo: (name: string) => `Hallo ${name},`,
      bestaetigt: "deine Buchung ist bestätigt! Die Tickets findest du im Anhang als PDF.",
      sitz: "Sitz",
      kategorie: "Kategorie",
      preis: "Preis",
      gesamt: "Gesamt",
      qrHinweis: "QR-Code für den Einlass (auch im PDF-Anhang):",
      onlineAnsehen: "Tickets online ansehen",
      onlineHinweis: "Jederzeit abrufbar — erneut herunterladen, zusenden oder in den Kalender übernehmen.",
      fragen: "Bei Fragen wende dich an den Veranstalter.",
    },
    en: {
      hallo: (name: string) => `Hello ${name},`,
      bestaetigt: "Your booking is confirmed! You'll find your tickets attached as a PDF.",
      sitz: "Seat",
      kategorie: "Category",
      preis: "Price",
      gesamt: "Total",
      qrHinweis: "QR code for entry (also in the PDF attachment):",
      onlineAnsehen: "View tickets online",
      onlineHinweis: "Available any time — re-download, resend or add to your calendar.",
      fragen: "If you have any questions, please contact the organiser.",
    },
    hu: {
      hallo: (name: string) => `Kedves ${name},`,
      bestaetigt: "A foglalásod megerősítve! A jegyeket PDF-mellékletként találod.",
      sitz: "Ülőhely",
      kategorie: "Kategória",
      preis: "Ár",
      gesamt: "Összesen",
      qrHinweis: "QR-kód a belépéshez (a PDF-mellékletben is megtalálható):",
      onlineAnsehen: "Jegyek megtekintése online",
      onlineHinweis: "Bármikor elérhető — újraletöltés, újraküldés vagy naptárba mentés.",
      fragen: "Kérdés esetén forduljon a szervezőhöz.",
    },
  }[lang];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://seatflow.app";

  // Generate QR for the inline email image (using buchungId)
  const qrDataUrl = await QRCode.toDataURL(buchungId, { width: 200, margin: 1 });
  const qrBase64 = qrDataUrl.replace("data:image/png;base64,", "");

  const datumLocale = lang === "de" ? "de-DE" : lang === "hu" ? "hu-HU" : "en-GB";
  const datumFormatiert = eventDatum.toLocaleDateString(datumLocale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const sitzZeilen = sitze
    .map((s) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">${s.sitzId}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">${s.kategorieName}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right">${(s.preisCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td></tr>`)
    .join("");

  const activeDesign = design ?? DEFAULT_TICKET_DESIGN;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:${activeDesign.headerFarbe};padding:24px 32px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="color:#f8fafc;font-weight:700;font-size:18px">${eventTitel}</span>
        ${ticketTypName ? `<span style="background:${activeDesign.akzentFarbe};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px">${ticketTypName}</span>` : ""}
      </div>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#64748b;font-size:14px">${emailStrings.hallo(guestName)}</p>
      <p style="margin:0 0 24px;font-size:15px">${emailStrings.bestaetigt}</p>

      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-weight:700;font-size:16px">${eventTitel}</p>
        <p style="margin:0 0 2px;color:#64748b;font-size:14px">${datumFormatiert}</p>
        ${venue ? `<p style="margin:0;color:#64748b;font-size:14px">${venue}</p>` : ""}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
        <thead><tr style="background:#f8fafc"><th style="padding:6px 8px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0">${emailStrings.sitz}</th><th style="padding:6px 8px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0">${emailStrings.kategorie}</th><th style="padding:6px 8px;text-align:right;font-weight:600;border-bottom:2px solid #e2e8f0">${emailStrings.preis}</th></tr></thead>
        <tbody>${sitzZeilen}</tbody>
        <tfoot><tr><td colspan="2" style="padding:8px;font-weight:700;text-align:right">${emailStrings.gesamt}</td><td style="padding:8px;font-weight:700;text-align:right">${(gesamtCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td></tr></tfoot>
      </table>

      <div style="text-align:center;margin-bottom:24px">
        <p style="font-size:13px;color:#64748b;margin-bottom:12px">${emailStrings.qrHinweis}</p>
        <img src="cid:qrcode" alt="QR-Code Ticket" style="width:160px;height:160px;border:1px solid #e2e8f0;border-radius:8px" />
        <p style="font-size:11px;color:#94a3b8;margin-top:8px;font-family:monospace">${buchungId}</p>
      </div>

      <!-- Self-Service: Tickets jederzeit online abrufbar -->
      <div style="text-align:center;margin-bottom:24px">
        <a href="${appUrl}/buchung/${buchungId}"
          style="display:inline-block;padding:12px 24px;border-radius:8px;background:#c2670b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">
          ${emailStrings.onlineAnsehen}
        </a>
        <p style="font-size:11px;color:#94a3b8;margin-top:8px">${emailStrings.onlineHinweis}</p>
      </div>

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0">
        ${emailStrings.fragen}
      </p>
    </div>
    ${params.poweredBySeatflow ? `<div style="padding:12px 32px;border-top:1px solid #e2e8f0;text-align:center"><a href="https://seatflow.app?ref=ticket" style="font-size:11px;color:#94a3b8;text-decoration:none">Powered by <strong style="color:#64748b">SeatFlow</strong></a></div>` : ""}
  </div>
</body>
</html>`;

  // Generate PDF ticket(s) — one per seat, each with its own QR code
  const ticketDataList = await Promise.all(
    sitze.map(async (s) => ({
      eventTitel,
      eventDatum,
      venue,
      sitzplaetze: [{ sitzId: s.sitzId, bezeichnung: s.kategorieName, preisCent: s.preisCent }],
      buchungId,
      gaestName: guestName,
      ticketTypName,
      qrCodeDataUrl: await QRCode.toDataURL(s.qrCode ?? buchungId, { width: 200, margin: 1, errorCorrectionLevel: "M" }),
      design: activeDesign,
      poweredBySeatflow: params.poweredBySeatflow,
    }))
  );

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await renderToBuffer(
      React.createElement(TicketPDF, { tickets: ticketDataList }) as Parameters<typeof renderToBuffer>[0]
    );
  } catch {
    // PDF generation failed — email is sent without attachment
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "tickets@seatflow.de",
    to,
    subject: `Dein Ticket: ${eventTitel}`,
    html,
    attachments: [
      {
        filename: "ticket-qrcode.png",
        content: Buffer.from(qrBase64, "base64"),
        contentId: "qrcode",
      },
      ...(pdfBuffer ? [{
        filename: `tickets-${eventTitel.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}.pdf`,
        content: pdfBuffer,
      }] : []),
    ],
  });
}

// ── Veranstalter-Rundmail an alle Gäste eines Events ─────────────────────────

function htmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendeRundmail(params: {
  to: string;
  betreff: string;
  nachricht: string;       // Klartext des Veranstalters
  eventTitel: string;
  veranstalterName: string;
  buchungLink?: string;    // "Meine Tickets"-Link des Empfängers
}) {
  const { to, betreff, nachricht, eventTitel, veranstalterName, buchungLink } = params;
  const absaetze = htmlEscape(nachricht)
    .split(/\n{2,}/)
    .map((a) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6">${a.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="de"><body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:#1e293b;padding:20px 28px">
        <p style="margin:0;color:#f8fafc;font-weight:700;font-size:15px">${htmlEscape(eventTitel)}</p>
        <p style="margin:2px 0 0;color:#94a3b8;font-size:12px">Nachricht vom Veranstalter</p>
      </div>
      <div style="padding:28px">
        ${absaetze}
        ${buchungLink ? `<p style="margin:20px 0 0"><a href="${buchungLink}" style="font-size:13px;color:#c2670b;text-decoration:none;font-weight:600">Deine Tickets ansehen →</a></p>` : ""}
      </div>
      <div style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:11px;color:#94a3b8">
          Gesendet über SeatFlow im Auftrag von ${htmlEscape(veranstalterName)}.
          Du erhältst diese E-Mail, weil du Tickets für dieses Event gebucht hast.
        </p>
      </div>
    </div>
  </div>
</body></html>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "tickets@seatflow.de",
    to,
    subject: betreff,
    html,
  });
}

// ── Verkaufs-Benachrichtigung an den Veranstalter ─────────────────────────────

export async function sendeVerkaufsBenachrichtigung(params: {
  to: string;
  eventTitel: string;
  gastName: string;
  anzahlTickets: number;
  gesamtCent: number;
  verkauftGesamt: number;
  dashboardLink: string;
}) {
  const { to, eventTitel, gastName, anzahlTickets, gesamtCent, verkauftGesamt, dashboardLink } = params;
  const summe = (gesamtCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  const html = `<!DOCTYPE html>
<html lang="de"><body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px">
      <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:700">Neue Buchung</p>
      <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#0f172a">${htmlEscape(eventTitel)}</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#64748b">Gast</td><td style="padding:4px 0;text-align:right;font-weight:600">${htmlEscape(gastName)}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b">Tickets</td><td style="padding:4px 0;text-align:right;font-weight:600">${anzahlTickets}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b">Betrag</td><td style="padding:4px 0;text-align:right;font-weight:600">${summe}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;border-top:1px solid #e2e8f0">Verkauft gesamt</td><td style="padding:4px 0;text-align:right;font-weight:700;border-top:1px solid #e2e8f0">${verkauftGesamt} Tickets</td></tr>
      </table>
      <p style="margin:20px 0 0"><a href="${dashboardLink}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#c2670b;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none">Buchung ansehen</a></p>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8">Abschaltbar in den SeatFlow-Einstellungen (Abo &amp; Konto).</p>
    </div>
  </div>
</body></html>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "tickets@seatflow.de",
    to,
    subject: `Neue Buchung: ${anzahlTickets}× ${eventTitel} (${summe})`,
    html,
  });
}
