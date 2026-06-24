-- Migration: 00001_initial_schema
-- Creates all core tables, RLS policies, and helper functions
-- Auth roles use user_roles table, NOT user_metadata

-- ============================================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- ============================================================
-- TABLE: user_roles
-- Server-set role assignments. NEVER client-settable.
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'revoked')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Index for role lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- RLS: Only service role can insert/update/delete user_roles
-- Users can read their own role
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user_roles"
  ON public.user_roles FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: news_posts
-- ============================================================
CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Community',
  cover_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_posts_published ON public.news_posts(published);
CREATE INDEX idx_news_posts_published_at ON public.news_posts(published_at DESC);
CREATE INDEX idx_news_posts_slug ON public.news_posts(slug);
CREATE INDEX idx_news_posts_deleted_at ON public.news_posts(deleted_at) WHERE deleted_at IS NOT NULL;

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read published, non-deleted posts
CREATE POLICY "Public can view published news"
  ON public.news_posts FOR SELECT
  USING (published = true AND deleted_at IS NULL);

-- Members can read all non-deleted posts
CREATE POLICY "Members can view all news"
  ON public.news_posts FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Admin can create posts
CREATE POLICY "Admin can create news"
  ON public.news_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin can update posts
CREATE POLICY "Admin can update news"
  ON public.news_posts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin can soft-delete posts (set deleted_at)
CREATE POLICY "Admin can delete news"
  ON public.news_posts FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- TABLE: announcements
-- ============================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('Event', 'Urgent', 'Info')),
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active ON public.announcements(active);
CREATE INDEX idx_announcements_type ON public.announcements(type);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Members can read active announcements (not expired, not deleted)
CREATE POLICY "Members can view active announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    active = true
    AND deleted_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Admin can create announcements
CREATE POLICY "Admin can create announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin can update announcements
CREATE POLICY "Admin can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin can soft-delete announcements
CREATE POLICY "Admin can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- TABLE: leaderboard_cache
-- ============================================================
CREATE TABLE public.leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strava_athlete_id BIGINT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  strava_handle TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  period_month DATE NOT NULL,
  total_km NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_elevation_m NUMERIC(8,1) NOT NULL DEFAULT 0,
  rides_attended INTEGER NOT NULL DEFAULT 0,
  kom_qom_count INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (strava_athlete_id, period_month)
);

CREATE INDEX idx_leaderboard_period ON public.leaderboard_cache(period_month);
CREATE INDEX idx_leaderboard_km ON public.leaderboard_cache(period_month, total_km DESC);
CREATE INDEX idx_leaderboard_elevation ON public.leaderboard_cache(period_month, total_elevation_m DESC);
CREATE INDEX idx_leaderboard_rides ON public.leaderboard_cache(period_month, rides_attended DESC);

ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Members can read leaderboard data
CREATE POLICY "Members can view leaderboard"
  ON public.leaderboard_cache FOR SELECT
  TO authenticated
  USING (true);

-- Service role can upsert (via Edge Function)
CREATE POLICY "Service role can upsert leaderboard"
  ON public.leaderboard_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: gallery_photos
-- ============================================================
CREATE TABLE public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  ride_tag TEXT,
  photo_date DATE,
  deleted_at TIMESTAMPTZ,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gallery_uploaded_by ON public.gallery_photos(uploaded_by);
CREATE INDEX idx_gallery_photo_date ON public.gallery_photos(photo_date DESC);
CREATE INDEX idx_gallery_ride_tag ON public.gallery_photos(ride_tag);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Members can view non-deleted photos
CREATE POLICY "Members can view gallery"
  ON public.gallery_photos FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Admin can create photos
CREATE POLICY "Admin can upload photos"
  ON public.gallery_photos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin can update photos
CREATE POLICY "Admin can update photos"
  ON public.gallery_photos FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin can soft-delete photos
CREATE POLICY "Admin can delete photos"
  ON public.gallery_photos FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- TABLE: sync_log
-- ============================================================
CREATE TABLE public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  detail JSONB,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_log_type ON public.sync_log(sync_type);
CREATE INDEX idx_sync_log_ran_at ON public.sync_log(ran_at DESC);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Members can read sync log (for last sync display)
CREATE POLICY "Members can view sync log"
  ON public.sync_log FOR SELECT
  TO authenticated
  USING (true);

-- Service role can insert (via Edge Function)
CREATE POLICY "Service role can insert sync log"
  ON public.sync_log FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- TABLE: member_invites
-- ============================================================
CREATE TABLE public.member_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_invites_token ON public.member_invites(token);
CREATE INDEX idx_member_invites_email ON public.member_invites(email);

ALTER TABLE public.member_invites ENABLE ROW LEVEL SECURITY;

-- Admin can view all invites
CREATE POLICY "Admin can view invites"
  ON public.member_invites FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admin can create invites
CREATE POLICY "Admin can create invites"
  ON public.member_invites FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Unauthenticated users need to validate tokens for registration
CREATE POLICY "Anyone can read invites for token validation"
  ON public.member_invites FOR SELECT
  USING (true);

-- Service role can update (mark consumed)
CREATE POLICY "Service role can update invites"
  ON public.member_invites FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: instagram_tokens
-- ============================================================
CREATE TABLE public.instagram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  refresh_status TEXT NOT NULL DEFAULT 'pending' CHECK (refresh_status IN ('success', 'failed', 'pending'))
);

ALTER TABLE public.instagram_tokens ENABLE ROW LEVEL SECURITY;

-- Admin can view token status
CREATE POLICY "Admin can view instagram tokens"
  ON public.instagram_tokens FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Service role can manage tokens (via Edge Function)
CREATE POLICY "Service role can manage instagram tokens"
  ON public.instagram_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: member_strava_tokens (Phase 2 scaffold — empty at launch)
-- ============================================================
CREATE TABLE public.member_strava_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT NOT NULL,
  strava_display_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE (user_id)
);

CREATE INDEX idx_member_strava_tokens_user ON public.member_strava_tokens(user_id);

ALTER TABLE public.member_strava_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own Strava tokens
CREATE POLICY "Users can view own strava tokens"
  ON public.member_strava_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage (via Edge Function in Phase 2)
CREATE POLICY "Service role can manage strava tokens"
  ON public.member_strava_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FUNCTION: Automatically update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FUNCTION: Auto-generate slug from title (for news_posts)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT lower(regexp_replace(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  ));
$$;

-- ============================================================
-- STORAGE BUCKETS: Create via Supabase dashboard or API
-- Run these manually after migration:
-- 1. Gallery bucket: public, file_size_limit=50000000 (50MB)
-- 2. News-covers bucket: public, file_size_limit=10000000 (10MB)
-- ============================================================
