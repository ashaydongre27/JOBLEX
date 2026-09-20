/**
 * JOBLEX Academy & Curriculum Modernization Routes (Node.js / Express)
 * Powered by Google Gemini AI for NEP-2020 / NAAC Curriculum Auditing
 * Ministry of Ayush / All India Institute of Ayurveda | Problem Statement ID: 26044
 */

const express = require('express');
const router = express.Router();
const { generateWithFailover, isGoogleApiConfigured } = require('../services/ai.service');
const DB = require('../data/database');
const {
  recommendOpportunitiesForAcademician,
  computeInstitutionSkillGaps
} = require('../services/matching.service');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken, requireRole(['academy']));

/**
 * AI-powered curriculum audit using LangGraph Failover Orchestrator
 */
async function auditCurriculumWithGemini(syllabusText, department) {
  if (!isGoogleApiConfigured()) {
    return null;
  }

  const prompt = `You are the lead Academic Accreditation and Curriculum Modernization Auditor for the Ministry of Ayush, working under the National Education Policy (NEP-2020) and NAAC guidelines.

Audit this university department syllabus for "${department}":
"""
${syllabusText}
"""

Evaluate the syllabus against modern pharmaceutical industry needs (HPTLC, HPLC, molecular docking, GLP/GCP, digital health informatics).
Return ONLY a JSON object matching this schema:
{
  "coverageScore": number (0-100 score reflecting modern industry alignment),
  "naacCriterionScore": string (e.g. "3.6 / 4.0"),
  "matchingCompetencies": string[] (up to 4 classical or modern competencies covered well),
  "criticalGapsIdentified": [
    {
      "unit": string (name of unit or section),
      "gap": string (modern technical gap),
      "impact": string (why pharma industries like Dabur/Himalaya need this)
    }
  ],
  "modernizationRecommendations": string[] (3 specific modern topics to incorporate)
}`;

  try {
    const result = await generateWithFailover({
      prompt,
      systemInstruction: 'You are an AI curriculum evaluation specialist for the Ministry of Ayush. Always return raw, valid JSON.',
      temperature: 0.2,
      jsonMode: true
    });

    if (result && result.text) {
      const cleanJson = result.text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (err) {
    console.error('[Curriculum Audit LangGraph Error]:', err.message);
  }
  return null;
}

const { supabase, isConfigured } = require('../config/supabase');

// GET /api/academy, /api/academy/all-data, /api/academy/overview, /api/academy/stats
router.get(['/', '/all-data', '/overview', '/stats', '/analytics'], async (req, res) => {
  try {
    const [mouRes, sylRes, cgRes, fdpRes, bootRes, ccbRes, profRes, appRes] = await Promise.allSettled([
      supabase.from('mou_partnerships').select('*'),
      supabase.from('syllabus_suggestions').select('*'),
      supabase.from('consultancy_grants').select('*'),
      supabase.from('fdp_programs').select('*'),
      supabase.from('sponsored_bootcamps').select('*'),
      supabase.from('cross_college_benchmarks').select('*').order('rank', { ascending: true }),
      supabase.from('profiles').select('*').eq('role', 'student'),
      supabase.from('applications').select('*')
    ]);

    const mouPartnerships = mouRes.status === 'fulfilled' && !mouRes.value.error
      ? (mouRes.value.data || [])
      : [];

    const syllabusSuggestions = sylRes.status === 'fulfilled' && !sylRes.value.error
      ? (sylRes.value.data || [])
      : [];

    const consultancyGrants = cgRes.status === 'fulfilled' && !cgRes.value.error
      ? (cgRes.value.data || []).filter(grant => grant.evidence_status === 'published' && grant.notification_id)
      : [];

    const fdpPrograms = fdpRes.status === 'fulfilled' && !fdpRes.value.error
      ? (fdpRes.value.data || []).filter(program => program.evidence_status === 'published' && program.notification_id)
      : [];

    const sponsoredBootcamps = bootRes.status === 'fulfilled' && !bootRes.value.error && bootRes.value.data?.length
      ? bootRes.value.data
      : (DB.sponsoredBootcamps || []);

    const crossCollegeBenchmarking = ccbRes.status === 'fulfilled' && !ccbRes.value.error
      ? (ccbRes.value.data || [])
      : [];

    const liveStudents = profRes.status === 'fulfilled' && !profRes.value.error && profRes.value.data?.length
      ? profRes.value.data
      : (DB.users || []).filter(user => (user.role || '').toLowerCase() === 'student');

    const liveApplications = appRes.status === 'fulfilled' && !appRes.value.error && appRes.value.data?.length
      ? appRes.value.data
      : (DB.applications || []);

    const acceptedApplications = liveApplications.filter(application => /offer|accept|placed|shortlist/i.test(application.status || ''));
    const researchProjects = DB.researchProjects || DB.research_projects || [];

    const totalStudents = liveStudents.length;
    const avgReadiness = totalStudents
      ? Math.round(liveStudents.reduce((sum, student) => {
          const score = Number(student.readinessScore || student.readiness || (student.xp ? Math.min(95, 60 + Math.floor(student.xp / 50)) : 75));
          return sum + score;
        }, 0) / totalStudents)
      : 78;

    return res.json({
      success: true,
      mouPartnerships,
      syllabusSuggestions,
      consultancyGrants,
      fdpPrograms,
      tpoMetrics: DB.tpoMetrics || {},
      departmentalReadiness: DB.departmentalReadiness || [],
      crossCollegeBenchmarking,
      sponsoredBootcamps,
      studentStats: {
        totalEnrolled: totalStudents,
        avgSkillReadiness: `${avgReadiness}%`,
        placedUnderMoU: acceptedApplications.length,
        activeResearchProjects: researchProjects.length
      }
    });
  } catch (err) {
    console.error('[Academy all-data Error]:', err);
    res.status(500).json({ success: false, message: 'Unable to retrieve academic records.' });
  }
});

// GET /api/academy/cross-college-benchmarking
router.get('/cross-college-benchmarking', async (req, res) => {
  try {
    const { data, error } = await supabase.from('cross_college_benchmarks').select('*').order('rank', { ascending: true });
    if (!error) return res.json({ success: true, institutions: data || [] });
  } catch (err) {
    console.warn('[Cross-College] Supabase warning:', err.message);
  }
  res.json({ success: false, institutions: [], error: 'Peer benchmarking data is unavailable.' });
});

// GET /api/academy/curriculum-modules
router.get('/curriculum-modules', async (req, res) => {
  try {
    const { data, error } = await supabase.from('syllabus_suggestions').select('*');
    if (error) throw error;
    res.json({ success: true, modules: data || [] });
  } catch (err) {
    res.status(503).json({ success: false, modules: [], error: 'Curriculum records are unavailable.' });
  }
});

// POST /api/academy/adopt-syllabus
router.post('/adopt-syllabus', async (req, res) => {
  try {
    const { id } = req.body || {};

    try {
      const { data, error } = await supabase
        .from('syllabus_suggestions')
        .update({ adopted: true, status: 'Ratified by Council' })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return res.json({
          success: true,
          message: 'Curriculum modernization proposal ratified for Academic Council review.',
          suggestion: data
        });
      }
    } catch (err) {
      console.warn('[Adopt syllabus] Supabase update warning:', err.message);
    }

    res.status(503).json({ success: false, message: 'Curriculum proposal could not be updated in the database.' });
  } catch (err) {
    console.error('[Adopt Syllabus Error]:', err);
    res.status(500).json({ success: false, message: 'Could not process syllabus approval.' });
  }
});

// POST /api/academy/curriculum-audit
router.post('/curriculum-audit', async (req, res) => {
  try {
    const { syllabusText = '', department = 'Dravyaguna / Pharmacology' } = req.body || {};

    if (!syllabusText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course syllabus text to perform the curriculum audit.'
      });
    }

    // 1. Live Gemini AI Audit
    const aiAudit = await auditCurriculumWithGemini(syllabusText, department);
    if (aiAudit && aiAudit.criticalGapsIdentified) {
      return res.json({
        success: true,
        provider: 'google-gemini-ai',
        department,
        coverageScore: aiAudit.coverageScore || 72,
        naacCriterionScore: aiAudit.naacCriterionScore || '3.5 / 4.0',
        matchingCompetencies: aiAudit.matchingCompetencies || ['Classical Botanical Authentication', 'Pharmacognosy Basics'],
        criticalGapsIdentified: aiAudit.criticalGapsIdentified,
        accreditationDossierReady: true
      });
    }

    // 2. Analytical Audit Fallback
    const lower = syllabusText.toLowerCase();
    const gaps = [];
    if (!lower.includes('hptlc') && !lower.includes('chromatography')) {
      gaps.push({ unit: 'Analytical Pharmacognosy', gap: 'High-Performance Thin-Layer Chromatography (HPTLC)', impact: 'Required by 82% of pharma quality assurance labs.' });
    }
    if (!lower.includes('autodock') && !lower.includes('docking') && !lower.includes('in-silico')) {
      gaps.push({ unit: 'Formulation & Drug Discovery', gap: 'In-Silico AutoDock Molecular Docking', impact: 'Accelerates bioactive lead optimization.' });
    }
    if (!lower.includes('glp') && !lower.includes('regulatory') && !lower.includes('gcp')) {
      gaps.push({ unit: 'Clinical Standards', gap: 'Good Laboratory Practice (GLP) & Pharmacopeial Compliance', impact: 'Mandated under Ministry of Ayush quality guidelines.' });
    }

    const coverageScore = Math.max(55, Math.min(95, Math.round(50 + (syllabusText.length / 50))));

    return res.json({
      success: true,
      provider: 'analytical-engine',
      department,
      coverageScore,
      naacCriterionScore: `${(coverageScore / 25).toFixed(1)} / 4.0`,
      matchingCompetencies: ['Classical Botany & Nomenclature', 'Basic Herbal Formulation', 'Ayurvedic Toxicology Principles'],
      criticalGapsIdentified: gaps.length ? gaps : [
        { unit: 'Advanced Analytics', gap: 'Automated Monograph Validation', impact: 'Speeds up patent and formulation approval workflows.' }
      ],
      accreditationDossierReady: true
    });
  } catch (err) {
    console.error('[Curriculum Audit Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete curriculum audit. Please try again.'
    });
  }
});

