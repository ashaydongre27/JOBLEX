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

// GET /api/opportunities
router.get('/', async (req, res) => {
  const { type } = req.query;

  if (!isConfigured || !supabase) {
    return res.status(503).json({ success: false, error: 'Opportunity database is not configured.' });
  }

  try {
    let query = supabase.from('opportunities').select('*');
    if (type && type !== 'All') query = query.ilike('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ opportunities: data || [] });
  } catch (err) {
    console.warn('[Opportunities GET] Supabase query warning:', err.message);
    return res.status(500).json({ success: false, error: 'Unable to load opportunities from the database.' });
  }
});

// POST /api/opportunities/apply (Student sends application to Industry)
router.post('/apply', authenticateToken, requireRole(['student']), async (req, res) => {
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

  if (!opportunityId) {
    return res.status(400).json({ success: false, error: 'A database opportunity ID is required to apply.' });
  }

  if (!isConfigured || !supabase) {
    return res.status(503).json({ success: false, error: 'Application database is not configured.' });
  }

  let newApp;
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
  } catch (err) {
    console.warn('[Opportunities Apply] Supabase insert error:', err.message);
    return res.status(500).json({ success: false, error: 'Unable to save the application to the database.' });
  }

  // Ensure camelCase aliases for client backwards compatibility
  newApp.opportunityId = newApp.opportunity_id;
  newApp.opportunityTitle = newApp.opportunity_title;
  newApp.studentName = newApp.student_name;
  newApp.studentEmail = newApp.student_email;
  newApp.appliedDate = newApp.applied_date;
  newApp.verifiedBadge = newApp.verified_badge;
  newApp.coverNote = newApp.cover_note;

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

  if (!isConfigured || !supabase) {
    return res.status(503).json({ success: false, error: 'Application database is not configured.' });
  }

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .ilike('student_email', email)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ applications: data || [] });
  } catch (err) {
    console.warn('[My Applications] Supabase query warning:', err.message);
    return res.status(500).json({ success: false, error: 'Unable to load applications from the database.' });
  }
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

