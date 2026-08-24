import nodemailer from "nodemailer";

// Provider-agnostischer SMTP-Versand (aktuell Plunk-SMTP; funktioniert mit
// jedem SMTP-Anbieter). Konfiguration über Env-Variablen — dieselben
// Zugangsdaten wie für den Supabase-Auth-SMTP.
//   SMTP_HOST   z. B. smtp.useplunk.com
//   SMTP_PORT   587 (STARTTLS) oder 465 (SSL)
//   SMTP_USER   z. B. "plunk"
//   SMTP_PASS   Plunk Secret API Key (sk_…)
//   MAIL_FROM   Absender, z. B. "SeatFlow <tickets@seatflow.de>"
const port = Number(process.env.SMTP_PORT ?? 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465, // 465 = implizites TLS, sonst STARTTLS
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export const MAIL_FROM = process.env.MAIL_FROM ?? "SeatFlow <tickets@seatflow.de>";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  // Wenn gesetzt, wird der Anhang als Inline-Bild eingebettet (HTML: src="cid:<cid>")
  cid?: string;
};

export async function sendeMail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<void> {
  await transporter.sendMail({
    from: MAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
}
