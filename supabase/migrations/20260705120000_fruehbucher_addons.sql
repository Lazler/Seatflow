-- Frühbucher-Rabatt + Add-on-Produkte pro Event
-- Anwenden via Supabase Dashboard (SQL Editor) oder `supabase db push`,
-- sobald das Projekt wieder aktiv ist.

alter table public.events add column if not exists fruehbucher jsonb;
-- Struktur: { "prozent": 20, "bis": "2026-03-01T00:00:00Z" } oder null

alter table public.events add column if not exists addons jsonb;
-- Struktur: [{ "id": "...", "name": "Garderobe", "preis_cent": 200, "aktiv": true }]
