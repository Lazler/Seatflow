import { Resend } from "resend";
import QRCode from "qrcode";

const resend = new Resend(process.env.RESEND_API_KEY);

type TicketMailParams = {
  to: string;
  guestName: string;
  eventTitel: string;
  eventDatum: Date;
  venue?: string;
  buchungId: string;
  sitze: { sitzId: string; kategorieName: string; preisCent: number }[];
  gesamtCent: number;
};

export async function sendTicketMail(params: TicketMailParams) {
  const { to, guestName, eventTitel, eventDatum, venue, buchungId, sitze, gesamtCent } = params;

  const qrDataUrl = await QRCode.toDataURL(buchungId, { width: 200, margin: 1 });
  const qrBase64 = qrDataUrl.replace("data:image/png;base64,", "");

  const datumFormatiert = eventDatum.toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const sitzZeilen = sitze
    .map((s) => `<tr><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">${s.sitzId}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">${s.kategorieName}</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:right">${(s.preisCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:#0f172a;padding:24px 32px">
      <span style="color:#f8fafc;font-weight:700;font-size:18px">SeatFlow Ticket</span>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#64748b;font-size:14px">Hallo ${guestName},</p>
      <p style="margin:0 0 24px;font-size:15px">deine Buchung ist bestätigt! Hier sind deine Tickets:</p>

      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-weight:700;font-size:16px">${eventTitel}</p>
        <p style="margin:0 0 2px;color:#64748b;font-size:14px">${datumFormatiert}</p>
        ${venue ? `<p style="margin:0;color:#64748b;font-size:14px">${venue}</p>` : ""}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
        <thead><tr style="background:#f8fafc"><th style="padding:6px 8px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0">Sitz</th><th style="padding:6px 8px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0">Kategorie</th><th style="padding:6px 8px;text-align:right;font-weight:600;border-bottom:2px solid #e2e8f0">Preis</th></tr></thead>
        <tbody>${sitzZeilen}</tbody>
        <tfoot><tr><td colspan="2" style="padding:8px;font-weight:700;text-align:right">Gesamt</td><td style="padding:8px;font-weight:700;text-align:right">${(gesamtCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td></tr></tfoot>
      </table>

      <div style="text-align:center;margin-bottom:24px">
        <p style="font-size:13px;color:#64748b;margin-bottom:12px">Zeige diesen QR-Code beim Einlass vor:</p>
        <img src="cid:qrcode" alt="QR-Code Ticket" style="width:180px;height:180px;border:1px solid #e2e8f0;border-radius:8px" />
        <p style="font-size:11px;color:#94a3b8;margin-top:8px;font-family:monospace">${buchungId}</p>
      </div>

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0">
        Bei Fragen wende dich an den Veranstalter.
      </p>
    </div>
  </div>
</body>
</html>`;

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
    ],
  });
}
