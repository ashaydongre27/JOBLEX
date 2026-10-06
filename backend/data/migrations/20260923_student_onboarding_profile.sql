-- ============================================================================
-- JOBLEX Migration: Student Post-Signup Onboarding & StudentProfile Schema
-- Problem Statement ID: 26044
-- ============================================================================

-- 1. Extend public.profiles with onboarding fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]'::JSONB;

-- 2. Create StudentProfile table matching specification
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Academic Details
    college_name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    degree TEXT NOT NULL,
    specialization TEXT NOT NULL,
    current_semester TEXT NOT NULL,
    duration_left TEXT NOT NULL,

    -- Skills & Aspirations
    skills TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    skill_level TEXT DEFAULT 'Intermediate' NOT NULL,
    target_roles TEXT[] DEFAULT '{}'::TEXT[],
    preferred_company_types TEXT[] DEFAULT '{}'::TEXT[],
    target_companies TEXT[] DEFAULT '{}'::TEXT[],

    -- Availability & Preferences
    preferred_locations TEXT[] DEFAULT '{}'::TEXT[],
    willing_to_relocate BOOLEAN DEFAULT false,
    available_from DATE,
    internship_duration TEXT,
    job_availability_type TEXT DEFAULT 'Immediate',

    -- Background & Records
    has_backlogs BOOLEAN DEFAULT false,
    backlog_count INTEGER DEFAULT 0,
    has_publications BOOLEAN DEFAULT false,
    publications JSONB DEFAULT '[]'::JSONB,
    has_experience BOOLEAN DEFAULT false,
    experience JSONB DEFAULT '[]'::JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for speedy lookup by user_id
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
