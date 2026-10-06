-- Migration: One-on-One Mentorship & Guidance System
-- Created: 2026-10-02
-- Description: Creates tables for mentorship module per tmp/plan/03_ONE_ON_ONE_GUIDANCE_MODULE_PLAN.md

-- 1. Mentor Profiles Table
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('academy', 'industry')),
    full_name TEXT NOT NULL,
    title TEXT NOT NULL,                    -- e.g., "Professor of Computer Science", "Senior ML Engineer"
    organization TEXT NOT NULL,             -- University name or Company name
    department TEXT,                        -- Optional: department/division
    bio TEXT,                               -- Mentor's background and expertise
    expertise_areas TEXT[] DEFAULT '{}',    -- Array of expertise tags
    max_mentees INTEGER NOT NULL DEFAULT 3, -- Maximum concurrent mentees
    current_mentee_count INTEGER NOT NULL DEFAULT 0, -- Current active mentees
    accepting_new_mentees BOOLEAN NOT NULL DEFAULT true, -- Whether accepting new mentees
    available_slots JSONB DEFAULT '[]',     -- Array of available time slots (day, time, timezone)
    hourly_rate NUMERIC(10,2) DEFAULT 0,    -- 0 = free mentorship
    currency TEXT DEFAULT 'INR',
    rating NUMERIC(3,2) DEFAULT 0,          -- Average rating from mentees
    total_sessions INTEGER NOT NULL DEFAULT 0, -- Total completed sessions
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX idx_mentor_profiles_role ON mentor_profiles(role);
CREATE INDEX idx_mentor_profiles_accepting ON mentor_profiles(accepting_new_mentees) WHERE accepting_new_mentees = true;
CREATE INDEX idx_mentor_profiles_expertise ON mentor_profiles USING GIN(expertise_areas);
CREATE INDEX idx_mentor_profiles_rating ON mentor_profiles(rating DESC);

-- 2. Mentorship Applications Table
CREATE TABLE IF NOT EXISTS mentorship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    message TEXT,                           -- Student's reason for requesting mentorship
    preferred_topics TEXT[],                -- Topics student wants guidance on
    preferred_schedule TEXT,                -- Preferred meeting times
    mentor_response TEXT,                   -- Mentor's acceptance/rejection note
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate pending applications
    UNIQUE(student_id, mentor_id) WHERE status = 'pending'
);

CREATE INDEX idx_mentorship_applications_student ON mentorship_applications(student_id);
CREATE INDEX idx_mentorship_applications_mentor ON mentorship_applications(mentor_id);
CREATE INDEX idx_mentorship_applications_status ON mentorship_applications(status);

-- 3. Mentorship Relationships Table
CREATE TABLE IF NOT EXISTS mentorship_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES mentorship_applications(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'terminated')),
    goals TEXT,                             -- Agreed mentorship goals
    meeting_frequency TEXT,                 -- e.g., "weekly", "bi-weekly", "monthly"
    preferred_duration INTEGER DEFAULT 60,  -- Session duration in minutes
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(application_id)
);

CREATE INDEX idx_mentorship_relationships_student ON mentorship_relationships(student_id);
CREATE INDEX idx_mentorship_relationships_mentor ON mentorship_relationships(mentor_id);
CREATE INDEX idx_mentorship_relationships_status ON mentorship_relationships(status);

-- 4. Mentorship Sessions Table
CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES mentorship_relationships(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    meeting_link TEXT,                      -- Video call link (Zoom, Meet, Teams, etc.)
    agenda TEXT,                            -- Session agenda/topics
    notes TEXT,                             -- Private notes by mentor
    student_feedback TEXT,                  -- Student's feedback after session
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5), -- 1-5 rating
    mentor_feedback TEXT,                   -- Mentor's feedback
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentorship_sessions_relationship ON mentorship_sessions(relationship_id);
CREATE INDEX idx_mentorship_sessions_student ON mentorship_sessions(student_id);
CREATE INDEX idx_mentorship_sessions_mentor ON mentorship_sessions(mentor_id);
CREATE INDEX idx_mentorship_sessions_scheduled ON mentorship_sessions(scheduled_at);
CREATE INDEX idx_mentorship_sessions_status ON mentorship_sessions(status);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mentor_profiles_updated_at BEFORE UPDATE ON mentor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_applications_updated_at BEFORE UPDATE ON mentorship_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_relationships_updated_at BEFORE UPDATE ON mentorship_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorship_sessions_updated_at BEFORE UPDATE ON mentorship_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Row Level Security)
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- Mentor Profiles: Public read for accepting mentors, full access for owner
CREATE POLICY "Public can view accepting mentors" ON mentor_profiles
    FOR SELECT USING (accepting_new_mentees = true);
CREATE POLICY "Mentors can manage own profile" ON mentor_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Mentorship Applications: Students see own, Mentors see applications to them
CREATE POLICY "Students see own applications" ON mentorship_applications
    FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Mentors see applications to them" ON mentorship_applications
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));
CREATE POLICY "Students can create applications" ON mentorship_applications
    FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Mentors can update applications to them" ON mentorship_applications
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));

-- Mentorship Relationships: Both parties can view, Mentors can update status
CREATE POLICY "Participants can view relationships" ON mentorship_relationships
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));
CREATE POLICY "Mentors can update relationships" ON mentorship_relationships
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));

-- Mentorship Sessions: Both parties can view, both can create, mentor can update
CREATE POLICY "Participants can view sessions" ON mentorship_sessions
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));
CREATE POLICY "Participants can create sessions" ON mentorship_sessions
    FOR INSERT WITH CHECK (auth.uid() = student_id OR auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));
CREATE POLICY "Mentors can update sessions" ON mentorship_sessions
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));