-- Freikarten (Komplimentär-Tickets): nur über die manuelle Buchung anlegbar.
-- freikarte=true zwingt Preis + Servicegebühr auf 0 (serverseitig durchgesetzt
-- in app/api/booking/manual/route.ts). freikarte_label ist der optionale,
-- frei wählbare Grund (z.B. "Presse", "Sponsor", "Team"), der als Stempel auf
-- Ticket-PDF und in der Bestätigungsmail erscheint — leer bedeutet "Freikarte"
-- als generischer Stempeltext.
alter table public.buchungen
  add column freikarte boolean not null default false,
  add column freikarte_label text;
