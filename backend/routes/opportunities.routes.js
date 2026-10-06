/**
 * JOBLEX Opportunities & Micro-Gigs Routes (JavaScript / Node.js)
 * Supports:
 * - Filtering by type ('Internship', 'Job', 'Micro-Gig', 'Hackathon')
 * - Direct Student Application Dispatch (`POST /apply`)
 * - Student's Own Applications List (`GET /my-applications`)
 */
const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { clearRecommendationCache } = require('../services/matching.service');
const DB = require('../data/database');

// GET /api/opportunities
router.get('/', async (req, res) => {
  const { type } = req.query;
  let opportunities = [];

  if (isConfigured && supabase) {
    try {
      let query = supabase.from('opportunities').select('*');
      if (type && type !== 'All') query = query.ilike('type', type);
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        opportunities = data;
      }
    } catch (err) {
      console.warn('[Opportunities GET] Supabase query fallback:', err.message);
    }
  }

  // Graceful local repository fallback
  if (opportunities.length === 0) {
    opportunities = DB.opportunities || [];
    if (type && type !== 'All') {
      opportunities = opportunities.filter(o =>
        (o.type || '').toLowerCase() === type.toLowerCase()
      );
    }
  }

  return res.json({
    success: true,
    count: opportunities.length,
    opportunities
  });
});

// POST /api/opportunities/apply (Student sends application to Industry)
router.post('/apply', authenticateToken, requireRole(['student']), async (req, res) => {
  console.log('[DEBUG] /api/opportunities/apply called');
  const {
    opportunityId,
    opportunityTitle,
    company,
    type,
    studentName,
    studentEmail,
    college,
    skills,
    match,
    coverNote
  } = req.body || {};

  const authenticatedEmail = (req.user.email || '').trim().toLowerCase();
  const authenticatedName = req.user.name || authenticatedEmail.split('@')[0];

  console.log('[DEBUG] authenticatedEmail:', authenticatedEmail, 'authenticatedName:', authenticatedName);
  console.log('[DEBUG] studentName from body:', studentName);

  if (!opportunityId) {
    return res.status(400).json({ success: false, error: 'A database opportunity ID is required to apply.' });
  }

  let newApp;
  let savedToSupabase = false;

  if (isConfigured && supabase) {
    try {
      const { data: opportunity, error: opportunityError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .maybeSingle();
      if (opportunityError) throw opportunityError;
      if (!opportunity) return res.status(404).json({ success: false, error: 'Opportunity was not found in the database.' });

      const application = {
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        company: opportunity.company,
        type: opportunity.type,
        student_name: authenticatedName,
        student_email: authenticatedEmail,
        college,
        skills: Array.isArray(skills) ? skills : [],
        match: Number.isFinite(Number(match)) ? Number(match) : null,
        applied_date: new Date().toISOString().split('T')[0],
        status: 'Pending Review',
        cover_note: coverNote || null
      };
      const { data, error } = await supabase.from('applications').insert([application]).select().single();
      if (error) throw error;
      newApp = data;
      savedToSupabase = true;
      console.log('[DEBUG] Saved to Supabase');
    } catch (err) {
      console.warn('[Opportunities Apply] Supabase insert fallback:', err.message);
    }
  }

  // Graceful local repository fallback - never show 500 to student
  if (!savedToSupabase) {
    console.log('[DEBUG] Using local DB fallback');
    // Find opportunity in local DB
    const opportunity = (DB.opportunities || []).find(o => o.id === opportunityId);
    if (!opportunity) return res.status(404).json({ success: false, error: 'Opportunity was not found in the database.' });

    const application = {
      id: `app-local-${Date.now()}`,
      opportunity_id: opportunity.id,
      opportunity_title: opportunity.title,
      company: opportunity.company,
      type: opportunity.type,
      student_name: authenticatedName,
      student_email: authenticatedEmail,
      college,
      skills: Array.isArray(skills) ? skills : [],
      match: Number.isFinite(Number(match)) ? Number(match) : null,
      applied_date: new Date().toISOString().split('T')[0],
      status: 'Pending Review',
      cover_note: coverNote || null
    };

    // Store in local DB applications array
    if (!DB.applications) DB.applications = [];
    DB.applications.unshift(application);
    newApp = application;
    console.log('[DEBUG] Saved to local DB');
  }

  // Ensure camelCase aliases for client backwards compatibility
  newApp.opportunityId = newApp.opportunity_id;
  newApp.opportunityTitle = newApp.opportunity_title;
  newApp.studentName = studentName || newApp.student_name;  // Use body studentName if provided
  newApp.studentEmail = newApp.student_email;
  newApp.appliedDate = newApp.applied_date;
  newApp.verifiedBadge = newApp.verified_badge;
  newApp.coverNote = newApp.cover_note;

  // Auto-dispatch in-portal notification to recruiter (industry user)
  console.log('[DEBUG] Creating notification for recruiter...');
  if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
  DB.inPortalNotifications.unshift({
    id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    recipientId: 'usr-industry-01',
    senderId: authenticatedEmail,
    title: `New Application: ${newApp.opportunityTitle}`,
    message: `${newApp.studentName} (${authenticatedEmail}) applied for "${newApp.opportunityTitle}" at ${newApp.company}.`,
    actionUrl: '/industry.html#applications',
    category: 'new_application',
    isRead: false,
    createdAt: new Date().toISOString()
  });
  console.log('[DEBUG] Notification created. Total notifications:', DB.inPortalNotifications.length);

  res.status(201).json({
    success: true,
    message: `Application for "${newApp.opportunityTitle}" successfully transmitted to ${newApp.company}!`,
    application: newApp
  });
});

// GET /api/opportunities/my-applications
router.get('/my-applications', async (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ success: false, error: 'Student email required to fetch applications.' });
  }

  let applications = [];

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .ilike('student_email', email)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        applications = data;
      }
    } catch (err) {
      console.warn('[My Applications] Supabase query fallback:', err.message);
    }
  }

  // Graceful local repository fallback
  if (applications.length === 0) {
    applications = (DB.applications || []).filter(app =>
      (app.student_email || '').toLowerCase() === email
    );
  }

  return res.json({ applications });
});

