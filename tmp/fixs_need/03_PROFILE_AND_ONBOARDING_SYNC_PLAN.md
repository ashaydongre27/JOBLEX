# Fix Plan 03: Profile Sync, Onboarding Consistency & Session State Harmonization

## 1. Problem Description & Weakpoint Analysis
- **Location**: `backend/routes/auth.routes.js`, `backend/routes/student.routes.js`, and `js/frontend/api-client.js`
- **Issue**:
  When a student completes the onboarding wizard in `/onboarding.html`, their detailed academic dossier (education, verified skills, career interests, semester/year) is submitted via `POST /api/user/onboarding`.
  However, in `backend/routes/auth.routes.js` (`GET /api/auth/profile` and `PUT /api/auth/profile`), the profile updater writes to `public.profiles`. If a student changes their name, institution, or avatar on `src/students/student-portfolio.html` or `student-resume.html`, the `student_profile` jsonb column can get out of sync with the root-level columns (`name`, `institution`, `department`).
  Additionally, in `auth-features.js`, after a user registers, if the network drops or local storage token is missing, the browser might route the user to `/auth.html` instead of resuming onboarding.

## 2. Potential Failure Scenarios
1. Student updates their name or college on the portfolio page; the overview dashboard (`student.html`) still displays their old name from the onboarding JSON blob.
2. Incomplete onboarding student directly navigates to `src/students/student-quiz.html` or other subpages. Some subpages had gating guards while others relied purely on `api-client.js` navigation helper.

## 3. Step-by-Step Resolution Plan
1. **Bidirectional Profile Reconciliation**:
   In `backend/routes/student.routes.js` and `backend/routes/auth.routes.js`:
   - When updating `public.profiles`, mirror changes into `student_profile` object:
     ```javascript
     if (updates.name) profile.student_profile = { ...(profile.student_profile || {}), fullName: updates.name };
     if (updates.institution) profile.student_profile = { ...(profile.student_profile || {}), college: updates.institution };
     ```
2. **Subpage Guard Standardization**:
   - Ensure the universal authentication check at the head of every subpage in `src/students/` runs the standardized onboarding gate:
     ```javascript
     const user = JoblexApiClient.getCurrentUser();
     if (user && user.role === 'student' && !(user.isOnboardingCompleted ?? user.onboarding_completed)) {
       window.location.replace('/onboarding');
     }
     ```
3. **Verification**:
   - Test end-to-end profile update: register $\rightarrow$ onboarding $\rightarrow$ edit portfolio $\rightarrow$ verify overview banner shows updated scholar name and department.
