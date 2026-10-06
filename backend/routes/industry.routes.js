/**
 * JOBLEX Industry Recruitment & Forecasting Routes (JavaScript / Node.js)
 * Enhanced with SIH 26044 features:
 * 3. Reverse Application & Inbound Talent Outreach
 * 6. Talent Pipeline Forecasting
 * 7. Skill Match ROI & Recruiter Rating Loop
 * 8. Sponsored Skill Bootcamps
 * - Connected Candidate Dossiers & Enterprise Requisitions Database Sync
 */
const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const DB = require('../data/database');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken, requireRole(['industry']));

// GET /api/industry, /api/industry/all-data, /api/industry/overview, /api/industry/analytics
router.get(['/', '/all-data', '/overview', '/stats', '/analytics'], async (req, res) => {
  try {
    const [oppRes, mouRes, candRes, bootRes, appRes] = await Promise.allSettled([
      supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
      supabase.from('mou_partnerships').select('*'),
      supabase.from('candidates').select('*'),
      supabase.from('sponsored_bootcamps').select('*'),
      supabase.from('applications').select('*').order('created_at', { ascending: false })
    ]);

    const opportunities = oppRes.status === 'fulfilled' && !oppRes.value.error && oppRes.value.data?.length
      ? oppRes.value.data
      : (DB.opportunities || []);

    const mouPartnerships = mouRes.status === 'fulfilled' && !mouRes.value.error && mouRes.value.data?.length
      ? mouRes.value.data
      : (DB.mou_partnerships || []);

    let candidates = candRes.status === 'fulfilled' && !candRes.value.error && candRes.value.data?.length
      ? candRes.value.data
      : [];

    if (!candidates.length && isConfigured && supabase) {
      try {
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('id, name, email, institution, department, verified_skills, xp, streak')
          .eq('role', 'student')
          .order('created_at', { ascending: false });
        if (studentProfiles && studentProfiles.length) {
          candidates = studentProfiles.map(s => ({
            id: s.id,
            name: s.name || 'Student Candidate',
            email: s.email,
            college: s.institution || 'National Academic University',
            institution: s.institution || 'National Academic University',
            department: s.department || 'Higher Education & Technology',
            skills: Array.isArray(s.verified_skills) && s.verified_skills.length ? s.verified_skills : ['Data Structures', 'Full-Stack Development', 'Python', 'Algorithms'],
            match: Math.min(96, Math.max(75, 70 + Math.floor((s.xp || 1000) / 100))),
            status: 'Ready for Interview',
            xp: s.xp || 0
          }));
        }
      } catch (err) {
        console.warn('[Candidates from profiles] Error:', err.message);
      }
    }

    const bootcamps = bootRes.status === 'fulfilled' && !bootRes.value.error && bootRes.value.data?.length
      ? bootRes.value.data
      : (DB.sponsoredBootcamps || []);

    const applications = appRes.status === 'fulfilled' && !appRes.value.error
      ? (appRes.value.data || [])
      : [];

    return res.json({
      success: true,
      opportunities,
      mouPartnerships,
      candidates,
      applications,
      forecast: DB.talentForecast || {},
      bootcamps,
      skillRoi: DB.skillRoiMetrics || {}
    });
  } catch (err) {
    console.warn('[Industry all-data] Query warning:', err.message);
    return res.json({
      success: true,
      opportunities: DB.opportunities || [],
      mouPartnerships: DB.mou_partnerships || [],
      candidates: [],
      applications: [],
      forecast: DB.talentForecast || {},
      bootcamps: DB.sponsoredBootcamps || [],
      skillRoi: DB.skillRoiMetrics || {}
    });
  }
});

// POST /api/industry/post-opportunity
router.post('/post-opportunity', authenticateToken, requireRole(['industry']), async (req, res) => {
  const data = req.body || {};
  const newOpp = {
    id: `opp-${Date.now().toString(36)}`,
    title: data.title || 'Research Associate',
    company: data.company || 'Ayush Industry Partner',
    type: data.type || 'Internship',
    skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map(s => s.trim()) : ['Herbal Formulation', 'Research']),
    location: data.location || 'New Delhi / Hybrid',
    stipend: data.stipend || '₹18,000/mo',
    deadline: data.deadline || '2026-11-30',
    match: 88,
    description: data.description || 'Opportunity posted via JOBLEX Industry Portal.'
  };

  try {
    const { data: dbData, error } = await supabase.from('opportunities').insert([newOpp]).select().single();
    if (!error && dbData) {
      if (!DB.opportunities) DB.opportunities = [];
      DB.opportunities.unshift(dbData);
      return res.status(201).json({
        success: true,
        message: 'Opportunity published successfully!',
        opportunity: dbData
      });
    }
  } catch (err) {
    console.warn('[Post opportunity] Supabase insert warning:', err.message);
  }

  if (!DB.opportunities) DB.opportunities = [];
  DB.opportunities.unshift(newOpp);
  res.status(201).json({
    success: true,
    message: 'Opportunity published successfully!',
    opportunity: newOpp
  });
});

// GET /api/industry/requisitions (Corporate Postings & Openings with applicant metrics)
router.get('/requisitions', async (req, res) => {
  const { type } = req.query;
  try {
    const [oppRes, appRes] = await Promise.allSettled([
      supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*')
    ]);

    const opps = oppRes.status === 'fulfilled' && !oppRes.value.error && oppRes.value.data
      ? oppRes.value.data
      : (DB.opportunities || []);

    const apps = appRes.status === 'fulfilled' && !appRes.value.error
      ? (appRes.value.data || [])
      : [];

    const filteredOpps = (type && type !== 'All')
      ? opps.filter(o => o.type && o.type.toLowerCase() === type.toLowerCase())
      : opps;

    const requisitions = filteredOpps.map(opp => {
      const oppId = opp.id;
      const count = apps.filter(a => a.opportunity_id === oppId || a.opportunityId === oppId).length;
      return {
        ...opp,
        applicantCount: Math.max(count, opp.applicantCount || 0),
        active: opp.active !== false
      };
    });

    return res.json({ requisitions });
  } catch (err) {
    console.warn('[Industry requisitions] Supabase query warning:', err.message);
    const list = (type && type !== 'All')
      ? (DB.opportunities || []).filter(o => o.type && o.type.toLowerCase() === type.toLowerCase())
      : (DB.opportunities || []);
    return res.json({ requisitions: list });
  }
});