/**
 * GET /api/academician/opportunities (or /api/academy/academician/opportunities)
 * Lists opportunities tailored for faculty with compatibility match scores
 */
router.get(['/opportunities', '/academician/opportunities'], (req, res) => {
  try {
    const { facultyId = 'usr-academy-01', type = 'All' } = req.query;

    const faculty = (DB.users || []).find(u => u.id === facultyId || u.role === 'academy') || {
      name: 'Dr. Rajesh Sharma',
      expertise: ['Ayurvedic Pharmacognosy', 'Herbal Formulation', 'HPTLC Fingerprinting', 'GLP Compliance'],
      department: 'Dravyaguna & Ayurvedic Pharmacology'
    };

    let opps = DB.facultyOpportunities || [];
    if (type && type !== 'All') {
      opps = opps.filter(o => o.type && o.type.toLowerCase() === type.toLowerCase());
    }

    const scored = recommendOpportunitiesForAcademician(faculty, opps);

    return res.json({
      success: true,
      totalCount: scored.length,
      facultyName: faculty.name,
      department: faculty.department,
      opportunities: scored
    });
  } catch (err) {
    console.error('[Academician Opportunities Error]:', err);
    res.status(500).json({ success: false, error: 'Could not fetch faculty opportunities.' });
  }
});

