-- Öffentlicher Bucket für Event-Bilder (bereits via MCP angewendet)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-bilder', 'event-bilder', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "event_bilder_lesen" on storage.objects
  for select using (bucket_id = 'event-bilder');

create policy "event_bilder_upload" on storage.objects
  for insert with check (
    bucket_id = 'event-bilder'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "event_bilder_loeschen" on storage.objects
  for delete using (
    bucket_id = 'event-bilder'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
