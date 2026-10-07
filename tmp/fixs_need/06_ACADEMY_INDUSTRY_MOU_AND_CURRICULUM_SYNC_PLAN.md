# Fix Plan 06: Cross-Portal Curriculum Modernization & MOU Workflow Integrity

## 1. Problem Description & Weakpoint Analysis
- **Location**: `backend/routes/academy.routes.js`, `src/academy/academy-curriculum.html`, and `src/industry/industry-mous.html`
- **Issue**:
  In `academy.routes.js`, academic deans review AI-audited curriculum modernizations, industry syllabus suggestions, and MOU partnerships.
  When an industry partner creates a new MoU or updates technology disclosures in `industry-mous.html`:
  - If the database table `mou_partnerships` has records where `academy_id` or `institution` does not match the active academy user's institution, the MoU may not show in the Academy Dean's active bilateral dashboard.
  - In `academy.routes.js`, several endpoints (`/mou/partner`, `/curriculum/suggestions`) use role verification, but fallback records in `DB.mou_partnerships` must remain synchronized whenever a new agreement is drafted in `industry.routes.js`.

## 2. Potential Failure Scenarios
1. Industry representative drafts an MoU in `industry-mous.html`; the academic dean in `academy-mous.html` sees an empty list due to institution name matching discrepancies (e.g. "AIIA" vs "All India Institute of Ayurveda").
2. Dean approves a curriculum suggestion, but the status is not reflected in the industry partner's feedback portal.

## 3. Step-by-Step Resolution Plan
1. **Fuzzy Institution & ID Matching for MoUs**:
   In `backend/routes/academy.routes.js` and `backend/routes/industry.routes.js`:
   - Implement normalized name and acronym matching (e.g., mapping `AIIA` $\leftrightarrow$ `All India Institute of Ayurveda`, `IIT` $\leftrightarrow$ `Indian Institute of Technology`).
2. **Bilateral State Sync**:
   - Ensure an update to an MoU status (`Draft` $\rightarrow$ `Under Review` $\rightarrow$ `Executed`) emits a bidirectional notification to both the Dean and the Industry Corporate Lead.
3. **Verification**:
   - Run simulated bilateral MoU creation from Industry $\rightarrow$ Dean approval in Academy $\rightarrow$ verify both portals display the updated active partnership badge.
