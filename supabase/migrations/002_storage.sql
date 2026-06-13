-- ============================================================
-- ServiceCI — Supabase Storage Configuration
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- Create a storage bucket for service images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-images',
  'service-images',
  true,                    -- publicly accessible
  5242880,                 -- 5MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Create a storage bucket for profile avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,                 -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage RLS policies

-- Anyone can view images in the public buckets
create policy "Service images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'service-images');

create policy "Avatars are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload their own images
create policy "Authenticated users can upload service images"
  on storage.objects for insert
  with check (bucket_id = 'service-images' and auth.role() = 'authenticated');

create policy "Users can upload their own avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update/delete their own uploads
create policy "Users can update their own service images"
  on storage.objects for update
  using (bucket_id = 'service-images' and auth.uid() = owner);

create policy "Users can delete their own images"
  on storage.objects for delete
  using (auth.uid() = owner);