// GET /api/industry/applications (Real-time student applicants stream from Supabase)
router.get('/applications', async (req, res) => {
  const { company, type } = req.query;

  if (!isConfigured || !supabase) {
    return res.status(503).json({ success: false, error: 'Application database is not configured.' });
  }

  try {
    let query = supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (company && company !== 'All') query = query.ilike('company', `%${company}%`);
    if (type && type !== 'All') query = query.ilike('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, totalApplications: data.length, applications: data });
  } catch (err) {
    console.warn('[Industry applications] Supabase query warning:', err.message);
    return res.status(500).json({ success: false, error: 'Unable to load applications from the database.' });
  }
});

// Legacy status implementation retained for reference; the complete handler is defined below.
router.post('/applications/:id/status-legacy', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required.' });
  }

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json({ success: true, message: `Application status updated to "${status}"!`, application: data });
      }
    } catch (err) {
      console.warn('[Update App Status] Supabase update warning:', err.message);
    }
  }

  return res.status(404).json({ success: false, message: 'Application not found in the database.' });
});

// GET /api/industry/candidates
router.get('/candidates', async (req, res) => {
  const search = String(req.query.search || '').trim();

  if (!isConfigured || !supabase) {
    return res.status(503).json({ success: false, error: 'Candidate database is not configured.' });
  }

  try {
    let query = supabase.from('candidates').select('*').order('created_at', { ascending: false });
    let { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      const { data: studentProfiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email, institution, department, verified_skills, xp, streak')
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      if (!pErr && studentProfiles) {
        data = studentProfiles.map(s => ({
          id: s.id,
          name: s.name || 'Student Candidate',
          email: s.email,
          college: s.institution || 'National Academic University',
          institution: s.institution || 'National Academic University',
          department: s.department || 'Higher Education & Technology',
          skills: Array.isArray(s.verified_skills) && s.verified_skills.length ? s.verified_skills : ['Data Structures', 'Full-Stack Development', 'Python', 'Algorithms'],
          match: Math.min(96, Math.max(75, 70 + Math.floor((s.xp || 1000) / 100))),
          status: 'Ready for Interview',
          xp: s.xp || 0
        }));
      }
    }

    const normalizedSearch = search.toLowerCase();
    const candidates = (data || []).filter(candidate => {
      if (!normalizedSearch) return true;
      const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
      return [candidate.name, candidate.college, candidate.institution, ...skills]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedSearch));
    });
    return res.json({ success: true, candidates });
  } catch (e) {
    console.warn('[Industry candidates] Supabase query warning:', e.message);
    return res.status(500).json({ success: false, error: 'Unable to load candidates from the database.' });
  }
});

// GET /api/industry/forecast (Idea #6)
router.get('/forecast', (req, res) => {
  res.json(DB.talentForecast || {});
});

