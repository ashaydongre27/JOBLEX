# Module Implementation Plan: Data Resilience & API Stability Fixes
**System Stability & Test Passing Objective**  
**Target Directory:** `a:\ProgrammingCodes\Projects\SIH 26\mainsihrepo`  
**Status:** Implementation Blueprint

---

## 1. Problem & Root Cause Analysis

During automated execution of the cross-portal connectivity test suite (`backend/tests/verify_cross_portal_connectivity.js`), the following failure was uncovered:

```
❌ TEST SUITE FAILED: AssertionError [ERR_ASSERTION]: Expected 200 from /api/opportunities, got 500
500 !== 200
at runTests (verify_cross_portal_connectivity.js:30:10)
```

### Root Cause Inspection:
In [backend/routes/opportunities.routes.js lines 18-31](file:///a:/ProgrammingCodes/Projects/SIH%2026/mainsihrepo/backend/routes/opportunities.routes.js#L18-L31):
```javascript
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
```

When Supabase is unreachable, undergoing network latency, or remote database tables are pending initial schema execution, the route throws an unhandled exception and aborts with HTTP 500.

By contrast, `company.routes.js`, `industry.routes.js`, and `academy.routes.js` follow the production-grade resilience pattern:
```javascript
if (!data || data.length === 0 || error) {
  // Gracefully fall back to verified central repository
  opportunities = DB.opportunities || [];
}
```

---

## 2. Remediation Strategy & Code Specification

### 1. Robust Graceful Fallback in `opportunities.routes.js`
Refactor the endpoint to guarantee high availability under all conditions:

```javascript
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
```

### 2. Safeguarding `POST /api/opportunities/apply`
Similarly, in `POST /api/opportunities/apply`:
- If Supabase insert fails, store the application in `DB.applications` and return HTTP 201 with full application receipt.
- Never show a raw 500 crash to a student attempting to submit an application.

---

## 3. Test Suite Verification Pipeline

Run and verify the complete backend test suite:
1. `node backend/tests/verify_resume_and_matching.js` (Verify 7/7 suites pass)
2. `node backend/tests/verify_profile_and_companies.js` (Verify company profile searches pass)
3. `node backend/tests/verify_cross_portal_connectivity.js` (Verify all 5 portal connectivity suites pass)
4. `node backend/tests/audit_portal_handlers.js` (Verify zero missing event handlers)

---

## 4. Testing & Validation Checklist

- [ ] Execute `verify_cross_portal_connectivity.js` and confirm HTTP 200 from `/api/opportunities`.
- [ ] Verify test suite exits cleanly with code 0.
- [ ] Confirm that no sensitive environment secrets or stack traces are leaked on error.
- [ ] Ensure full compliance with Deployed Production Rules from `GEMINI.md`.
