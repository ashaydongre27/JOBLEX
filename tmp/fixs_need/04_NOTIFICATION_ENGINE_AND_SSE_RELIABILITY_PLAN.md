# Fix Plan 04: Real-Time SSE Stream Fallback & Notification Reliability

## 1. Problem Description & Weakpoint Analysis
- **Location**: `backend/routes/notification.routes.js`
- **Issue**:
  In `notification.routes.js`, Server-Sent Events (SSE) connections are stored in an in-memory Map:
  ```javascript
  const sseClients = new Map();
  ```
  While effective for single-instance Node processes, in serverless environments (Vercel) or when client network disconnects, clients that fail to receive SSE broadcasts must rely on HTTP polling via `GET /api/notifications`.
  However, in `notification.routes.js`, recipient matching relies on:
  ```javascript
  const recipientIds = [req.user.id, req.user.email].filter(Boolean);
  ```
  If notifications are dispatched with case-sensitive email addresses (e.g., `Aarav.Sharma@AIIA.gov.in` vs `aarav.sharma@aiia.gov.in`), or when a recruiter notification uses role-based IDs (`usr-industry-01` vs corporate email), notifications can be orphaned or missed.

## 2. Potential Failure Scenarios
1. Industry recruiter submits an interview invitation, but student's email casing differs by a single character; the notification count indicator remains at 0 until manual reload.
2. In-portal alerts are not automatically marked as read when action URLs are clicked.

## 3. Step-by-Step Resolution Plan
1. **Case-Insensitive & Multi-Identifier Matching**:
   In `backend/routes/notification.routes.js`:
   - Normalize all `recipient_id` / `sender_id` searches to lowercase.
   - Include both `user.id`, `user.email`, and lowercase variations in query filters.
2. **Auto-Dismiss & Click-through Syncer**:
   In `js/frontend/notifications.js`:
   - When a user clicks on an action link in the notification panel, trigger an immediate asynchronous `PATCH /api/notifications/:id/read` to instantly decrement the badge counter.
3. **Verification**:
   - Run multi-account simulated notification exchanges and assert that the unread badge counter decrements smoothly across both light and dark themes.
