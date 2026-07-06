-- Verkaufszeitraum + Buchungslimit pro Event (bereits angewendet via MCP)

alter table public.events add column if not exists verkauf_ab timestamptz;
alter table public.events add column if not exists verkauf_bis timestamptz;
alter table public.events add column if not exists max_pro_buchung integer;
-- max_pro_buchung null = Plattform-Default (8)