/**
 * POST /api/academician/opportunities
 * Allows faculty to create a "Call for Collaboration" or Research Project RFP
 */
router.post(['/opportunities', '/academician/opportunities'], (req, res) => {
  try {
    const {
      facultyId = 'usr-academy-01',
      facultyName = 'Faculty Member',
      title,
      type = 'Research Collaboration',
      targetDept,
      skills = [],
      duration = '6 Months',
      grantAmount,
      description
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: 'Project title is required to post a collaboration call.' });
    }

    const newOpp = {
      id: `fac-opp-${Date.now().toString(36)}`,
      title: title.trim(),
      industry: `${facultyName} (Principal Investigator)`,
      type,
      duration,
      stipend: grantAmount ? `Grant: ${grantAmount}` : 'Collaborative Authorship / Mentorship',
      eligibility: targetDept ? `Researchers in ${targetDept}` : 'Postgraduate Scholars & Faculty',
      skills: Array.isArray(skills) ? skills : [skills],
      deadline: '2026-12-31',
      description: description || 'Academic research collaboration call posted via JOBLEX Faculty Hub.'
    };

    if (!DB.facultyOpportunities) DB.facultyOpportunities = [];
    DB.facultyOpportunities.unshift(newOpp);

    return res.status(201).json({
      success: true,
      message: 'Call for Collaboration successfully published on JOBLEX Academic Hub!',
      opportunity: newOpp
    });
  } catch (err) {
    console.error('[Post Collaboration Call Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to create collaboration call.' });
  }
});

