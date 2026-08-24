-- Opt-out für Verkaufs-Benachrichtigungen (bereits via MCP angewendet)
alter table public.veranstalter_profile
  add column if not exists benachrichtigung_verkauf boolean not null default true;
