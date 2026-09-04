-- Verlauf/Historie pro Buchung (Shopify-artige Order-Timeline): erfasst die
-- wichtigsten Prozessschritte (erstellt, bezahlt, Ticket-Versand inkl.
-- Fehlschlägen, Erstattung, Bearbeitung durch den Veranstalter).
create table public.buchungs_ereignisse (
  id uuid primary key default gen_random_uuid(),
  buchung_id uuid not null references public.buchungen(id) on delete cascade,
  typ text not null check (typ in (
    'erstellt', 'bezahlt', 'ticket_gesendet', 'ticket_sende_fehler', 'erstattet', 'bearbeitet'
  )),
  details text,
  erstellt_am timestamptz not null default now()
);

create index buchungs_ereignisse_buchung_id_idx on public.buchungs_ereignisse (buchung_id, erstellt_am);

alter table public.buchungs_ereignisse enable row level security;

-- Gleiches Muster wie buchungs_kommentare: Veranstalter sieht/verwaltet
-- Ereignisse eigener Buchungen. Inserts kommen in der Praxis vom
-- Admin-Client (Server-Routen) oder direkt vom Veranstalter-Client
-- (z.B. beim Bearbeiten der Buchung).
create policy "veranstalter_ereignisse_all" on public.buchungs_ereignisse
  for all
  using (
    buchung_id in (
      select b.id from buchungen b join events e on e.id = b.event_id
      where e.veranstalter_id = auth.uid()
    )
  );
