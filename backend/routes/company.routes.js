/**
 * JOBLEX Company Profiles & Tech Stack API Routes
 * Endpoints for company search, tech stack showcase, company details, and news/updates stream
 */

const express = require('express');
const router = express.Router();
const { supabase, isConfigured } = require('../config/supabase');
const DB = require('../data/database');

/**
 * GET /api/companies
 * Search and filter companies by name, tech stack, sector, or location
 */
router.get('/', async (req, res) => {
  try {
    const { q = '', tech = '', sector = '', location = '' } = req.query;
    const queryStr = (q || '').trim().toLowerCase();
    const techStr = (tech || '').trim().toLowerCase();
    const sectorStr = (sector || '').trim().toLowerCase();
    const locationStr = (location || '').trim().toLowerCase();

    let companies = [];

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          companies = data;
        }
      } catch (e) {
        console.warn('[CompanyRoutes] Supabase fetch fallback:', e.message);
      }
    }

    if (companies.length === 0) {
      companies = DB.companies || [];
    }

    // Apply Filters
    let filtered = companies.filter(c => {
      const matchQuery = !queryStr || 
        c.name.toLowerCase().includes(queryStr) || 
        c.tagline.toLowerCase().includes(queryStr) || 
        c.description.toLowerCase().includes(queryStr);

      const matchTech = !techStr || (Array.isArray(c.tech_stack) && c.tech_stack.some(t => t.toLowerCase().includes(techStr)));
      const matchSector = !sectorStr || (c.industry_sector && c.industry_sector.toLowerCase().includes(sectorStr));
      const matchLocation = !locationStr || (c.location && c.location.toLowerCase().includes(locationStr));

      return matchQuery && matchTech && matchSector && matchLocation;
    });

    res.json({
      success: true,
      count: filtered.length,
      companies: filtered
    });
  } catch (err) {
    console.error('[Company Search Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve companies.' });
  }
});

/**
 * GET /api/companies/:id
 * Get detailed company profile, tech stack, active opportunities, and recent updates
 */
router.get('/:id', async (req, res) => {
  try {
    const companyId = req.params.id;
    let company = null;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (!error && data) {
          company = data;
        }
      } catch (e) {}
    }

    if (!company) {
      company = (DB.companies || []).find(c => c.id === companyId || c.name.toLowerCase() === companyId.toLowerCase());
    }

    if (!company) {
      return res.status(404).json({ success: false, error: 'Company profile not found.' });
    }

    // Fetch related active opportunities
    const companyOpps = (DB.opportunities || []).filter(o => 
      o.company && o.company.toLowerCase().includes(company.name.toLowerCase())
    );

    // Fetch company updates
    const updates = (DB.companyUpdates || []).filter(u => u.companyId === company.id || u.companyName === company.name);

    res.json({
      success: true,
      company: {
        ...company,
        activeOpportunities: companyOpps,
        updates: updates
      }
    });
  } catch (err) {
    console.error('[Company Details Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve company details.' });
  }
});

/**
 * PUT /api/companies/:id
 * Update company profile & tech stack
 */
router.put('/:id', async (req, res) => {
  try {
    const companyId = req.params.id;
    const { name, tagline, logo, industry_sector, location, website, description, tech_stack } = req.body || {};

    let updated = null;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .upsert({
            id: companyId,
            name,
            tagline,
            logo,
            industry_sector,
            location,
            website,
            description,
            tech_stack: Array.isArray(tech_stack) ? tech_stack : []
          })
          .select()
          .single();

        if (!error && data) {
          updated = data;
        }
      } catch (e) {}
    }

    const idx = (DB.companies || []).findIndex(c => c.id === companyId);
    if (idx !== -1) {
      DB.companies[idx] = {
        ...DB.companies[idx],
        name: name || DB.companies[idx].name,
        tagline: tagline || DB.companies[idx].tagline,
        logo: logo || DB.companies[idx].logo,
        industry_sector: industry_sector || DB.companies[idx].industry_sector,
        location: location || DB.companies[idx].location,
        website: website || DB.companies[idx].website,
        description: description || DB.companies[idx].description,
        tech_stack: Array.isArray(tech_stack) ? tech_stack : DB.companies[idx].tech_stack
      };
      updated = DB.companies[idx];
    } else {
      const newComp = {
        id: companyId,
        name: name || 'Enterprise Partner',
        tagline: tagline || '',
        logo: logo || '🏢',
        industry_sector: industry_sector || 'Technology',
        location: location || 'India',
        website: website || '',
        description: description || '',
        tech_stack: Array.isArray(tech_stack) ? tech_stack : ['Python', 'JavaScript'],
        verified: true,
        created_at: new Date().toISOString()
      };
      DB.companies.push(newComp);
      updated = newComp;
    }

    res.json({ success: true, message: 'Company profile updated successfully!', company: updated });
  } catch (err) {
    console.error('[Company Update Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to update company profile.' });
  }
});

/**
 * GET /api/companies/:id/updates
 * Get news, announcements, and tech blogs published by a company
 */
router.get('/:id/updates', async (req, res) => {
  try {
    const companyId = req.params.id;
    const updates = (DB.companyUpdates || []).filter(u => u.companyId === companyId);
    res.json({ success: true, updates });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve updates.' });
  }
});

/**
 * POST /api/companies/:id/updates
 * Post a new company update/announcement
 */
router.post('/:id/updates', async (req, res) => {
  try {
    const companyId = req.params.id;
    const { title, content, category = 'Announcement', companyName = 'Company' } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required.' });
    }

    const newUpdate = {
      id: `cup-${Date.now()}`,
      companyId: companyId,
      companyName: companyName,
      title: title,
      content: content,
      category: category,
      created_at: new Date().toISOString()
    };

    DB.companyUpdates.unshift(newUpdate);

    res.json({ success: true, message: 'Update published successfully!', update: newUpdate });
  } catch (err) {
    console.error('[Post Update Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to post update.' });
  }
});

module.exports = router;
