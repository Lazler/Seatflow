-- Sprache der Buchung persistieren, damit die Gast-Seiten (Bestätigung,
-- „Meine Tickets") in der Sprache erscheinen, in der der Gast gebucht hat.
alter table public.buchungen
  add column if not exists sprache text not null default 'de'
  check (sprache in ('de','en','hu'));