// GET /api/industry/reverse-search (Idea #3: Reverse Application)
router.get('/reverse-search', async (req, res) => {
  const { skill = '' } = req.query;
  if (!isConfigured || !supabase) {
    return res.status(503).json({ success: false, error: 'Candidate database is not configured.' });
  }

  try {
    let { data, error } = await supabase.from('candidates').select('*');
    if (error) throw error;

    if (!data || data.length === 0) {
      const { data: studentProfiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email, institution, department, verified_skills, xp, streak')
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      if (!pErr && studentProfiles) {
        data = studentProfiles.map(s => ({
          id: s.id,
          name: s.name || 'Student Candidate',
          email: s.email,
          college: s.institution || 'National Academic University',
          institution: s.institution || 'National Academic University',
          department: s.department || 'Higher Education & Technology',
          skills: Array.isArray(s.verified_skills) && s.verified_skills.length ? s.verified_skills : ['Data Structures', 'Full-Stack Development', 'Python', 'Algorithms'],
          match: Math.min(96, Math.max(75, 70 + Math.floor((s.xp || 1000) / 100))),
          status: 'Ready for Interview',
          xp: s.xp || 0
        }));
      }
    }

    const normalizedSkill = String(skill).toLowerCase().trim();
    const filtered = (data || []).filter(candidate => !normalizedSkill ||
      (Array.isArray(candidate.skills) ? candidate.skills : [])
        .some(candidateSkill => String(candidateSkill).toLowerCase().includes(normalizedSkill))
    );
    return res.json({
      success: true,
      totalMatched: filtered.length,
      candidates: filtered.map(candidate => ({
        ...candidate,
        isReverseDiscovery: true,
        hasApplied: false,
        outreachStatus: 'Ready for Inbound Invitation'
      }))
    });
  } catch (e) {
    console.warn('[Industry reverse search] Supabase query warning:', e.message);
    return res.status(500).json({ success: false, error: 'Unable to search candidates in the database.' });
  }
});

// POST /api/industry/inbound-invite (Idea #3)
router.post('/inbound-invite', (req, res) => {
  const { candidateName, roleTitle, candidateId, companyName } = req.body || {};
  const effectiveCandidateName = candidateName || 'Candidate';
  const effectiveRole = roleTitle || 'Research Associate';
  const effectiveCompany = companyName || 'Dabur India Ltd. / R&D Division';
  const studentRecipId = candidateId || 'usr-student-01';

  // Dispatch In-Portal Notification to Student
  if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
  DB.inPortalNotifications.unshift({
    id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    recipientId: studentRecipId,
    senderId: 'usr-industry-01',
    title: `Direct Interview Invitation: ${effectiveCompany}`,
    message: `${effectiveCompany} reviewed your verified portfolio and issued an inbound invitation for "${effectiveRole}".`,
    actionUrl: '/student.html#applications',
    category: 'interview_invite',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Inject an Interview Preparation To-Do Task for the Student
  if (!DB.todos) DB.todos = [];
  DB.todos.unshift({
    id: `todo-invite-${Date.now().toString(36)}`,
    studentId: studentRecipId,
    title: `Inbound Interview: ${effectiveRole} at ${effectiveCompany}`,
    description: `Direct corporate invitation received. Review botanical assay benchmarks and confirm interview availability.`,
    category: 'Application',
    priority: 'Urgent',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    isCompleted: false,
    completedAt: null,
    sourceType: 'system_interview',
    sourceRefId: `inv-${Date.now().toString(36)}`
  });

  res.json({
    success: true,
    message: `Direct inbound interview invitation transmitted to ${effectiveCandidateName} for role "${effectiveRole}"!`
  });
});

// GET /api/industry/bootcamps (Idea #8: Sponsored Bootcamps)
router.get('/bootcamps', (req, res) => {
  res.json({ bootcamps: DB.sponsoredBootcamps || [] });
});

// POST /api/industry/create-bootcamp (Idea #8)
router.post('/create-bootcamp', (req, res) => {
  const { title, partnerCollege, targetHires, stipend } = req.body || {};
  const newBootcamp = {
    id: `bc-${Date.now().toString(36)}`,
    title: title || 'Ayush Industrial Immersion Bootcamp',
    sponsor: 'Dabur India Ltd.',
    partnerCollege: partnerCollege || 'All India Institute of Ayurveda',
    targetHires: !isNaN(parseInt(targetHires, 10)) ? parseInt(targetHires, 10) : 20,
    matchedScholars: 14,
    startDate: 'Dec 01, 2026',
    stipend: stipend || 'Full Sponsorship + ₹10,000 Bounty',
    guaranteedOutcome: 'Direct PPOs for Top Finishers',
    status: 'Cohort Active'
  };

  if (!DB.sponsoredBootcamps) DB.sponsoredBootcamps = [];
  DB.sponsoredBootcamps.unshift(newBootcamp);
  res.json({ success: true, message: 'Sponsored Bootcamp cohort initiated!', bootcamp: newBootcamp });
});

// GET /api/industry/skill-roi (Idea #7)
router.get('/skill-roi', (req, res) => {
  res.json(DB.skillRoiMetrics || {});
});

// POST /api/industry/rate-candidate (Calibrate Model)
router.post('/rate-candidate', (req, res) => {
  const { candidate, rating, notes } = req.body || {};
  if (!DB.skillRoiMetrics) DB.skillRoiMetrics = { logs: [] };
  if (!DB.skillRoiMetrics.logs) DB.skillRoiMetrics.logs = [];

  DB.skillRoiMetrics.logs.unshift({
    candidate: candidate || 'Candidate',
    predictedMatch: 92,
    actualLabRating: Number(rating) || 4.5,
    company: 'Dabur R&D',
    note: notes || 'Performance calibrated.'
  });

  res.json({ success: true, message: 'Model weights updated with employer rating feedback!' });
});

// POST /api/industry/submit-skill-demand (Idea #9 bridge to BoS)
router.post('/submit-skill-demand', (req, res) => {
  const { skillTitle, urgentNeed, rationale } = req.body || {};
  if (!DB.syllabus_suggestions) DB.syllabus_suggestions = [];

  const newSyllabusProposal = {
    id: `bos-${Date.now().toString(36)}`,
    current_topic: 'Standard Pharmacognosy Lab Hours',
    suggested_addition: skillTitle || 'Automated HPLC / HPTLC Method Development',
    source: 'Corporate Advisory Demand Signal',
    impact: rationale || 'High - Direct Hiring Prerequisite',
    urgency: urgentNeed ? 'Critical' : 'Medium',
    status: 'Pending BoS Review',
    credits_impact: '+2 Non-Core Elective Credits',
    adopted: false
  };
  DB.syllabus_suggestions.unshift(newSyllabusProposal);

  res.json({ success: true, message: 'Skill demand signal successfully transmitted to Academic Board of Studies!', proposal: newSyllabusProposal });
});

// GET /api/industry/applications
router.get('/applications', async (req, res) => {
  const { company, type } = req.query;

  try {
    let query = supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (company && company !== 'All') {
      query = query.ilike('company', `%${company}%`);
    }
    if (type && type !== 'All') {
      query = query.ilike('type', type);
    }
    const { data, error } = await query;
    if (!error && data) {
      return res.json({
        totalApplications: data.length,
        applications: data
      });
    }
  } catch (err) {
    console.warn('[Industry applications] Supabase warning:', err.message);
  }

  let list = [];
  if (company && company !== 'All') {
    list = list.filter(a => a.company && a.company.toLowerCase().includes(company.toLowerCase()));
  }
  if (type && type !== 'All') {
    list = list.filter(a => a.type && a.type.toLowerCase() === type.toLowerCase());
  }
  res.json({
    totalApplications: list.length,
    applications: list
  });
});

// POST /api/industry/applications/:id/status
router.post('/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, interviewSlot = null } = req.body || {};
  const updatedStatus = status || 'Shortlisted';

  let app = null;

  try {
    const { data, error } = await supabase
      .from('applications')
      .update({ status: updatedStatus, interview_slot: interviewSlot })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      app = data;
    }
  } catch (err) {
    console.warn('[Update app status] Supabase error:', err.message);
  }

  // Graceful fallback to local DB
  if (!app) {
    if (!DB.applications) DB.applications = [];
    const idx = DB.applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      DB.applications[idx].status = updatedStatus;
      if (interviewSlot) DB.applications[idx].interview_slot = interviewSlot;
      app = DB.applications[idx];
    }
  }

  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found in the database.' });
  }

  const studentId = 'usr-student-01';
  const studentName = (app && (app.studentName || app.student_name)) || 'Candidate';
  const compName = (app && app.company) || 'Ayush Employer';
  const oppTitle = (app && (app.opportunityTitle || app.opportunity_title)) || 'Position';
  const notificationTitle = updatedStatus.includes('Interview')
    ? `Interview Scheduled: ${compName}`
    : `Status Update: ${updatedStatus} (${compName})`;

  // Auto-dispatch in-portal alert to student
  if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
  DB.inPortalNotifications.unshift({
    id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    recipientId: studentId,
    senderId: 'usr-industry-01',
    title: notificationTitle,
    message: `Your application for "${oppTitle}" has been updated to "${updatedStatus}".${interviewSlot ? ` Scheduled slot: ${interviewSlot}` : ''}`,
    actionUrl: '/student.html#applications',
    category: updatedStatus.includes('Interview') ? 'interview_invite' : 'application_update',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Auto-inject a To-Do if an interview is scheduled or shortlisted
  if (updatedStatus.includes('Interview') || updatedStatus.includes('Shortlist')) {
    if (!DB.todos) DB.todos = [];
    DB.todos.unshift({
      id: `todo-app-${Date.now().toString(36)}`,
      studentId,
      title: `Prepare for ${compName} Interview (${oppTitle})`,
      description: `Review pharmacognosy fundamentals, standard markers, and prepare research presentation. Slot: ${interviewSlot || 'Upcoming Date'}.`,
      category: 'Application',
      priority: 'Urgent',
      dueDate: interviewSlot || new Date(Date.now() + 86400000 * 3).toISOString(),
      isCompleted: false,
      completedAt: null,
      sourceType: 'system_interview',
      sourceRefId: id
    });
  }

  return res.json({
    success: true,
    message: `Application status updated to "${updatedStatus}" for ${studentName}!`,
    application: app || { id, status: updatedStatus }
  });
});

// ============================================================================
// FEATURE 3: Industry Tech Stack Registry
// ============================================================================

// POST /api/industry/tech-stack (Company publishes active tools & tech stacks)
router.post('/tech-stack', async (req, res) => {
  try {
    const {
      companyId = 'usr-industry-01',
      companyName = 'Dabur India Ltd. / R&D Division',
      sector = 'Herbal Phytomedicine & Formulation',
      techCategory = 'Analytical Instrumentation',
      techName,
      technologyName,
      technology,
      title,
      proficiencyDemandLevel = 'Production Mastery',
      adoptionStage = 'Core Production',
      curriculumRelevanceNote = ''
    } = req.body || {};

    const resolvedTechName = techName || technologyName || technology || title;

    if (!resolvedTechName || !resolvedTechName.trim()) {
      return res.status(400).json({ success: false, error: 'Technology / Tool name is required.' });
    }

    const newStack = {
      id: `cts-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      companyId,
      companyName,
      sector,
      techCategory,
      techName: resolvedTechName.trim(),
      proficiencyDemandLevel,
      adoptionStage,
      curriculumRelevanceNote: curriculumRelevanceNote.trim(),
      lastVerifiedDate: new Date().toISOString().split('T')[0]
    };

    if (!DB.companyTechStacks) DB.companyTechStacks = [];
    DB.companyTechStacks.unshift(newStack);

    if (isConfigured && supabase) {
      try {
        await supabase.from('company_tech_stacks').insert({
          id: newStack.id,
          company_id: companyId,
          company_name: companyName,
          sector,
          tech_category: techCategory,
          tech_name: newStack.techName,
          proficiency_demand_level: proficiencyDemandLevel,
          adoption_stage: adoptionStage,
          curriculum_relevance_note: newStack.curriculumRelevanceNote,
          last_verified_date: newStack.lastVerifiedDate
        });
      } catch (err) {
        console.warn('[Tech Stack Insert] Supabase warning:', err.message);
      }
    }

    // Notify University Dean of new industrial disclosure
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}`,
      recipientId: 'usr-academy-01',
      senderId: companyId,
      title: 'New Industrial Tech Stack Published',
      message: `${companyName} published active deployment of "${newStack.techName}" (${sector}).`,
      actionUrl: '/academy.html#tech-radar',
      category: 'system_alert',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: `Technology "${newStack.techName}" registered successfully and synced to University Tech Radar!`,
      techStack: newStack
    });
  } catch (err) {
    console.error('[Industry Tech-Stack Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/industry/tech-stack
router.get('/tech-stack', async (req, res) => {
  try {
    const { companyId } = req.query;

    if (isConfigured && supabase) {
      try {
        let query = supabase.from('company_tech_stacks').select('*').order('created_at', { ascending: false });
        if (companyId) query = query.eq('company_id', companyId);
        const { data, error } = await query;
        if (!error && data) return res.json({ success: true, techStacks: data });
      } catch (err) {
        console.warn('[Tech Stack GET] Supabase warning:', err.message);
      }
    }

    let stacks = DB.companyTechStacks || [];
    if (companyId) stacks = stacks.filter(s => s.companyId === companyId);
    return res.json({ success: true, techStacks: stacks });
  } catch (err) {
    console.error('[Tech Stack GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// FEATURE 4: Virtual Workshops Proposal & Coordination
// ============================================================================

// POST /api/industry/workshops/propose
router.post('/workshops/propose', async (req, res) => {
  try {
    const {
      hostCompanyId = 'usr-industry-01',
      hostCompanyName = 'Dabur India Ltd. / R&D Division',
      speakerName,
      speakerDesignation,
      title,
      description = '',
      targetDepartments = [],
      scheduledStart,
      durationMinutes = 90,
      meetingLink = '',
      maxSeats = 250
    } = req.body || {};

    if (!title || !speakerName || !scheduledStart) {
      return res.status(400).json({ success: false, error: 'Title, speaker name, and scheduled start date/time are required.' });
    }

    const newWorkshop = {
      id: `wsp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      hostCompanyId,
      hostCompanyName,
      speakerName: speakerName.trim(),
      speakerDesignation: (speakerDesignation || 'Subject Matter Expert').trim(),
      title: title.trim(),
      description: description.trim(),
      targetDepartments: Array.isArray(targetDepartments) && targetDepartments.length ? targetDepartments : ['Ayush Scholars', 'Pharmacognosy', 'Dravyaguna'],
      scheduledStart: new Date(scheduledStart).toISOString(),
      durationMinutes: parseInt(durationMinutes, 10) || 90,
      meetingLink: meetingLink.trim() || 'https://nexus.edu/workshops/live-room',
      maxSeats: parseInt(maxSeats, 10) || 250,
      enrolledCount: 0,
      status: 'Proposed',
      createdAt: new Date().toISOString()
    };

    if (!DB.virtualWorkshops) DB.virtualWorkshops = [];
    DB.virtualWorkshops.unshift(newWorkshop);

    if (isConfigured && supabase) {
      try {
        await supabase.from('virtual_workshops').insert({
          id: newWorkshop.id,
          host_company_id: hostCompanyId,
          host_company_name: hostCompanyName,
          speaker_name: newWorkshop.speakerName,
          speaker_designation: newWorkshop.speakerDesignation,
          title: newWorkshop.title,
          description: newWorkshop.description,
          target_departments: newWorkshop.targetDepartments,
          scheduled_start: newWorkshop.scheduledStart,
          duration_minutes: newWorkshop.durationMinutes,
          meeting_link: newWorkshop.meetingLink,
          max_seats: newWorkshop.maxSeats,
          enrolled_count: 0,
          status: 'Proposed'
        });
      } catch (err) {
        console.warn('[Workshop Propose] Supabase warning:', err.message);
      }
    }

    // Alert University Dean of new proposal
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}`,
      recipientId: 'usr-academy-01',
      senderId: hostCompanyId,
      title: 'New Virtual Workshop Proposal',
      message: `${hostCompanyName} proposed a masterclass: "${newWorkshop.title}" (${newWorkshop.speakerName}).`,
      actionUrl: '/academy.html#workshops',
      category: 'system_alert',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: `Workshop proposal "${newWorkshop.title}" submitted to University Academic Council for approval!`,
      workshop: newWorkshop
    });
  } catch (err) {
    console.error('[Workshop Propose Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/industry/workshops
router.get('/workshops', async (req, res) => {
  try {
    const { companyId } = req.query;

    if (isConfigured && supabase) {
      try {
        let query = supabase.from('virtual_workshops').select('*').order('scheduled_start', { ascending: true });
        if (companyId) query = query.eq('host_company_id', companyId);
        const { data, error } = await query;
        if (!error && data) return res.json({ success: true, workshops: data });
      } catch (err) {
        console.warn('[Workshops GET] Supabase warning:', err.message);
      }
    }

    let workshops = DB.virtualWorkshops || [];
    if (companyId) workshops = workshops.filter(w => w.hostCompanyId === companyId);
    return res.json({ success: true, workshops });
  } catch (err) {
    console.error('[Workshops GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/industry/opportunities (Create industry requisition)
router.post('/opportunities', async (req, res) => {
  try {
    const { title, company, type, skills, location, stipend, deadline, description } = req.body || {};

    if (!title || !company) {
      return res.status(400).json({ success: false, error: 'Title and company are required to post an opportunity.' });
    }

    const newOpp = {
      id: `opp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      company: company.trim(),
      type: type || 'Internship',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : ['Herbal Formulation']),
      location: location || 'Hybrid / New Delhi',
      stipend: stipend || '₹20,000/mo',
      deadline: deadline || '2026-11-30',
      match: 85,
      description: description || 'Verified opportunity published through JOBLEX Industry portal.'
    };

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('opportunities').insert([newOpp]).select().single();
        if (!error && data) {
          return res.status(201).json({ success: true, message: 'Opportunity published successfully!', opportunity: data });
        }
      } catch (err) {
        console.warn('[Post Opportunity] Supabase error, saving locally:', err.message);
      }
    }

    if (!DB.opportunities) DB.opportunities = [];
    DB.opportunities.unshift(newOpp);

    // Broadcast in-portal notification to students
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: 'usr-student-01',
      senderId: 'usr-industry-01',
      title: `New Opening: ${newOpp.title}`,
      message: `${newOpp.company} has published a new ${newOpp.type} requisition. Check your match score!`,
      actionUrl: '/student.html#opportunities',
      category: 'new_opportunity',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ success: true, message: 'Opportunity published successfully!', opportunity: newOpp });
  } catch (err) {
    console.error('[Industry Post Opportunity Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// FEATURE 7: Company Skill Certification Quizzes Authoring
// ============================================================================

// POST /api/industry/quizzes (Author a skill certification quiz)
router.post('/quizzes', async (req, res) => {
  try {
    const {
      companyId = 'usr-industry-01',
      companyName = 'Dabur India Ltd.',
      badgeTitle,
      badgeIcon = 'verified',
      skillCategory,
      timeLimitMinutes = 15,
      passingPercentage = 75,
      questions = []
    } = req.body || {};

    if (!badgeTitle || !skillCategory || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Badge title, skill category, and at least one quiz question are required.' });
    }

    const newQuiz = {
      id: `quiz-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      companyId,
      companyName,
      badgeTitle: badgeTitle.trim(),
      badgeIcon,
      skillCategory: skillCategory.trim(),
      timeLimitMinutes: parseInt(timeLimitMinutes, 10) || 15,
      passingPercentage: parseInt(passingPercentage, 10) || 75,
      totalTakers: 0,
      passCount: 0,
      isActive: true,
      questions
    };

    if (!DB.companyQuizzes) DB.companyQuizzes = [];
    DB.companyQuizzes.unshift(newQuiz);

    if (isConfigured && supabase) {
      try {
        await supabase.from('company_quizzes').insert({
          id: newQuiz.id,
          company_id: companyId,
          company_name: companyName,
          badge_title: newQuiz.badgeTitle,
          badge_icon: badgeIcon,
          skill_category: newQuiz.skillCategory,
          time_limit_minutes: newQuiz.timeLimitMinutes,
          passing_percentage: newQuiz.passingPercentage,
          questions: JSON.stringify(questions),
          is_active: true
        });
      } catch (err) {
        console.warn('[Quiz Create] Supabase warning:', err.message);
      }
    }

    // Broadcast to students that a new certification quiz is available
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}`,
      recipientId: 'usr-student-01',
      senderId: companyId,
      title: `New Skill Certification: ${newQuiz.badgeTitle}`,
      message: `${companyName} opened a certification quiz for ${newQuiz.skillCategory}. Pass to earn a verified digital badge!`,
      actionUrl: '/student.html#certifications',
      category: 'system_alert',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: `Skill certification quiz "${newQuiz.badgeTitle}" published to student portal!`,
      quiz: newQuiz
    });
  } catch (err) {
    console.error('[Quiz Create Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/industry/quizzes (List quizzes with taker & certified counts)
router.get('/quizzes', async (req, res) => {
  try {
    const { companyId } = req.query;

    if (isConfigured && supabase) {
      try {
        let query = supabase.from('company_quizzes').select('*');
        if (companyId) query = query.eq('company_id', companyId);
        const { data, error } = await query;
        if (!error && data) return res.json({ success: true, quizzes: data });
      } catch (err) {
        console.warn('[Quizzes GET] Supabase warning:', err.message);
      }
    }

    let quizzes = DB.companyQuizzes || [];
    if (companyId) quizzes = quizzes.filter(q => q.companyId === companyId);
    return res.json({ success: true, quizzes });
  } catch (err) {
    console.error('[Quizzes GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// FEATURE 2: University Syllabus Review & Bilateral MoU Engine (SIH 26044)
// ============================================================================

// GET /api/industry/syllabi - Retrieve all accredited university department syllabi available for review
router.get('/syllabi', async (req, res) => {
  try {
    let curriculums = [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('curriculums').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length) {
          curriculums = data;
        }
      } catch (err) {
        console.warn('[Industry Syllabi] Supabase warning:', err.message);
      }
    }

    // Fallback to local DB
    if (curriculums.length === 0) {
      curriculums = DB.curriculums || [];
    }

    // Also fetch existing reviews for each curriculum to show average ratings
    const reviews = DB.syllabus_reviews || [];
    const curriculumsWithReviews = curriculums.map(curr => {
      const currReviews = reviews.filter(r => r.curriculum_id === curr.id);
      const avgRating = currReviews.length > 0
        ? (currReviews.reduce((sum, r) => sum + r.relevance_rating, 0) / currReviews.length).toFixed(1)
        : null;
      return {
        ...curr,
        reviewCount: currReviews.length,
        averageRating: avgRating,
        latestReview: currReviews.length > 0 ? currReviews[0] : null
      };
    });

    return res.json({ success: true, curriculums: curriculumsWithReviews });
  } catch (err) {
    console.error('[Industry Syllabi Error]:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve syllabi.' });
  }
});

// GET /api/industry/syllabi/:id - View detailed units, learning outcomes, and past industry review scores
router.get('/syllabi/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let curriculum = null;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('curriculums').select('*').eq('id', id).single();
        if (!error && data) {
          curriculum = data;
        }
      } catch (err) {
        console.warn('[Industry Syllabus Detail] Supabase warning:', err.message);
      }
    }

    if (!curriculum) {
      curriculum = (DB.curriculums || []).find(c => c.id === id);
    }

    if (!curriculum) {
      return res.status(404).json({ success: false, error: 'Syllabus not found.' });
    }

    // Get all reviews for this curriculum
    const reviews = (DB.syllabus_reviews || []).filter(r => r.curriculum_id === id);

    // Compute average ratings by category
    const avgRelevance = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.relevance_rating, 0) / reviews.length).toFixed(1)
      : null;

    return res.json({
      success: true,
      curriculum,
      reviews,
      summary: {
        totalReviews: reviews.length,
        averageRelevanceRating: avgRelevance,
        companiesReviewed: [...new Set(reviews.map(r => r.company_name))],
        allIdentifiedGaps: [...new Set(reviews.flatMap(r => r.identified_gaps))],
        allRecommendedTechnologies: [...new Set(reviews.flatMap(r => r.recommended_technologies))]
      }
    });
  } catch (err) {
    console.error('[Industry Syllabus Detail Error]:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve syllabus details.' });
  }
});

// POST /api/industry/syllabi/:id/review - Submit formal corporate evaluation, relevance rating, and modern skill recommendations
router.post('/syllabi/:id/review', async (req, res) => {
  try {
    const { id: curriculumId } = req.params;
    const {
      companyName = 'Dabur India Ltd.',
      reviewerName = 'Corporate Reviewer',
      relevanceRating,
      strengths = [],
      identifiedGaps = [],
      recommendedTechnologies = [],
      feedbackNotes
    } = req.body || {};

    // Verify curriculum exists
    const curriculum = (DB.curriculums || []).find(c => c.id === curriculumId);
    if (!curriculum) {
      return res.status(404).json({ success: false, error: 'Curriculum not found.' });
    }

    if (!relevanceRating || relevanceRating < 1.0 || relevanceRating > 5.0) {
      return res.status(400).json({ success: false, error: 'Relevance rating (1.0 to 5.0) is required.' });
    }

    if (!feedbackNotes || !feedbackNotes.trim()) {
      return res.status(400).json({ success: false, error: 'Feedback notes are required.' });
    }

    const newReview = {
      id: `sylrev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      curriculum_id: curriculumId,
      company_name: companyName.trim(),
      reviewer_name: reviewerName.trim(),
      relevance_rating: Number(relevanceRating),
      strengths: Array.isArray(strengths) ? strengths : [],
      identified_gaps: Array.isArray(identifiedGaps) ? identifiedGaps : [],
      recommended_technologies: Array.isArray(recommendedTechnologies) ? recommendedTechnologies : [],
      feedback_notes: feedbackNotes.trim(),
      created_at: new Date().toISOString()
    };

    // Save to database
    let savedReview;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('syllabus_reviews').insert({
          id: newReview.id,
          curriculum_id: newReview.curriculum_id,
          company_name: newReview.company_name,
          reviewer_name: newReview.reviewer_name,
          relevance_rating: newReview.relevance_rating,
          strengths: newReview.strengths,
          identified_gaps: newReview.identified_gaps,
          recommended_technologies: newReview.recommended_technologies,
          feedback_notes: newReview.feedback_notes,
          created_at: newReview.created_at
        }).select().single();
        if (!error && data) {
          savedReview = data;
        }
      } catch (err) {
        console.warn('[Syllabus Review] Supabase warning:', err.message);
      }
    }

    // Fallback to local DB
    if (!savedReview) {
      if (!DB.syllabus_reviews) DB.syllabus_reviews = [];
      DB.syllabus_reviews.unshift(newReview);
      savedReview = newReview;
    }

    // Notify Academy Dean of new review
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}`,
      recipientId: 'usr-academy-01',
      senderId: 'usr-industry-01',
      title: 'New Industry Curriculum Review Received',
      message: `${companyName} submitted a review for "${curriculum.department}" (Rating: ${relevanceRating}/5.0).`,
      actionUrl: '/academy.html#syllabus-reviews',
      category: 'system_alert',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Curriculum review submitted successfully and forwarded to Academic Board of Studies!',
      review: savedReview
    });
  } catch (err) {
    console.error('[Syllabus Review Error]:', err);
    return res.status(500).json({ success: false, error: 'Unable to submit curriculum review.' });
  }
});

// POST /api/industry/mou/initiate - Initiate a bilateral MoU agreement with an academic institution
router.post('/mou/initiate', async (req, res) => {
  try {
    const {
      institution = 'All India Institute of Ayurveda',
      department = 'Dravyaguna & Ayurvedic Pharmacology',
      scopeTracks = ['Student Internships'],
      tenureYears = 3,
      signatoryIndustry = 'Corporate Talent Lead',
      deliverables = []
    } = req.body || {};

    const companyName = req.user?.companyName || 'Dabur India Ltd.';
    const companyId = req.user?.id || 'usr-industry-01';

    if (!scopeTracks.length) {
      return res.status(400).json({ success: false, error: 'At least one collaboration scope track is required.' });
    }

    const newMou = {
      id: `mou-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      company: companyName,
      institution: institution.trim(),
      department: department.trim(),
      scope_tracks: Array.isArray(scopeTracks) ? scopeTracks : [scopeTracks],
      tenure_years: parseInt(tenureYears, 10) || 3,
      status: 'Draft',
      effective_date: null,
      signatory_industry: signatoryIndustry.trim(),
      signatory_academy: null,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      created_at: new Date().toISOString()
    };

    // Save to database
    let savedMou;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('mou_partnerships').insert({
          id: newMou.id,
          company: newMou.company,
          institution: newMou.institution,
          department: newMou.department,
          scope_tracks: newMou.scope_tracks,
          tenure_years: newMou.tenure_years,
          status: newMou.status,
          effective_date: newMou.effective_date,
          signatory_industry: newMou.signatory_industry,
          signatory_academy: newMou.signatory_academy,
          deliverables: newMou.deliverables,
          created_at: newMou.created_at
        }).select().single();
        if (!error && data) {
          savedMou = data;
        }
      } catch (err) {
        console.warn('[MoU Initiate] Supabase warning:', err.message);
      }
    }

    // Fallback to local DB
    if (!savedMou) {
      if (!DB.mou_partnerships) DB.mou_partnerships = [];
      DB.mou_partnerships.unshift(newMou);
      savedMou = newMou;
    }

    // Notify Academy Dean of new MoU proposal
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}`,
      recipientId: 'usr-academy-01',
      senderId: companyId,
      title: 'New Bilateral MoU Proposal Received',
      message: `${companyName} proposed a MoU for "${institution}" - ${department}. Scope: ${scopeTracks.join(', ')}.`,
      actionUrl: '/academy.html#mous',
      category: 'system_alert',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Bilateral MoU proposal submitted to Academic Dean for review!',
      mou: savedMou
    });
  } catch (err) {
    console.error('[MoU Initiate Error]:', err);
    return res.status(500).json({ success: false, error: 'Unable to initiate MoU proposal.' });
  }
});

// GET /api/industry/mous - View company's active bilateral MoUs and partnership statuses
router.get('/mous', async (req, res) => {
  try {
    const companyName = req.user?.companyName || 'Dabur India Ltd.';

    let mous = [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('mou_partnerships').select('*').ilike('company', `%${companyName}%`).order('created_at', { ascending: false });
        if (!error && data) {
          mous = data;
        }
      } catch (err) {
        console.warn('[Industry MoUs] Supabase warning:', err.message);
      }
    }

    // Fallback to local DB
    if (mous.length === 0) {
      mous = (DB.mou_partnerships || []).filter(m => m.company && m.company.toLowerCase().includes(companyName.toLowerCase()));
    }

    return res.json({ success: true, mouPartnerships: mous });
  } catch (err) {
    console.error('[Industry MoUs Error]:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve MoU partnerships.' });
  }
});

// ============================================================================
// FEATURE 1: Company Hiring Exam Conduction Engine (SIH 26044)
// ============================================================================

// Initialize in-memory storage for hiring exams if not present
if (!DB.hiring_exams) DB.hiring_exams = [];
if (!DB.hiring_exam_questions) DB.hiring_exam_questions = {};
if (!DB.candidate_exam_assignments) DB.candidate_exam_assignments = [];

// GET /api/industry/exams: List all hiring exams created by the authenticated company.
router.get('/exams', async (req, res) => {
  try {
    // Get company ID from authenticated user (assuming req.user exists after authentication)
    const companyId = req.user?.id || 'usr-industry-01'; // Fallback for development

    let exams = [];
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exams')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          exams = data;
        }
      } catch (err) {
        console.warn('[Get hiring exams] Supabase warning:', err.message);
      }
    }

    // Fallback to in-memory storage
    if (exams.length === 0) {
      exams = DB.hiring_exams.filter(exam => exam.companyId === companyId);
    }

    // Return exams without questions for list view
    const examsWithoutQuestions = exams.map(({ questions, ...examWithoutQuestions }) => examWithoutQuestions);
    return res.json({ success: true, exams: examsWithoutQuestions });
  } catch (err) {
    console.error('[Get hiring exams] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve hiring exams.' });
  }
});

// POST /api/industry/exams: Create a new hiring exam.
router.post('/exams', async (req, res) => {
  try {
    const {
      title,
      roleTitle,
      department = 'General',
      durationMinutes = 20,
      passingPercentage = 70,
      skills = [],
      questions = [] // Array of question objects: { questionText, options (array of 4 strings), correctIndex, skillCategory, difficulty, explanation }
    } = req.body;

    if (!title || !roleTitle) {
      return res.status(400).json({ success: false, error: 'Title and role title are required.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one question is required.' });
    }

    // Validate each question
    for (const q of questions) {
      if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= 4) {
        return res.status(400).json({ success: false, error: 'Each question must have questionText, 4 options, and a correctIndex between 0 and 3.' });
      }
    }

    const companyId = req.user?.id || 'usr-industry-01';
    const companyName = req.user?.companyName || 'Dabur India Ltd.';

    const newExam = {
      id: `exam-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      companyId,
      companyName,
      title: title.trim(),
      roleTitle: roleTitle.trim(),
      department: department.trim(),
      durationMinutes: parseInt(durationMinutes, 10) || 20,
      passingPercentage: parseInt(passingPercentage, 10) || 70,
      skills: Array.isArray(skills) ? skills.map(s => s.trim()) : [],
      totalQuestions: questions.length,
      createdAt: new Date().toISOString()
    };

    // Save exam to database
    let savedExam;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exams')
          .insert({
            id: newExam.id,
            company_id: newExam.companyId,
            company_name: newExam.companyName,
            title: newExam.title,
            role_title: newExam.roleTitle,
            department: newExam.department,
            duration_minutes: newExam.durationMinutes,
            passing_percentage: newExam.passingPercentage,
            skills: newExam.skills,
            total_questions: newExam.totalQuestions,
            created_at: newExam.createdAt
          })
          .select()
          .single();
        if (!error && data) {
          savedExam = data;
        }
      } catch (err) {
        console.warn('[Create hiring exam] Supabase warning:', err.message);
      }
    }

    // Fallback to in-memory storage
    if (!savedExam) {
      if (!DB.hiring_exams) DB.hiring_exams = [];
      DB.hiring_exams.push(newExam);
      savedExam = newExam;
    }

    // Save questions associated with this exam
    const examQuestions = questions.map((q, index) => ({
      id: `q${newExam.id}-${index}`,
      exam_id: newExam.id,
      question_text: q.questionText.trim(),
      options: q.options.map(opt => opt.trim()),
      correct_index: q.correctIndex,
      skill_category: q.skillCategory ? q.skillCategory.trim() : null,
      difficulty: q.difficulty ? q.difficulty.trim() : 'medium',
      explanation: q.explanation ? q.explanation.trim() : null
    }));

    if (isConfigured && supabase) {
      try {
        await supabase.from('hiring_exam_questions').insert(examQuestions);
      } catch (err) {
        console.warn('[Create hiring exam questions] Supabase warning:', err.message);
      }
    } else {
      if (!DB.hiring_exam_questions) DB.hiring_exam_questions = {};
      DB.hiring_exam_questions[newExam.id] = examQuestions;
    }

    // Return created exam (without questions for brevity, but could include if needed)
    const { questions: _, ...examWithoutQuestions } = savedExam;
    return res.status(201).json({
      success: true,
      message: 'Hiring exam created successfully!',
      exam: examWithoutQuestions
    });
  } catch (err) {
    console.error('[Create hiring exam] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to create hiring exam.' });
  }
});

// POST /api/industry/exams/:id/assign: Assign a specific exam to a student email/candidate ID.
router.post('/exams/:id/assign', async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { candidateEmail, candidateName, opportunityId } = req.body;

    if (!candidateEmail || !candidateName) {
      return res.status(400).json({ success: false, error: 'Candidate email and name are required.' });
    }

    // Verify exam exists
    let exam = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exams')
          .select('*')
          .eq('id', examId)
          .single();
        if (!error && data) {
          exam = data;
        }
      } catch (err) {
        console.warn('[Verify exam] Supabase warning:', err.message);
      }
    }
    if (!exam) {
      exam = DB.hiring_exams.find(e => e.id === examId);
    }
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found.' });
    }

    // Verify the exam belongs to the authenticated company
    const companyId = req.user?.id || 'usr-industry-01';
    if (exam.companyId !== companyId) {
      return res.status(403).json({ success: false, error: 'Not authorized to assign this exam.' });
    }

    const newAssignment = {
      id: `assign-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      examId,
      candidateEmail: candidateEmail.trim(),
      candidateName: candidateName.trim(),
      opportunityId: opportunityId ? opportunityId.trim() : null,
      status: 'Pending',
      score: null,
      passed: null,
      assignedAt: new Date().toISOString(),
      completedAt: null
    };

    // Save assignment to database
    let savedAssignment;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidate_exam_assignments')
          .insert({
            id: newAssignment.id,
            exam_id: newAssignment.examId,
            candidate_email: newAssignment.candidateEmail,
            candidate_name: newAssignment.candidateName,
            opportunity_id: newAssignment.opportunityId,
            status: newAssignment.status,
            score: newAssignment.score,
            passed: newAssignment.passed,
            assigned_at: newAssignment.assignedAt,
            completed_at: newAssignment.completedAt
          })
          .select()
          .single();
        if (!error && data) {
          savedAssignment = data;
        }
      } catch (err) {
        console.warn('[Create assignment] Supabase warning:', err.message);
      }
    }

    // Fallback to in-memory storage
    if (!savedAssignment) {
      if (!DB.candidate_exam_assignments) DB.candidate_exam_assignments = [];
      DB.candidate_exam_assignments.push(newAssignment);
      savedAssignment = newAssignment;
    }

    // Notify student via in-portal notification and To-Do (similar to other features)
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: `usr-student-${Date.now().toString(36)}`, // In real app, we'd look up student ID by email
      senderId: companyId,
      title: `Hiring Assessment Invitation: ${exam.title}`,
      message: `${exam.companyName} has invited you to take a hiring assessment for the role of "${exam.roleTitle}".`,
      actionUrl: '/student.html#assigned-exams',
      category: 'hiring_exam_invite',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    if (!DB.todos) DB.todos = [];
    DB.todos.unshift({
      id: `todo-assign-${Date.now().toString(36)}`,
      studentId: `usr-student-${Date.now().toString(36)}`, // Match above
      title: `Complete Hiring Assessment: ${exam.roleTitle} at ${exam.companyName}`,
      description: `You have been invited to take a skills assessment. Duration: ${exam.durationMinutes} minutes. Passing score: ${exam.passingPercentage}%.`,
      category: 'Application',
      priority: 'Urgent',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
      isCompleted: false,
      completedAt: null,
      sourceType: 'hiring_exam',
      sourceRefId: newAssignment.id
    });

    return res.status(201).json({
      success: true,
      message: 'Exam assigned to candidate successfully!',
      assignment: savedAssignment
    });
  } catch (err) {
    console.error('[Assign hiring exam] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to assign hiring exam.' });
  }
});

// GET /api/industry/exams/:id/submissions: Retrieve all candidate results for a given exam.
router.get('/exams/:id/submissions', async (req, res) => {
  try {
    const { id: examId } = req.params;

    // Verify exam exists and belongs to authenticated company
    let exam = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exams')
          .select('*')
          .eq('id', examId)
          .single();
        if (!error && data) {
          exam = data;
        }
      } catch (err) {
        console.warn('[Get exam for submissions] Supabase warning:', err.message);
      }
    }
    if (!exam) {
      exam = DB.hiring_exams.find(e => e.id === examId);
    }
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found.' });
    }

    const companyId = req.user?.id || 'usr-industry-01';
    if (exam.companyId !== companyId) {
      return res.status(403).json({ success: false, error: 'Not authorized to view submissions for this exam.' });
    }

    // Get questions for this exam
    let questions = [];
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exam_questions')
          .select('*')
          .eq('exam_id', examId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          questions = data;
        }
      } catch (err) {
        console.warn('[Get exam questions] Supabase warning:', err.message);
      }
    }
    if (questions.length === 0) {
      questions = DB.hiring_exam_questions[examId] || [];
    }

    // Get assignments/submissions for this exam
    let assignments = [];
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidate_exam_assignments')
          .select('*')
          .eq('exam_id', examId)
          .order('assigned_at', { ascending: false });
        if (!error && data) {
          assignments = data;
        }
      } catch (err) {
        console.warn('[Get exam assignments] Supabase warning:', err.message);
      }
    }
    if (assignments.length === 0) {
      assignments = DB.candidate_exam_assignments.filter(a => a.examId === examId);
    }

    // Enhance assignment data with exam details and questions for context
    const enhancedAssignments = assignments.map(assignment => ({
      ...assignment,
      exam: {
        id: exam.id,
        title: exam.title,
        roleTitle: exam.roleTitle,
        durationMinutes: exam.durationMinutes,
        passingPercentage: exam.passingPercentage
      }
    }));

    return res.json({
      success: true,
      exam: {
        ...exam,
        questions: questions.map(q => ({
          id: q.id,
          questionText: q.question_text,
          options: q.options,
          correctIndex: q.correct_index,
          skillCategory: q.skill_category,
          difficulty: q.difficulty,
          explanation: q.explanation
        }))
      },
      submissions: enhancedAssignments
    });
  } catch (err) {
    console.error('[Get exam submissions] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve exam submissions.' });
  }
});

module.exports = router;