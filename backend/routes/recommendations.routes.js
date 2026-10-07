/**
 * JOBLEX Multi-Role Recommendation & Matching Routes (Node.js / Express)
 * Powered by Hybrid Cosine-Jaccard Skill Vector Similarity
 * Ministry of Ayush & Corporate Industry Partners | Problem Statement ID: 26044
 */

const express = require('express');
const router = express.Router();
const DB = require('../data/database');
const {
  recommendOpportunitiesForStudent,
  recommendCandidatesForOpportunity,
  recommendOpportunitiesForAcademician,
  computeInstitutionSkillGaps,
  ROLE_BENCHMARK_PROFILES
} = require('../services/matching.service');
const { supabase, isConfigured } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth.middleware');

async function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader) return next();
  try {
    const dummyRes = {
      status() { return { json() { next(); } }; },
      json() { next(); }
    };
    return authenticateToken(req, dummyRes, () => next());
  } catch (_) {
    return next();
  }
}

/**
 * GET /api/recommendations/student
 * Returns ranked opportunities with explainable breakdown for a student
 */
router.get(['/', '/student'], optionalAuthenticateToken, async (req, res) => {
  try {
    const {
      type = 'All',
      minMatch = 0,
      search = '',
      refresh = 'false',
      userId: queryUserId,
      targetRole = 'Herbal Formulation Scientist'
    } = req.query;

    const bypassCache = refresh === 'true' || refresh === true;

    const candidateEmail = (req.user?.email || (typeof queryUserId === 'string' && queryUserId.includes('@') ? queryUserId : '')).trim();
    const candidateId = req.user?.id || queryUserId || 'usr-student-01';
    const userId = candidateId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateId || '');

    let userProfile = null;
    let allOpps = [];

    // 1. Supabase Query if configured
    if (isConfigured && supabase) {
      try {
        let profileQuery = null;
        if (isUuid && candidateEmail) {
          profileQuery = supabase.from('profiles').select('*').or(`id.eq.${candidateId},email.ilike.${candidateEmail}`).limit(1);
        } else if (isUuid) {
          profileQuery = supabase.from('profiles').select('*').eq('id', candidateId).limit(1);
        } else if (candidateEmail) {
          profileQuery = supabase.from('profiles').select('*').ilike('email', candidateEmail).limit(1);
        }

        const queries = [
          profileQuery ? profileQuery : Promise.resolve({ data: null, error: null }),
          supabase.from('opportunities').select('*')
        ];

        const [{ data: users, error: userError }, { data: opps, error: oppError }] = await Promise.all(queries);
        if (!userError && Array.isArray(users) && users.length > 0) {
          userProfile = users[0];
        }
        if (!oppError && Array.isArray(opps)) {
          allOpps = opps;
        }
      } catch (sbErr) {
        console.warn('[Recommendations] Supabase query warning:', sbErr.message);
      }
    }

    // 2. Local DB Store Fallback
    if (!userProfile) {
      const searchId = String(candidateId || '').toLowerCase();
      const searchEmail = String(candidateEmail || '').toLowerCase();
      userProfile = (DB.users || []).find(u =>
        (searchId && u.id && String(u.id).toLowerCase() === searchId) ||
        (searchEmail && u.email && String(u.email).toLowerCase() === searchEmail)
      );
      if (!userProfile) {
        userProfile = (DB.candidates || []).find(c =>
          (searchId && c.id && String(c.id).toLowerCase() === searchId) ||
          (searchEmail && c.email && String(c.email).toLowerCase() === searchEmail)
        );
      }
    }

    const studentProfile = userProfile ? { ...userProfile } : {
      id: userId,
      name: req.user?.name || userId,
      email: req.user?.email || userId,
      targetRole
    };

    // 3. Dynamic Skill Vector Alignment
    const verified = Array.isArray(studentProfile.verified_skills) ? studentProfile.verified_skills : [];
    const skills = Array.isArray(studentProfile.skills) ? studentProfile.skills : [];
    const profileJsonSkills = Array.isArray(studentProfile.student_profile?.skills)
      ? studentProfile.student_profile.skills
      : (Array.isArray(studentProfile.student_profile?.verifiedSkills) ? studentProfile.student_profile.verifiedSkills : []);
    const extracted = Array.isArray(studentProfile.extractedSkills) ? studentProfile.extractedSkills : [];

    const mergedSkills = Array.from(new Set([...verified, ...skills, ...profileJsonSkills, ...extracted].filter(Boolean)));
    studentProfile.verified_skills = mergedSkills;

    // 4. Combined Opportunities with deduplication by ID
    const oppMap = new Map();
    (DB.opportunities || []).forEach(opp => { if (opp && opp.id) oppMap.set(opp.id, opp); });
    (allOpps || []).forEach(opp => { if (opp && opp.id) oppMap.set(opp.id, { ...(oppMap.get(opp.id) || {}), ...opp }); });
    const combinedOpps = Array.from(oppMap.values());

    const recommended = recommendOpportunitiesForStudent(studentProfile, combinedOpps, {
      type,
      minMatch: parseInt(minMatch, 10) || 0,
      search,
      bypassCache,
      userId: studentProfile.id || userId
    });

    // Curated learning pathways based on target role
    const roleConfig = ROLE_BENCHMARK_PROFILES[targetRole] || ROLE_BENCHMARK_PROFILES["Herbal Formulation Scientist"];
    const recommendedCourses = roleConfig ? roleConfig.recommendedCourses : [];

    return res.json({
      success: true,
      totalCount: recommended.length,
      targetRole: studentProfile.targetRole || targetRole,
      recommendations: recommended.map(opp => ({
        ...opp,
        isWishlisted: false
      })),
      recommendedCourses,
      wishlistCount: 0,
      cached: !bypassCache
    });
  } catch (err) {
    console.error('[Recommendations Student Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to compute student recommendations.' });
  }
});

