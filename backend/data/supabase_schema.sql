-- ============================================================================
-- JOBLEX Complete Supabase Database Reset & Clean Re-Creation Script
-- Ministry of Ayush / All India Institute of Ayurveda (AIIA) | Problem ID: 26044
--
-- Features:
-- 1. Safely DROPS all existing tables and triggers (CASCADE) to wipe old schema
-- 2. Creates 100% scalable relational schema with foreign key constraints
-- 3. Contains ZERO initial rows or inserted data values
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. DROP EXISTING TABLES, TRIGGERS & FUNCTIONS (CLEAN RESET)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_current_timestamp_updated_at() CASCADE;

DROP TABLE IF EXISTS public.peer_benchmarking CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.cross_college_benchmarks CASCADE;
DROP TABLE IF EXISTS public.skill_roi_logs CASCADE;
DROP TABLE IF EXISTS public.sponsored_bootcamps CASCADE;
DROP TABLE IF EXISTS public.fdp_programs CASCADE;
DROP TABLE IF EXISTS public.consultancy_grants CASCADE;
DROP TABLE IF EXISTS public.syllabus_suggestions CASCADE;
DROP TABLE IF EXISTS public.mou_partnerships CASCADE;
DROP TABLE IF EXISTS public.zulu_chat_messages CASCADE;
DROP TABLE IF EXISTS public.zulu_chat_sessions CASCADE;
DROP TABLE IF EXISTS public.student_roadmaps CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- 1. ENUMS & CUSTOM TYPES
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('student', 'academy', 'industry', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.opportunity_type AS ENUM ('Internship', 'Job', 'Micro-Gig', 'Hackathon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.application_status AS ENUM (
        'Pending Review', 
        'Under Review', 
        'Shortlisted', 
        'Interview Scheduled', 
        'Offer Extended', 
        'Rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Helper function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CORE PLATFORM TABLES & RELATIONAL SCHEMA (EMPTY WITH ZERO INITIAL DATA)
-- ============================================================================

-- Table 1: Profiles (Linked to Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    institution TEXT,
    company TEXT,
    department TEXT,
    designation TEXT,
    year TEXT,
    xp INTEGER DEFAULT 1000 NOT NULL,
    streak INTEGER DEFAULT 1 NOT NULL,
    decay_frozen_until TIMESTAMP WITH TIME ZONE,
    verified_skills TEXT[] DEFAULT '{}'::TEXT[],
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Table 2: Opportunities & Micro-Gigs
CREATE TABLE public.opportunities (
    id TEXT PRIMARY KEY DEFAULT ('opp-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    type public.opportunity_type DEFAULT 'Internship'::public.opportunity_type NOT NULL,
    skills TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    location TEXT DEFAULT 'New Delhi / Hybrid' NOT NULL,
    stipend TEXT NOT NULL,
    deadline DATE NOT NULL,
    match INTEGER DEFAULT 85 NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 3: Applications Pipeline (Connecting Students & Industry)
CREATE TABLE public.applications (
    id TEXT PRIMARY KEY DEFAULT ('app-' || substr(md5(random()::text), 1, 8)),
    opportunity_id TEXT REFERENCES public.opportunities(id) ON DELETE CASCADE,
    opportunity_title TEXT NOT NULL,
    company TEXT NOT NULL,
    type public.opportunity_type DEFAULT 'Internship'::public.opportunity_type NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    college TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    match INTEGER DEFAULT 85 NOT NULL,
    applied_date DATE DEFAULT CURRENT_DATE NOT NULL,
    status public.application_status DEFAULT 'Pending Review'::public.application_status NOT NULL,
    verified_badge TEXT DEFAULT 'AIIA Verified',
    cover_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Generated columns for direct JavaScript camelCase compatibility
    "opportunityId" TEXT GENERATED ALWAYS AS (opportunity_id) STORED,
    "opportunityTitle" TEXT GENERATED ALWAYS AS (opportunity_title) STORED,
    "studentName" TEXT GENERATED ALWAYS AS (student_name) STORED,
    "studentEmail" TEXT GENERATED ALWAYS AS (student_email) STORED,
    "appliedDate" DATE GENERATED ALWAYS AS (applied_date) STORED,
    "verifiedBadge" TEXT GENERATED ALWAYS AS (verified_badge) STORED,
    "coverNote" TEXT GENERATED ALWAYS AS (cover_note) STORED
);

-- Table 4: Student Career Roadmaps & Anti-Decay Status
CREATE TABLE public.student_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    career_goal TEXT NOT NULL,
    current_level TEXT DEFAULT 'Level 3 - Intermediate Innovator',
    total_xp INTEGER DEFAULT 1450 NOT NULL,
    streak_days INTEGER DEFAULT 7 NOT NULL,
    decay_status TEXT DEFAULT 'Active - Decay Frozen for 72 hrs',
    current_phase INTEGER DEFAULT 1,
    phases JSONB NOT NULL DEFAULT '[]'::JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "careerGoal" TEXT GENERATED ALWAYS AS (career_goal) STORED,
    "currentLevel" TEXT GENERATED ALWAYS AS (current_level) STORED,
    "totalXp" INTEGER GENERATED ALWAYS AS (total_xp) STORED,
    "streakDays" INTEGER GENERATED ALWAYS AS (streak_days) STORED,
    "decayStatus" TEXT GENERATED ALWAYS AS (decay_status) STORED,
    "currentPhase" INTEGER GENERATED ALWAYS AS (current_phase) STORED
);

-- Table 5: Zulu AI Student Chat Sessions
CREATE TABLE public.zulu_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT DEFAULT 'New Conversation' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER trg_zulu_sessions_updated_at
    BEFORE UPDATE ON public.zulu_chat_sessions
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Table 6: Zulu AI Chat Messages Log
CREATE TABLE public.zulu_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.zulu_chat_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'zulu', 'system')),
    message TEXT NOT NULL,
    provider TEXT DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 7: Academic-Industry MoUs
CREATE TABLE public.mou_partnerships (
    id TEXT PRIMARY KEY DEFAULT ('mou-' || substr(md5(random()::text), 1, 8)),
    partner TEXT NOT NULL,
    institution TEXT NOT NULL,
    status TEXT DEFAULT 'Active' NOT NULL,
    signed_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    focus_areas TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    internships_provided INTEGER DEFAULT 0,
    curriculum_sponsors TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "signedDate" DATE GENERATED ALWAYS AS (signed_date) STORED,
    "validUntil" DATE GENERATED ALWAYS AS (valid_until) STORED,
    "focusAreas" TEXT[] GENERATED ALWAYS AS (focus_areas) STORED,
    "internshipsProvided" INTEGER GENERATED ALWAYS AS (internships_provided) STORED,
    "curriculumSponsors" TEXT GENERATED ALWAYS AS (curriculum_sponsors) STORED
);

-- Table 8: NEP-2020 Curriculum Modernization & Syllabus Suggestions
CREATE TABLE public.syllabus_suggestions (
    id TEXT PRIMARY KEY DEFAULT ('syl-' || substr(md5(random()::text), 1, 8)),
    current_topic TEXT NOT NULL,
    suggested_addition TEXT NOT NULL,
    source TEXT NOT NULL,
    impact TEXT,
    urgency TEXT DEFAULT 'High',
    status TEXT DEFAULT 'Proposed',
    credits_impact TEXT DEFAULT '+1 Practical Credit',
    adopted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "currentTopic" TEXT GENERATED ALWAYS AS (current_topic) STORED,
    "suggestedAddition" TEXT GENERATED ALWAYS AS (suggested_addition) STORED,
    "creditsImpact" TEXT GENERATED ALWAYS AS (credits_impact) STORED
);

-- Table 9: Faculty Consultancy Grants
CREATE TABLE public.consultancy_grants (
    id TEXT PRIMARY KEY DEFAULT ('cg-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    industry TEXT NOT NULL,
    grant_amount TEXT NOT NULL,
    deadline DATE NOT NULL,
    target_dept TEXT NOT NULL,
    status TEXT DEFAULT 'Open for Faculty Proposals' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "grantAmount" TEXT GENERATED ALWAYS AS (grant_amount) STORED,
    "targetDept" TEXT GENERATED ALWAYS AS (target_dept) STORED
);

-- Table 10: Faculty Development Programs (FDP)
CREATE TABLE public.fdp_programs (
    id TEXT PRIMARY KEY DEFAULT ('fdp-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    duration TEXT NOT NULL,
    mode TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    enrolled INTEGER DEFAULT 0,
    seats INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 11: Sponsored Skill Bootcamps
CREATE TABLE public.sponsored_bootcamps (
    id TEXT PRIMARY KEY DEFAULT ('bc-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    sponsor TEXT NOT NULL,
    partner_college TEXT NOT NULL,
    target_hires INTEGER NOT NULL,
    matched_scholars INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    stipend TEXT NOT NULL,
    guaranteed_outcome TEXT NOT NULL,
    status TEXT DEFAULT 'Cohort Enrolling' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "partnerCollege" TEXT GENERATED ALWAYS AS (partner_college) STORED,
    "targetHires" INTEGER GENERATED ALWAYS AS (target_hires) STORED,
    "matchedScholars" INTEGER GENERATED ALWAYS AS (matched_scholars) STORED,
    "startDate" DATE GENERATED ALWAYS AS (start_date) STORED,
    "guaranteedOutcome" TEXT GENERATED ALWAYS AS (guaranteed_outcome) STORED
);

-- Table 12: Skill ROI & AI Evaluation Calibration Logs
CREATE TABLE public.skill_roi_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_name TEXT NOT NULL,
    predicted_match INTEGER NOT NULL,
    actual_lab_rating NUMERIC(3, 2) NOT NULL,
    company TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    candidate TEXT GENERATED ALWAYS AS (candidate_name) STORED,
    "predictedMatch" INTEGER GENERATED ALWAYS AS (predicted_match) STORED,
    "actualLabRating" NUMERIC(3, 2) GENERATED ALWAYS AS (actual_lab_rating) STORED
);

-- Table 13: Cross-College Benchmarking & NAAC Rankings
CREATE TABLE public.cross_college_benchmarks (
    id SERIAL PRIMARY KEY,
    rank INTEGER NOT NULL,
    institution TEXT NOT NULL,
    avg_skill_score NUMERIC(4, 1) NOT NULL,
    placement_rate TEXT NOT NULL,
    mou_count INTEGER DEFAULT 0,
    naac_grade TEXT NOT NULL,
    status TEXT NOT NULL,
    "avgSkillScore" NUMERIC(4, 1) GENERATED ALWAYS AS (avg_skill_score) STORED,
    "placementRate" TEXT GENERATED ALWAYS AS (placement_rate) STORED,
    "mouCount" INTEGER GENERATED ALWAYS AS (mou_count) STORED,
    "naacGrade" TEXT GENERATED ALWAYS AS (naac_grade) STORED
);

-- Table 14: Candidates Pool (Reverse Discovery & Recruiter Inbound)
CREATE TABLE public.candidates (
    id TEXT PRIMARY KEY DEFAULT ('cand-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    match INTEGER DEFAULT 90 NOT NULL,
    skills TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    status TEXT DEFAULT 'Ready for Interview' NOT NULL,
    outreach_status TEXT DEFAULT 'Ready for Inbound Invitation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "outreachStatus" TEXT GENERATED ALWAYS AS (outreach_status) STORED
);

-- Table 15: Peer Benchmarking (Student Cohort Percentiles)
CREATE TABLE public.peer_benchmarking (
    id SERIAL PRIMARY KEY,
    user_percentile INTEGER DEFAULT 78 NOT NULL,
    branch_average_score INTEGER DEFAULT 72 NOT NULL,
    placed_peer_average_score INTEGER DEFAULT 86 NOT NULL,
    target_companies TEXT[] DEFAULT ARRAY['Dabur India', 'Himalaya Wellness', 'Patanjali Research'] NOT NULL,
    top_missing_skills JSONB DEFAULT '[]'::JSONB NOT NULL,
    "userPercentile" INTEGER GENERATED ALWAYS AS (user_percentile) STORED,
    "branchAverageScore" INTEGER GENERATED ALWAYS AS (branch_average_score) STORED,
    "placedPeerAverageScore" INTEGER GENERATED ALWAYS AS (placed_peer_average_score) STORED,
    "targetCompanies" TEXT[] GENERATED ALWAYS AS (target_companies) STORED,
    "topMissingSkills" JSONB GENERATED ALWAYS AS (top_missing_skills) STORED
);

-- ============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE SEARCH & SCALABILITY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_zulu_sessions_user_id ON public.zulu_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_zulu_messages_session_id ON public.zulu_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_mou_status ON public.mou_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_syllabus_status ON public.syllabus_suggestions(status);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zulu_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zulu_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultancy_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fdp_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_bootcamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_roi_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_college_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_benchmarking ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are readable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Opportunities Policies
DROP POLICY IF EXISTS "Opportunities are readable by everyone" ON public.opportunities;
CREATE POLICY "Opportunities are readable by everyone" 
ON public.opportunities FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Authenticated users can create opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can create opportunities" 
ON public.opportunities FOR INSERT TO authenticated WITH CHECK (true);

-- Applications Policies
DROP POLICY IF EXISTS "Students and recruiters can view applications" ON public.applications;
CREATE POLICY "Students and recruiters can view applications" 
ON public.applications FOR SELECT TO authenticated 
USING (
  auth.uid()::text = student_id::text 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('industry', 'admin')
  )
);

DROP POLICY IF EXISTS "Students can submit applications" ON public.applications;
CREATE POLICY "Students can submit applications" 
ON public.applications FOR INSERT TO authenticated 
WITH CHECK (auth.uid()::text = student_id::text OR student_id IS NULL);

DROP POLICY IF EXISTS "Recruiters and admins can update application statuses" ON public.applications;
CREATE POLICY "Recruiters and admins can update application statuses" 
ON public.applications FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('industry', 'admin')
  )
);

-- Zulu AI Chat Policies
DROP POLICY IF EXISTS "Users can manage their own Zulu sessions" ON public.zulu_chat_sessions;
CREATE POLICY "Users can manage their own Zulu sessions" 
ON public.zulu_chat_sessions FOR ALL TO authenticated 
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

DROP POLICY IF EXISTS "Users can manage their own Zulu messages" ON public.zulu_chat_messages;
CREATE POLICY "Users can manage their own Zulu messages" 
ON public.zulu_chat_messages FOR ALL TO authenticated 
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Public Read Policies for Portals
DROP POLICY IF EXISTS "MoUs readable by all" ON public.mou_partnerships;
CREATE POLICY "MoUs readable by all" ON public.mou_partnerships FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Syllabus suggestions readable by all" ON public.syllabus_suggestions;
CREATE POLICY "Syllabus suggestions readable by all" ON public.syllabus_suggestions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Grants readable by all" ON public.consultancy_grants;
CREATE POLICY "Grants readable by all" ON public.consultancy_grants FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "FDPs readable by all" ON public.fdp_programs;
CREATE POLICY "FDPs readable by all" ON public.fdp_programs FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Bootcamps readable by all" ON public.sponsored_bootcamps;
CREATE POLICY "Bootcamps readable by all" ON public.sponsored_bootcamps FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Skill ROI readable by all" ON public.skill_roi_logs;
CREATE POLICY "Skill ROI readable by all" ON public.skill_roi_logs FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Benchmarks readable by all" ON public.cross_college_benchmarks;
CREATE POLICY "Benchmarks readable by all" ON public.cross_college_benchmarks FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Candidates readable by all" ON public.candidates;
CREATE POLICY "Candidates readable by all" ON public.candidates FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Peer benchmarking readable by all" ON public.peer_benchmarking;
CREATE POLICY "Peer benchmarking readable by all" ON public.peer_benchmarking FOR SELECT TO authenticated, anon USING (true);

-- ============================================================================
-- ============================================================================
-- 4B. EXTENDED 7-FEATURE PLATFORM TABLES
-- ============================================================================

-- Table 16: Student Contextual To-Do Tasks
CREATE TABLE IF NOT EXISTS public.student_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'Personal' CHECK (category IN ('Academic', 'Application', 'Skill', 'Roadmap', 'Personal')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    source_type VARCHAR(50) DEFAULT 'user_created' CHECK (source_type IN ('user_created', 'system_roadmap', 'system_interview', 'university_broadcast')),
    source_ref_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_student_todos_student ON public.student_todos(student_id, is_completed);

-- Table 17: In-Portal Notifications Hub
CREATE TABLE IF NOT EXISTS public.in_portal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(255),
    category VARCHAR(50) CHECK (category IN ('application_update', 'new_opportunity', 'interview_invite', 'system_alert')),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.in_portal_notifications(recipient_id, is_read);

-- Table 18: Corporate Tech Stack Disclosures
CREATE TABLE IF NOT EXISTS public.company_tech_stacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    tech_category VARCHAR(100) NOT NULL,
    tech_name VARCHAR(150) NOT NULL,
    proficiency_demand_level VARCHAR(30) CHECK (proficiency_demand_level IN ('Familiarity', 'Intermediate Practitioner', 'Production Mastery')),
    adoption_stage VARCHAR(30) CHECK (adoption_stage IN ('Core Production', 'Rapid Growth', 'Piloting / Experimental', 'Phasing Out')),
    curriculum_relevance_note TEXT,
    last_verified_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 19: Virtual Workshops & Masterclasses
CREATE TABLE IF NOT EXISTS public.virtual_workshops (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('wsp-' || substr(md5(random()::text), 1, 8)),
    host_company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    host_company_name VARCHAR(150) NOT NULL,
    speaker_name VARCHAR(150) NOT NULL,
    speaker_designation VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    target_departments TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 90,
    meeting_link VARCHAR(255),
    max_seats INTEGER DEFAULT 250,
    enrolled_count INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Approved', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 20: Workshop Enrollments
CREATE TABLE IF NOT EXISTS public.workshop_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id VARCHAR(50) NOT NULL REFERENCES public.virtual_workshops(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workshop_id, student_id)
);

-- Table 21: Co-Curricular & Holistic Aptitude Questions
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(50) NOT NULL CHECK (domain IN ('Quantitative', 'Logical_Reasoning', 'Verbal_Ability', 'General_Knowledge', 'Industry_Ethics')),
    difficulty VARCHAR(20) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INTEGER NOT NULL,
    explanation TEXT
);

-- Table 22: Aptitude Assessment Sessions
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    raw_score NUMERIC(5, 2),
    total_questions INTEGER DEFAULT 30,
    percentage NUMERIC(5, 2),
    percentile NUMERIC(5, 2),
    domain_scores JSONB DEFAULT '{}'::JSONB,
    passed BOOLEAN DEFAULT FALSE,
    badge_hash VARCHAR(64)
);

-- Table 23: Company Skill Certification Quizzes
CREATE TABLE IF NOT EXISTS public.company_quizzes (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('quiz-' || substr(md5(random()::text), 1, 8)),
    company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    badge_title VARCHAR(150) NOT NULL,
    badge_icon VARCHAR(50) DEFAULT 'verified',
    skill_category VARCHAR(100) NOT NULL,
    time_limit_minutes INTEGER DEFAULT 15,
    passing_percentage INTEGER DEFAULT 75,
    total_takers INTEGER DEFAULT 0,
    pass_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 24: Student Quiz Certifications
CREATE TABLE IF NOT EXISTS public.student_quiz_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id VARCHAR(50) NOT NULL REFERENCES public.company_quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    badge_title VARCHAR(150) NOT NULL,
    score_percentage NUMERIC(5, 2) NOT NULL,
    passed BOOLEAN NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verification_token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_displayed_on_profile BOOLEAN DEFAULT TRUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_student_quiz_certifications_student ON public.student_quiz_certifications(student_id, passed);

-- ============================================================================
-- 5. AUTOMATIC USER PROFILE TRIGGER ON AUTH SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        name, 
        email, 
        role, 
        institution, 
        company, 
        department, 
        designation,
        year,
        xp,
        streak
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role),
        NEW.raw_user_meta_data->>'institution',
        NEW.raw_user_meta_data->>'company',
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'designation',
        NEW.raw_user_meta_data->>'year',
        1000,
        1
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. ROLES & PRIVILEGES (AUTHENTICATED, ANON, SERVICE_ROLE)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.opportunities, public.mou_partnerships, public.syllabus_suggestions, public.consultancy_grants, public.fdp_programs, public.sponsored_bootcamps, public.cross_college_benchmarks, public.candidates, public.peer_benchmarking, public.company_tech_stacks, public.virtual_workshops, public.company_quizzes TO anon;


