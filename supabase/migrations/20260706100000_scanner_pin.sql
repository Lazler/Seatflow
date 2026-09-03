-- Scanner-PIN: Einlasspersonal scannt ohne Veranstalter-Login (bereits via MCP angewendet)
alter table public.events add column if not exists scanner_pin text;