/**
 * GET /api/recommendations/industry
 * Recommends and ranks candidate scholars for an opportunity or job requisition
 */
router.get('/industry', authenticateToken, async (req, res) => {
  try {
    if (!['industry', 'admin'].includes((req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Industry role required.' });
    }
    const { opportunityId, roleTitle } = req.query;

    let targetOpp = null;
    if (opportunityId) {
      targetOpp = (DB.opportunities || []).find(o => o.id === opportunityId);
      if (!targetOpp && isConfigured && supabase) {
        try {
          const { data: sbOpp } = await supabase.from('opportunities').select('*').eq('id', opportunityId).maybeSingle();
          if (sbOpp) targetOpp = sbOpp;
        } catch (e) {
          console.warn('[Recommendations Industry] Supabase opp query:', e.message);
        }
      }
    }

    if (!targetOpp) {
      targetOpp = {
        id: 'opp-dynamic',
        title: roleTitle || 'Herbal Formulation Scientist',
        skills: ['Herbal Formulation', 'Ayurvedic Pharmacognosy', 'HPTLC Fingerprinting', 'Good Laboratory Practice (GLP)', 'Python']
      };
    }

    // Merge candidates across DB.candidates, DB.users (student), and Supabase profiles
    const candidateMap = new Map();
    (DB.candidates || []).forEach(c => { if (c && (c.id || c.email)) candidateMap.set(c.id || c.email, c); });
    (DB.users || []).filter(u => u.role === 'student').forEach(u => {
      const key = u.id || u.email;
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          id: u.id,
          name: u.name,
          email: u.email,
          skills: u.verified_skills || u.skills || [],
          institution: u.institution,
          department: u.department
        });
      }
    });

    if (isConfigured && supabase) {
      try {
        const { data: sbStudents } = await supabase.from('profiles').select('*').eq('role', 'student');
        if (Array.isArray(sbStudents)) {
          sbStudents.forEach(s => {
            const key = s.id || s.email;
            const existing = candidateMap.get(key) || {};
            candidateMap.set(key, {
              ...existing,
              id: s.id || existing.id,
              name: s.name || existing.name,
              email: s.email || existing.email,
              skills: Array.from(new Set([...(existing.skills || []), ...(s.verified_skills || []), ...(s.skills || [])])),
              institution: s.institution || existing.institution,
              department: s.department || existing.department
            });
          });
        }
      } catch (e) {
        console.warn('[Recommendations Industry] Supabase candidates query:', e.message);
      }
    }

    const candidates = Array.from(candidateMap.values());
    const rankedCandidates = recommendCandidatesForOpportunity(targetOpp, candidates);

    return res.json({
      success: true,
      opportunityId: targetOpp.id,
      opportunityTitle: targetOpp.title,
      requiredSkills: targetOpp.skills || [],
      totalCandidates: rankedCandidates.length,
      candidates: rankedCandidates
    });
  } catch (err) {
    console.error('[Recommendations Industry Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to rank candidates for opportunity.' });
  }
});

/**
 * GET /api/recommendations/academician
 * Recommends FDPs, research grants, and student mentees for faculty
 */