// POST /api/opportunities (Post an opportunity)
router.post('/', authenticateToken, requireRole(['industry']), async (req, res) => {
  const { title, company, type, skills, location, stipend, deadline, description } = req.body || {};

  if (!title || !company) {
    return res.status(400).json({ success: false, error: 'Title and company are required to post an opportunity.' });
  }

  if (!isConfigured || !supabase) {
    return res.status(503).json({ success: false, error: 'Opportunity database is not configured.' });
  }

  const newOpp = {
    title: title.trim(),
    company: company.trim(),
    type: type || 'Internship',
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
    location: location || null,
    stipend: stipend || null,
    deadline: deadline || null,
    description: description || null,
    created_by: req.user.id
  };

  try {
    const { data: savedOpp, error } = await supabase.from('opportunities').insert([newOpp]).select().single();
    if (error) throw error;
    clearRecommendationCache();
    return res.status(201).json({ success: true, message: 'Opportunity published successfully!', opportunity: savedOpp });
  } catch (err) {
    console.warn('[Post Opportunity] Supabase insert warning:', err.message);
    return res.status(500).json({ success: false, error: 'Unable to save the opportunity to the database.' });
  }
});

// PATCH /api/opportunities/applications/:id/status (Recruiter updates candidate status)
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, interviewSlot = null, notes = '' } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    if (!isConfigured || !supabase) {
      return res.status(503).json({ success: false, error: 'Application database is not configured.' });
    }

    const { data: app, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    return res.json({
      success: true,
      message: `Application status updated to "${status}".`,
      application: app
    });
  } catch (err) {
    console.error('[Application Status Update Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

