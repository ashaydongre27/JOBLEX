# Fix Plan 02: Supabase Applications Schema & Runtime Column Drift Resilience

## 1. Problem Description & Weakpoint Analysis
- **Location**: `backend/routes/industry.routes.js` and `backend/routes/opportunities.routes.js`
- **Issue**:
  During live server interactions, Postgres Supabase tables (`applications`, `opportunities`, `in_portal_notifications`) frequently evolve.
  For example, earlier we identified error `PGRST204`:
  `"Could not find the 'interview_slot' column of 'applications' in the schema cache"`.
  A similar risk exists for `verified_badge`, `cover_note`, `applied_date` vs `appliedDate`, and camelCase vs snake_case fields.
  When an industry recruiter updates status, rejects, or schedules an interview, if the database schema lacks non-critical fields, the entire HTTP request could fail with HTTP 404 or 500 instead of updating the critical `status` column and dispatching real-time notifications.

## 2. Potential Failure Scenarios
1. Recruiter clicks "Reject", "Shortlist", or "Interview Scheduled" in `industry.html` or `industry-candidates.html`.
2. PostgREST rejects the update because an auxiliary column is not recognized in schema cache.
3. Candidate never receives notification or To-Do calendar alert.

## 3. Step-by-Step Resolution Plan
1. **Adaptive Payload Stripping in `industry.routes.js`**:
   - Implement an adaptive query updater:
     ```javascript
     async function safeUpdateApplication(id, payload) {
       // Try primary update with all fields
       let { data, error } = await supabase.from('applications').update(payload).eq('id', id).select().maybeSingle();
       if (error && error.code === 'PGRST204') {
         // Strip non-core columns and update essential fields: status, updated_at
         const corePayload = { status: payload.status };
         const retry = await supabase.from('applications').update(corePayload).eq('id', id).select().maybeSingle();
         return retry;
       }
       return { data, error };
     }
     ```
2. **Unified Data Normalizer**:
   - Ensure all returned application records provide both camelCase and snake_case properties (`studentName` & `student_name`, `opportunityTitle` & `opportunity_title`) so UI templates in `industry-ui.js` and `student-ui.js` never render `undefined`.
3. **Dual Store Sync**:
   - Whenever an application status changes in Supabase, update the in-memory `DB.applications` mirror synchronously to maintain 100% test suite and local session parity.
