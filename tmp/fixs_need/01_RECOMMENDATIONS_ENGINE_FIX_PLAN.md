# Fix Plan 01: Multi-Role ID Resolution in Recommendations Engine

## 1. Problem Description & Weakpoint Analysis
- **Location**: `backend/routes/recommendations.routes.js`
- **Issue**:
  In `GET /api/recommendations/student`, the code attempts:
  ```javascript
  const userId = req.user?.id || req.user?.email;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
  const profileQuery = isUuid
    ? supabase.from('profiles').select('*').or(`id.eq.${userId},email.eq.${userId}`).limit(1)
    : supabase.from('profiles').select('*').eq('email', userId).limit(1);
  ```
  However, in fallback or demo sessions, `req.user.id` can be non-UUID strings like `usr-student-01` or `jwt-usr-...`. If `req.user.email` is not strictly matched or if Supabase is temporarily unreachable, the route returns HTTP 503 instead of utilizing the rich local `DB.users` and `DB.candidates` stores.
  Furthermore, `GET /api/recommendations/student` has `router.use(authenticateToken);` enforced at the top, but when prospective students view public previews or when sessions use demo tokens with varying case formats, recommendations can fail silently.

## 2. Potential Failure Scenarios
1. Student registers offline or in hybrid mode, `profiles` query fails or returns empty, causing recommendation match scores to fallback to empty `verified_skills: []` (0% match on all opportunities).
2. Industry recommendations route (`GET /api/recommendations/industry`) queries `DB.opportunities` directly, ignoring active opportunities saved in Supabase during runtime.

## 3. Step-by-Step Resolution Plan
1. **Fallback Resilience**:
   In `backend/routes/recommendations.routes.js`:
   - Query Supabase first, but if `users` is empty or query errors, immediately search `DB.users` by `req.user.id` or `req.user.email`.
   - Also combine `DB.opportunities` and Supabase `opportunities` with deduplication by ID so newly posted industry jobs are instantly recommended to students.
2. **Dynamic Skill Vector Alignment**:
   - Ensure `studentProfile.verified_skills` falls back to `studentProfile.skills` or `studentProfile.student_profile.skills` if `verified_skills` is empty, ensuring new on-boarded scholars get real match percentages right away.
3. **Verification**:
   - Test both authenticated and demo student accounts (`aarav.sharma@aiia.gov.in`, new student logins) and verify recommendation scores return between 60% and 98%.
