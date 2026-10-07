# Fix Plan 07: Client-Side Token Expiration & Stale Session Auto-Recovery

## 1. Problem Description & Weakpoint Analysis
- **Location**: `js/frontend/api-client.js` and all portal HTML pages
- **Issue**:
  Currently, `JoblexApiClient.requireAuth()` checks:
  ```javascript
  const user = this.getCurrentUser();
  const hasToken = Boolean(typeof localStorage !== 'undefined' && localStorage.getItem('joblex_token'));
  ```
  If a token expires on the server (e.g. Supabase JWT expiration after 1 hour or invalid demo token), subsequent background API calls (`GET /api/notifications`, `GET /api/todos`) receive HTTP `401 Unauthorized`.
  If individual fetch calls do not intercept 401 errors globally, UI components may fail quietly or display infinite loading states instead of prompting a clean re-authentication or silent token refresh.

## 2. Potential Failure Scenarios
1. User leaves tab open overnight; morning session makes API calls that return 401; user sees broken empty widgets instead of a clean session renewal notice.
2. In-memory user state in `localStorage` has a role mismatch with the newly issued token.

## 3. Step-by-Step Resolution Plan
1. **Global 401 Interceptor in `api-client.js`**:
   - In `JoblexApiClient._parseFetch()`:
     ```javascript
     if (res.status === 401) {
       console.warn('[JoblexApiClient] Session expired or unauthorized (401).');
       // Auto-clear stale session and prompt re-auth modal without harsh page crash
       if (!window.location.pathname.includes('auth.html')) {
         this.showNoticeModal({
           badge: 'Session Expired',
           title: 'Please Sign In Again',
           message: 'Your active session has expired for security. Please sign in to resume.',
           confirmText: 'Sign In',
           onConfirm: () => { window.location.href = '/auth.html?redirect=' + encodeURIComponent(window.location.pathname); }
         });
       }
     }
     ```
2. **Graceful Token Refresh**:
   - For live Supabase sessions, invoke `supabase.auth.getSession()` or refresh token before dispatching API calls when token expiration is near.
3. **Verification**:
   - Simulate an expired token by altering `joblex_token` in `localStorage`; verify the clean re-auth modal activates rather than throwing console uncaught exceptions.