/**
 * GET /api/academician/applications
 * Returns applications submitted by faculty or received for their collaboration calls
 */
router.get(['/applications', '/academician/applications'], (req, res) => {
  try {
    const { facultyId = 'usr-academy-01' } = req.query;
    const apps = DB.facultyApplications || [];
    const facultyApps = apps.filter(a => a.facultyId === facultyId || a.facultyEmail);

    return res.json({
      success: true,
      totalCount: facultyApps.length,
      applications: facultyApps
    });
  } catch (err) {
    console.error('[Academician Applications GET Error]:', err);
    res.status(500).json({ success: false, error: 'Could not fetch faculty applications.' });
  }
});

/**
 * POST /api/academician/applications
 * Allows faculty to apply for industrial sabbaticals, consultancy grants, or FDPs
 */
router.post(['/applications', '/academician/applications'], (req, res) => {
  try {
    const {
      facultyId = 'usr-academy-01',
      facultyName = 'Faculty Member',
      facultyEmail = 'faculty@institution.edu',
      opportunityId,
      opportunityTitle,
      industry,
      proposalTitle,
      proposalNote,
      dossierUrl
    } = req.body || {};

    if (!opportunityTitle) {
      return res.status(400).json({ success: false, error: 'Opportunity title is required to submit proposal.' });
    }

    const newApp = {
      id: `fac-app-${Date.now().toString(36)}`,
      facultyId,
      facultyName,
      facultyEmail,
      opportunityId: opportunityId || 'fac-opp-custom',
      opportunityTitle,
      industry: industry || 'Ayush Industry Partner',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Under Review',
      proposalTitle: proposalTitle || 'Industrial Research Proposal',
      proposalNote: proposalNote || 'Proposal dossier submitted via JOBLEX Academician Portal.',
      dossierUrl: dossierUrl || null
    };

    if (!DB.facultyApplications) DB.facultyApplications = [];
    DB.facultyApplications.unshift(newApp);

    return res.status(201).json({
      success: true,
      message: `Your proposal for "${opportunityTitle}" has been transmitted to ${industry}!`,
      application: newApp
    });
  } catch (err) {
    console.error('[Academician Apply Error]:', err);
    res.status(500).json({ success: false, error: 'Could not submit faculty application.' });
  }
});

/**
 * GET /api/analytics/institution (or /api/academy/analytics/institution)
 * Provides comprehensive institution-level analytics:
 * - Placement conversion funnel
 * - Departmental readiness & OBE compliance
 * - Student skill gap diagnostics by target role
 * - Exportable executive report payload
 */
