-- Supabase Storage Buckets Setup
-- Run these commands in Supabase SQL Editor after initial migration

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('gallery', 'gallery', true, 50000000),
  ('news-covers', 'news-covers', true, 10000000)
ON CONFLICT (id) DO NOTHING;

-- Gallery storage policies
CREATE POLICY "Public can view gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Admin can upload to gallery"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.is_admin()
  );

CREATE POLICY "Admin can update gallery"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND public.is_admin()
  );

CREATE POLICY "Admin can delete from gallery"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND public.is_admin()
  );

-- News covers storage policies
CREATE POLICY "Public can view news covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-covers');

CREATE POLICY "Admin can upload news covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'news-covers'
    AND public.is_admin()
  );

CREATE POLICY "Admin can update news covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'news-covers'
    AND public.is_admin()
  );

CREATE POLICY "Admin can delete from news covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'news-covers'
    AND public.is_admin()
  );
