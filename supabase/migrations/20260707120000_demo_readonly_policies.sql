-- Read-only-Demokonto: restriktive RLS-Policies sperren jeden Schreibvorgang
-- des Demo-Users. SELECT bleibt unberührt (nur Ansicht). Normale Nutzer sind
-- nicht betroffen (auth.uid() <> Demo-ID ist für sie immer true).
do $$
declare
  t text;
  demo constant text := 'aaaaaaaa-0000-4000-8000-000000000001';
begin
  foreach t in array array['events','venues','sitzplaene','veranstalter_profile','ticket_templates']
  loop
    execute format($f$
      drop policy if exists demo_ro_ins on public.%1$I;
      drop policy if exists demo_ro_upd on public.%1$I;
      drop policy if exists demo_ro_del on public.%1$I;
      create policy demo_ro_ins on public.%1$I as restrictive for insert to authenticated
        with check (auth.uid() <> %2$L::uuid);
      create policy demo_ro_upd on public.%1$I as restrictive for update to authenticated
        using (auth.uid() <> %2$L::uuid);
      create policy demo_ro_del on public.%1$I as restrictive for delete to authenticated
        using (auth.uid() <> %2$L::uuid);
    $f$, t, demo);
  end loop;
end $$;
