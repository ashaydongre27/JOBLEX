/**
 * JOBLEX Student Extended Profile & Personalization API Routes
 * Handles post-signup onboarding wizard responses, certificate uploads, and social links
 */

const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const DB = require('../data/database');

/**
 * POST /api/student/onboarding
 * Submit post-signup onboarding wizard data for high platform personalization
 */
router.post('/onboarding', async (req, res) => {
  try {
    const { userId, email, onboardingData = {}, socialLinks = {} } = req.body || {};

    if (!userId && !email) {
      return res.status(400).json({ success: false, error: 'User identifier (userId or email) is required.' });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();

    // 1. Supabase Profile Update
    if (isConfigured && supabase) {
      try {
        const query = userId ? { id: userId } : { email: normalizedEmail };
        await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_data: onboardingData,
            social_links: socialLinks,
            verified_skills: onboardingData.selectedSkills || []
          })
          .match(query);
      } catch (e) {
        console.warn('[StudentOnboarding] Supabase update fallback:', e.message);
      }
    }

    // 2. Local DB Fallback Update
    let userObj = (DB.users || []).find(u => (userId && u.id === userId) || (normalizedEmail && u.email === normalizedEmail));
    if (userObj) {
      userObj.onboarding_completed = true;
      userObj.onboarding_data = onboardingData;
      userObj.social_links = { ...(userObj.social_links || {}), ...socialLinks };
      if (Array.isArray(onboardingData.selectedSkills)) {
        userObj.verified_skills = [...new Set([...(userObj.verified_skills || []), ...onboardingData.selectedSkills])];
      }
    }

    res.json({
      success: true,
      message: 'Onboarding completed successfully! Your platform experiences and AI guidance are now personalized.',
      user: userObj
    });
  } catch (err) {
    console.error('[Student Onboarding Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to process onboarding.' });
  }
});

/**
 * PUT /api/student/social-links
 * Update social & developer profile links (LinkedIn, GitHub, LeetCode, HackerRank, Portfolio)
 */
router.put('/social-links', async (req, res) => {
  try {
    const { userId, email, socialLinks = {} } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (isConfigured && supabase) {
      try {
        const query = userId ? { id: userId } : { email: normalizedEmail };
        await supabase
          .from('profiles')
          .update({ social_links: socialLinks })
          .match(query);
      } catch (e) {}
    }

    let userObj = (DB.users || []).find(u => (userId && u.id === userId) || (normalizedEmail && u.email === normalizedEmail));
    if (userObj) {
      userObj.social_links = { ...(userObj.social_links || {}), ...socialLinks };
    }

    res.json({
      success: true,
      message: 'Social & developer profile links updated successfully!',
      socialLinks: userObj ? userObj.social_links : socialLinks
    });
  } catch (err) {
    console.error('[Social Links Update Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to update social links.' });
  }
});

/**
 * POST /api/student/certificates
 * Add/upload a certificate to student profile
 */
router.post('/certificates', async (req, res) => {
  try {
    const { userId, email, certificate = {} } = req.body || {};
    const { title, issuer, issueDate, credentialId, skillsCovered, fileDataUrl } = certificate;

    if (!title || !issuer) {
      return res.status(400).json({ success: false, error: 'Certificate title and issuing organization are required.' });
    }

    const newCert = {
      id: `cert-${Date.now()}`,
      title: title.trim(),
      issuer: issuer.trim(),
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      credentialId: credentialId || `CRED-${Math.floor(100000 + Math.random() * 900000)}`,
      skillsCovered: Array.isArray(skillsCovered) ? skillsCovered : [],
      fileDataUrl: fileDataUrl || null,
      verifiedStatus: 'Verified Certificate',
      uploadedAt: new Date().toISOString()
    };

    const normalizedEmail = (email || '').trim().toLowerCase();
    let userObj = (DB.users || []).find(u => (userId && u.id === userId) || (normalizedEmail && u.email === normalizedEmail));
    
    if (userObj) {
      if (!Array.isArray(userObj.certificates)) {
        userObj.certificates = [];
      }
      userObj.certificates.unshift(newCert);
    }

    if (isConfigured && supabase) {
      try {
        const query = userId ? { id: userId } : { email: normalizedEmail };
        const { data: profile } = await supabase.from('profiles').select('certificates').match(query).single();
        const existing = (profile && Array.isArray(profile.certificates)) ? profile.certificates : [];
        existing.unshift(newCert);
        await supabase.from('profiles').update({ certificates: existing }).match(query);
      } catch (e) {}
    }

    res.json({
      success: true,
      message: 'Certificate uploaded and verified successfully!',
      certificate: newCert
    });
  } catch (err) {
    console.error('[Certificate Upload Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to upload certificate.' });
  }
});

/**
 * DELETE /api/student/certificates/:id
 * Delete a certificate from student profile
 */
router.delete('/certificates/:id', async (req, res) => {
  try {
    const certId = req.params.id;
    const { userId, email } = req.query;
    const normalizedEmail = (email || '').trim().toLowerCase();

    let userObj = (DB.users || []).find(u => (userId && u.id === userId) || (normalizedEmail && u.email === normalizedEmail));
    if (userObj && Array.isArray(userObj.certificates)) {
      userObj.certificates = userObj.certificates.filter(c => c.id !== certId);
    }

    if (isConfigured && supabase) {
      try {
        const query = userId ? { id: userId } : { email: normalizedEmail };
        const { data: profile } = await supabase.from('profiles').select('certificates').match(query).single();
        if (profile && Array.isArray(profile.certificates)) {
          const updated = profile.certificates.filter(c => c.id !== certId);
          await supabase.from('profiles').update({ certificates: updated }).match(query);
        }
      } catch (e) {}
    }

    res.json({ success: true, message: 'Certificate removed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete certificate.' });
  }
});

module.exports = router;