router.get(['/institution', '/analytics/institution', '/institution-analytics'], (req, res) => {
  try {
    const { targetRole = 'Herbal Formulation Scientist' } = req.query;
    const students = DB.candidates || [];

    const gapsDiagnostic = computeInstitutionSkillGaps(students, targetRole);

    const departmentalStats = [
      { department: 'Ayurvedic Pharmacology (Dravyaguna)', enrolled: 112, avgReadiness: '82.4%', placedCount: 28, mouPartners: 3 },
      { department: 'Rasashastra & Pharmaceutics', enrolled: 86, avgReadiness: '79.1%', placedCount: 19, mouPartners: 2 },
      { department: 'Ayush Health Informatics & AI', enrolled: 64, avgReadiness: '88.6%', placedCount: 22, mouPartners: 4 },
      { department: 'Kaya Chikitsa (Clinical)', enrolled: 80, avgReadiness: '76.8%', placedCount: 16, mouPartners: 2 }
    ];

    const placementFunnel = {
      totalScholars: 342,
      eligibleForPlacement: 280,
      applicationsSubmitted: 248,
      shortlistedForInterviews: 94,
      offersExtended: 52,
      conversionRate: '86%'
    };

    return res.json({
      success: true,
      institution: 'All India Institute of Ayurveda (AIIA), New Delhi',
      naacCycle: 'Cycle IV (Grade A++)',
      targetRole,
      placementFunnel,
      departmentalStats,
      gapsDiagnostic,
      exportPayload: {
        generatedAt: new Date().toISOString(),
        institutionName: 'All India Institute of Ayurveda',
        overallReadiness: `${gapsDiagnostic.averageCohortReadiness}%`,
        placementRate: placementFunnel.conversionRate,
        topRecommendations: [
          'Introduce dedicated 2-week hands-on HPTLC mobile phase workshop.',
          'Expand Python for Clinical Trials coursework into Rasashastra PG curriculum.'
        ]
      }
    });
  } catch (err) {
    console.error('[Institution Analytics Error]:', err);
    res.status(500).json({ success: false, error: 'Could not compute institution analytics.' });
  }
});

// ============================================================================
// FEATURE 3: University Tech Radar & Curriculum Modernization
// ============================================================================

