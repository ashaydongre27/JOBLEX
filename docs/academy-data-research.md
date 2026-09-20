# Academy Data Research

**Research date:** 2026-09-10

## Evidence rule

A university notice proves that the institution published a notice. It does not, by itself, prove that funding was sanctioned, a consultancy contract was executed, an FDP was completed, or money was disbursed. JOBLEX should display those states separately and require the corresponding official evidence.

## Primary sources

- UGC Guidelines catalogue: https://www.ugc.gov.in/Guideline
- University of Delhi notice board: https://www.du.ac.in/index.php?page=notice-board-view-all
- University of Delhi FDP example: https://www.du.ac.in/index.php?mact=News,cntnt01,detail,0&cntnt01articleid=18275&cntnt01returnid=219
- University of Delhi research call example: https://www.du.ac.in/index.php?mact=News,cntnt01,detail,0&cntnt01articleid=18621&cntnt01returnid=219
- University of Delhi research call PDF: https://www.du.ac.in/uploads/2026/07082026-IOE-FRP%20(2026-2027).pdf
- University of Delhi guidelines and notifications: https://www.du.ac.in/index.php?page=guidelines-and-notifications
- University of Delhi rules and policies: https://www.du.ac.in/index.php?page=rules-and-policies

## Data model decisions

### Consultancy grants

Recommended evidence-backed lifecycle:

`draft` -> `call_published` -> `proposal_submitted` -> `under_review` -> `approved` -> `sanctioned` -> `agreement_executed` -> `active` -> `completed` -> `closed`

A grant should store its originating notification, official source page, document URL, publication date, deadline, and approval/sanction evidence separately. A published call must never be rendered as an awarded grant.

### Faculty development programmes

An FDP record should store its official title, organiser, mode, dates, registration deadline, source page, document URL, and announcement notification. Its lifecycle should distinguish `announced`, `registration_open`, `registration_closed`, `ongoing`, and `completed`.

### Notification linkage

Grant and FDP records should be visible as active opportunities only when they have a published institutional notification reference. Approval and completion should require their own official records. Notification references should preserve the exact official title, issuing authority, source URL, document URL, publication date, and verification timestamp.

## Implementation

`backend/data/migrations/20260910_academy_notification_links.sql` adds nullable evidence fields to the existing grant and FDP catalog tables. Existing rows are intentionally not backfilled: an academy administrator must add real notification references from official university records before those rows become publishable.
