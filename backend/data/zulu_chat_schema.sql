-- ============================================================================
-- JOBLEX Zulu AI Chat History System - Updated Supabase DDL Schema
-- Enables student-isolated chat threads, session history & Row Level Security
-- Ministry of Ayush / All India Institute of Ayurveda | Problem Statement ID: 26044
-- ============================================================================

-- 1. Ensure Extension for UUID Generation exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create or Update zulu_chat_sessions Table
CREATE TABLE IF NOT EXISTS public.zulu_chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT zulu_chat_sessions_pkey PRIMARY KEY (id)
);

-- Optional: Add Foreign Key Constraint to profiles table if UUID user IDs are strictly enforced
-- ALTER TABLE public.zulu_chat_sessions 
--   ADD CONSTRAINT zulu_chat_sessions_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Create or Update zulu_chat_messages Table
CREATE TABLE IF NOT EXISTS public.zulu_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id text NOT NULL,
  sender text NOT NULL CHECK (sender = ANY (ARRAY['user'::text, 'zulu'::text, 'system'::text])),
  message text NOT NULL,
  provider text DEFAULT 'gemini-2.5-flash'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT zulu_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT zulu_chat_messages_session_id_fkey FOREIGN KEY (session_id) 
    REFERENCES public.zulu_chat_sessions(id) ON DELETE CASCADE
);

-- 4. Create Performance Indexes for Fast Per-Student Session & Message Lookups
CREATE INDEX IF NOT EXISTS idx_zulu_sessions_user_updated 
    ON public.zulu_chat_sessions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_zulu_messages_session_created 
    ON public.zulu_chat_messages(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_zulu_messages_user_created 
    ON public.zulu_chat_messages(user_id, created_at DESC);

-- 5. Enable Row Level Security (RLS) for Student Data Isolation
ALTER TABLE public.zulu_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zulu_chat_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for zulu_chat_sessions (Students can access ONLY their own sessions)
DROP POLICY IF EXISTS "Students can view own zulu chat sessions" ON public.zulu_chat_sessions;
CREATE POLICY "Students can view own zulu chat sessions"
    ON public.zulu_chat_sessions FOR SELECT
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Students can create own zulu chat sessions" ON public.zulu_chat_sessions;
CREATE POLICY "Students can create own zulu chat sessions"
    ON public.zulu_chat_sessions FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Students can update own zulu chat sessions" ON public.zulu_chat_sessions;
CREATE POLICY "Students can update own zulu chat sessions"
    ON public.zulu_chat_sessions FOR UPDATE
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Students can delete own zulu chat sessions" ON public.zulu_chat_sessions;
CREATE POLICY "Students can delete own zulu chat sessions"
    ON public.zulu_chat_sessions FOR DELETE
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- 7. RLS Policies for zulu_chat_messages (Students can access ONLY their own messages)
DROP POLICY IF EXISTS "Students can view own zulu chat messages" ON public.zulu_chat_messages;
CREATE POLICY "Students can view own zulu chat messages"
    ON public.zulu_chat_messages FOR SELECT
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Students can insert own zulu chat messages" ON public.zulu_chat_messages;
CREATE POLICY "Students can insert own zulu chat messages"
    ON public.zulu_chat_messages FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Students can delete own zulu chat messages" ON public.zulu_chat_messages;
CREATE POLICY "Students can delete own zulu chat messages"
    ON public.zulu_chat_messages FOR DELETE
    USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- 8. Automated Trigger Function to refresh updated_at timestamp on new activity
CREATE OR REPLACE FUNCTION public.update_zulu_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_zulu_session_timestamp ON public.zulu_chat_sessions;

CREATE TRIGGER trg_update_zulu_session_timestamp
    BEFORE UPDATE ON public.zulu_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_zulu_session_timestamp();
