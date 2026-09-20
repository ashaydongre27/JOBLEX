-- Link academy grant and FDP records to official university notifications.
-- Existing rows remain unpublished until an academy administrator supplies real evidence.

ALTER TABLE public.consultancy_grants
  ADD COLUMN IF NOT EXISTS notification_id TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'unverified';

ALTER TABLE public.fdp_programs
  ADD COLUMN IF NOT EXISTS notification_id TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS evidence_status TEXT NOT NULL DEFAULT 'unverified';

CREATE INDEX IF NOT EXISTS idx_consultancy_grants_notification
  ON public.consultancy_grants (notification_id);

CREATE INDEX IF NOT EXISTS idx_fdp_programs_notification
  ON public.fdp_programs (notification_id);