// GET /api/academy/tech-radar (Aggregated Corporate Tech Stacks vs University Syllabus)
router.get('/tech-radar', async (req, res) => {
  try {
    let techStacks = DB.companyTechStacks || [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('company_tech_stacks').select('*');
        if (!error && data && data.length) techStacks = data;
      } catch (err) {
        console.warn('[Tech Radar] Supabase warning:', err.message);
      }
    }

    // Group technologies by sector
    const sectors = {};
    techStacks.forEach(item => {
      const sec = item.sector || 'General Bio-Pharma';
      if (!sectors[sec]) sectors[sec] = [];
      sectors[sec].push(item);
    });

    // Compute curriculum delta
    const curriculumGaps = [
      {
        technology: 'CAMAG HPTLC Automatic TLC Sampler 4',
        category: 'Analytical Instrumentation',
        industryAdoption: '88% of R&D Labs (Dabur, Patanjali)',
        universityCurriculumStatus: 'Paper & Silica TLC (Manual Chamber Only)',
        urgency: 'Critical',
        recommendedBoSAction: 'Introduce 1 practical credit for instrument calibration and peak integration in Dravyaguna Lab IV.'
      },
      {
        technology: '21 CFR Part 11 Electronic Lab Notebooks (ELN / LIMS)',
        category: 'Quality Assurance & Regulatory',
        industryAdoption: '94% of Export Formulators',
        universityCurriculumStatus: 'Manual Paper Registers',
        urgency: 'High',
        recommendedBoSAction: 'Add 15 hours of digital audit-trail and data integrity simulations to Final Year GMP module.'
      },
      {
        technology: 'Python (Polars, BioPython & AutoDock Vina)',
        category: 'Computational Ayush Informatics',
        industryAdoption: '72% of Modern Ayush Tech Startups',
        universityCurriculumStatus: 'No Bio-Informatics elective currently offered',
        urgency: 'Medium',
        recommendedBoSAction: 'Institute an interdisciplinary computational phytopharmacology elective under NEP-2020 multi-disciplinary mandate.'
      }
    ];

    return res.json({
      success: true,
      totalDisclosures: techStacks.length,
      sectors,
      curriculumGaps,
      activeBoSAmendments: 8
    });
  } catch (err) {
    console.error('[Tech Radar Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// FEATURE 4: Virtual Workshops & Bilateral Negotiations
// ============================================================================

// GET /api/academy/workshops/pending (View all workshop proposals)
router.get('/workshops/pending', async (req, res) => {
  try {
    let workshops = DB.virtualWorkshops || [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('virtual_workshops').select('*').order('scheduled_start', { ascending: true });
        if (!error && data) workshops = data;
      } catch (err) {
        console.warn('[Workshops Pending] Supabase warning:', err.message);
      }
    }

    return res.json({ success: true, workshops });
  } catch (err) {
    console.error('[Workshops Pending Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/academy/workshops/:id/decision (University Dean/TPO approves/rejects proposal)
router.patch('/workshops/:id/decision', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision = 'Approved', notes = '' } = req.body || {};

    const workshops = DB.virtualWorkshops || [];
    const wsp = workshops.find(w => w.id === id);

    if (wsp) {
      wsp.status = decision;
      if (notes) wsp.decisionNotes = notes;
    }

    if (isConfigured && supabase) {
      try {
        await supabase.from('virtual_workshops').update({ status: decision }).eq('id', id);
      } catch (err) {
        console.warn('[Workshop Decision] Supabase warning:', err.message);
      }
    }

    if (decision === 'Approved') {
      // Broadcast in-portal notification to students
      if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
      DB.inPortalNotifications.unshift({
        id: `notif-${Date.now().toString(36)}`,
        recipientId: 'usr-student-01',
        senderId: 'usr-academy-01',
        title: `Campus Masterclass Approved: ${wsp ? wsp.title : 'Industry Workshop'}`,
        message: `${wsp ? wsp.speakerName : 'Expert'} (${wsp ? wsp.hostCompanyName : 'Industry Partner'}) will lead an exclusive live session. Reserve your seat now!`,
        actionUrl: '/student.html#workshops',
        category: 'system_alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: `Workshop proposal ${decision.toLowerCase()} successfully!`,
      workshop: wsp
    });
  } catch (err) {
    console.error('[Workshop Decision Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/academy/mou/negotiate (Log bilateral term revision)
router.post('/mou/negotiate', async (req, res) => {
  try {
    const { mouId, clauseTitle, proposedChange, proposedBy = 'University Dean' } = req.body || {};

    if (!clauseTitle || !proposedChange) {
      return res.status(400).json({ success: false, error: 'Clause title and proposed change are required.' });
    }

    const mous = DB.mouPartnerships || DB.mou_partnerships || [];
    const mou = mous.find(m => m.id === mouId);

    if (mou) {
      if (!mou.negotiationHistory) mou.negotiationHistory = [];
      mou.negotiationHistory.unshift({
        clauseTitle,
        proposedChange,
        proposedBy,
        timestamp: new Date().toISOString(),
        status: 'Under Review'
      });
      mou.status = 'In Negotiation';
    }

    // Notify Recruiter
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}`,
      recipientId: 'usr-industry-01',
      senderId: 'usr-academy-01',
      title: 'MoU Term Counter-Proposal',
      message: `${proposedBy || 'Academic Dean'} proposed a revision to Clause "${clauseTitle}".`,
      actionUrl: '/industry.html#mous',
      category: 'system_alert',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Clause amendment submitted to corporate partner.',
      mou
    });
  } catch (err) {
    console.error('[MoU Negotiate Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

