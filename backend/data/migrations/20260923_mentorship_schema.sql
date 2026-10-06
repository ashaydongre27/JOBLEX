-- Mentorship Module Schema
-- Created: 2026-09-23
-- Description: 1-on-1 Mentorship & Guidance System tables for SIH 26044

-- ============================================
-- Table 1: mentorship_profiles — Registered Mentor Directory
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL UNIQUE,   -- References profiles.id
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,              -- 'academy' or 'industry'
  institution_or_company VARCHAR(255) NOT NULL,
  designation VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  domains TEXT[] NOT NULL,                -- ['Phytochemistry', 'HPTLC', 'GLP Compliance']
  bio TEXT,
  max_mentees INT DEFAULT 5,             -- How many active mentees they accept
  current_mentee_count INT DEFAULT 0,
  accepting_new_mentees BOOLEAN DEFAULT TRUE,
  available_slots TEXT[] DEFAULT '{}',    -- e.g. ['Tuesday 16:00 IST', 'Thursday 15:00 IST']
  total_sessions_completed INT DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 5.0,
  total_ratings INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for multi-parameter search
CREATE INDEX IF NOT EXISTS idx_mentor_search ON mentorship_profiles (role, accepting_new_mentees, rating DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_domains ON mentorship_profiles USING GIN (domains);
CREATE INDEX IF NOT EXISTS idx_mentor_user_id ON mentorship_profiles (user_id);

-- ============================================
-- Table 2: mentorship_applications — Student Application Requests
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  student_institution VARCHAR(255),
  student_department VARCHAR(255),
  student_year VARCHAR(50),
  student_skills TEXT[] DEFAULT '{}',
  mentor_id UUID NOT NULL REFERENCES mentorship_profiles(id),
  mentor_name VARCHAR(255) NOT NULL,
  guidance_track VARCHAR(100) NOT NULL,    -- 'Career Readiness', 'Research Methodology', 'Technical Deep-Dive', 'Placement Prep'
  personal_statement TEXT NOT NULL,         -- Why the student wants this mentor
  goals TEXT,                               -- What the student hopes to achieve
  status VARCHAR(50) DEFAULT 'Pending',     -- 'Pending', 'Accepted', 'Declined', 'Withdrawn'
  mentor_response_note TEXT,                -- Optional note from mentor on accept/decline
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_application_student ON mentorship_applications (student_id);
CREATE INDEX IF NOT EXISTS idx_application_mentor ON mentorship_applications (mentor_id);
CREATE INDEX IF NOT EXISTS idx_application_status ON mentorship_applications (status);

-- ============================================
-- Table 3: mentorship_relationships — Active Mentor-Mentee Pairs
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES mentorship_applications(id),
  mentor_id UUID NOT NULL REFERENCES mentorship_profiles(id),
  mentor_name VARCHAR(255) NOT NULL,
  mentee_id VARCHAR(100) NOT NULL,         -- student user ID
  mentee_name VARCHAR(255) NOT NULL,
  mentee_email VARCHAR(255) NOT NULL,
  guidance_track VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',     -- 'active', 'paused', 'completed', 'terminated'
  sessions_completed INT DEFAULT 0,
  mentee_rating NUMERIC(2,1),              -- Mentee rates mentor after completion
  mentor_notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_relationship_mentor ON mentorship_relationships (mentor_id);
CREATE INDEX IF NOT EXISTS idx_relationship_mentee ON mentorship_relationships (mentee_id);
CREATE INDEX IF NOT EXISTS idx_relationship_status ON mentorship_relationships (status);

-- ============================================
-- Table 4: mentorship_sessions — Scheduled 1-on-1 Sessions
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES mentorship_relationships(id),
  requested_by VARCHAR(50) NOT NULL,       -- 'mentor' or 'mentee'
  agenda TEXT NOT NULL,
  preferred_slot VARCHAR(100),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  meeting_link VARCHAR(500),
  status VARCHAR(50) DEFAULT 'Requested',  -- 'Requested', 'Scheduled', 'Completed', 'Cancelled'
  session_notes TEXT,                      -- Post-session summary
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_relationship ON mentorship_sessions (relationship_id);
CREATE INDEX IF NOT EXISTS idx_session_status ON mentorship_sessions (status);