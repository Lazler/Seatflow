-- Wer hat's gemacht? akteur_typ unterscheidet automatisierte Schritte
-- (system: Stripe-Webhook, initiale Ticket-Mail) von Aktionen durch den
-- Veranstalter (Dashboard) oder den Gast (Self-Service-Resend, Checkout).
-- akteur_name ist die Anzeige dazu (z.B. die E-Mail des Veranstalters oder
-- der Gastname) — optional, fehlt bei 'system' i.d.R. ganz.
alter table public.buchungs_ereignisse
  add column akteur_typ text not null default 'system' check (akteur_typ in ('system', 'veranstalter', 'gast')),
  add column akteur_name text;