router.get('/academician', authenticateToken, async (req, res) => {
  try {
    if (!['academy', 'academician', 'faculty', 'admin'].includes((req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Academy role required.' });
    }
    const facultyId = req.user?.id || req.user?.email;

    const faculty = (DB.users || []).find(u => u.id === facultyId || u.role === 'academy') || {
      name: 'Dr. Rajesh Sharma',
      expertise: ['Ayurvedic Pharmacognosy', 'Herbal Formulation', 'HPTLC Fingerprinting', 'GLP Compliance'],
      department: 'Dravyaguna & Ayurvedic Pharmacology'
    };

    const facultyOpps = DB.facultyOpportunities || [];
    const scoredOpps = recommendOpportunitiesForAcademician(faculty, facultyOpps);

    // Recommend top students for faculty research mentorship
    const students = (DB.candidates || []).map(cand => {
      const skills = cand.skills || cand.verified_skills || [];
      const overlap = skills.filter(s => 
        (faculty.expertise || []).some(exp => exp.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(exp.toLowerCase()))
      );
      const compatibility = Math.min(98, 70 + (overlap.length * 9));
      return {
        ...cand,
        compatibilityScore: compatibility,
        matchingAreas: overlap,
        recommendedFor: overlap.includes('HPTLC Fingerprinting') ? 'Lab Research Assistant' : 'Syllabus Micro-Sprint Scholar'
      };
    }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.json({
      success: true,
      facultyName: faculty.name,
      department: faculty.department,
      opportunities: scoredOpps,
      mentorshipScholars: students.slice(0, 5)
    });
  } catch (err) {
    console.error('[Recommendations Academician Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to compute academician recommendations.' });
  }
});

/**
 * GET /api/recommendations/institution
 * Analyzes systemic student skill gaps and recommends bilateral collaborations
 */
router.get('/institution', authenticateToken, async (req, res) => {
  try {
    if (!['academy', 'academician', 'faculty', 'admin'].includes((req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Academy role required.' });
    }
    const { targetRole = 'Herbal Formulation Scientist' } = req.query;
    const students = DB.candidates || [];

    const gapsDiagnostic = computeInstitutionSkillGaps(students, targetRole);

    // Recommended industry collaborations matching critical gaps
    const suggestedMoUs = [
      {
        partner: 'Dabur Research & Development Ltd.',
        synergyFocus: 'HPTLC & Spectrophotometry Automation Lab',
        readinessMatch: 92,
        potentialInternshipSeats: 25,
        targetGapAddressed: 'HPTLC Fingerprinting & Stability Protocols'
      },
      {
        partner: 'Himalaya Wellness Company Data Cell',
        synergyFocus: 'Computational In-Silico Molecular Docking Center of Excellence',
        readinessMatch: 88,
        potentialInternshipSeats: 18,
        targetGapAddressed: 'In-Silico Molecular Docking & Python Analytics'
      }
    ];

    return res.json({
      success: true,
      institution: 'All India Institute of Ayurveda (AIIA), New Delhi',
      gapsDiagnostic,
      suggestedMoUs
    });
  } catch (err) {
    console.error('[Recommendations Institution Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to compute institutional recommendations.' });
  }
});

/**
 * POST /api/recommendations/wishlist
 * Toggle wishlist bookmark on an opportunity
 */
router.post('/wishlist', authenticateToken, (req, res) => {
  try {
    if (!['student', 'admin'].includes((req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Student role required.' });
    }
    const { opportunityId } = req.body || {};
    const userId = req.user?.id || req.user?.email;

    if (!opportunityId) {
      return res.status(400).json({ success: false, error: 'Opportunity ID is required to update wishlist.' });
    }

    if (!DB.wishlists) DB.wishlists = {};
    if (!Array.isArray(DB.wishlists[userId])) DB.wishlists[userId] = [];

    const userWishlist = DB.wishlists[userId];
    const index = userWishlist.indexOf(opportunityId);
    let isWishlisted = false;

    if (index > -1) {
      userWishlist.splice(index, 1);
      isWishlisted = false;
    } else {
      userWishlist.push(opportunityId);
      isWishlisted = true;
    }

    return res.json({
      success: true,
      message: isWishlisted ? 'Opportunity saved to Wishlist!' : 'Opportunity removed from Wishlist.',
      opportunityId,
      isWishlisted,
      totalWishlisted: userWishlist.length,
      wishlist: userWishlist
    });
  } catch (err) {
    console.error('[Wishlist Toggle Error]:', err);
    res.status(500).json({ success: false, error: 'Could not update wishlist.' });
  }
});

/**
 * GET /api/recommendations/wishlist
 * Fetch all wishlisted opportunities for the current student
 */
router.get('/wishlist', authenticateToken, (req, res) => {
  try {
    if (!['student', 'admin'].includes((req.user?.role || '').toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Student role required.' });
    }
    const userId = req.user?.id || req.user?.email;
    const ids = DB.wishlists?.[userId] || [];
    const allOpps = DB.opportunities || [];
    const wishlistedOpps = allOpps.filter(o => ids.includes(o.id));

    return res.json({
      success: true,
      totalCount: wishlistedOpps.length,
      wishlist: wishlistedOpps.map(o => ({ ...o, isWishlisted: true }))
    });
  } catch (err) {
    console.error('[Wishlist GET Error]:', err);
    res.status(500).json({ success: false, error: 'Could not retrieve wishlisted opportunities.' });
  }
});

module.exports = router;
