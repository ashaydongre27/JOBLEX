# JOBLEX Project — Consolidated Rules & Governance
**Smart India Hackathon 2026 | Problem Statement ID: 26044**  
**Team: FOXTROT (Team ID: 168485)**  
**Last Updated:** 2026-10-02

> This document consolidates **every rule** enforced across the JOBLEX codebase.  
> Sources: `GEMINI.md`, `AGENTS.md`, `.agents/rules/`, global user rules, `Methodology.md`, `tech.md`, `.env.example`.

---

## Table of Contents

1. [Production Deployment Rules](#1-production-deployment-rules)
2. [Error Handling Rules](#2-error-handling-rules)
3. [Code Quality Rules](#3-code-quality-rules)
4. [Tech Stack Rules](#4-tech-stack-rules)
5. [Environment & Secrets Rules](#5-environment--secrets-rules)
6. [Git & Version Control Rules](#6-git--version-control-rules)
7. [Ponytail — Lazy Senior Dev Mode](#7-ponytail--lazy-senior-dev-mode)
8. [Code-Review-Graph MCP Tools](#8-code-review-graph-mcp-tools)
9. [RepoBrain Knowledge Hub](#9-repobrain-knowledge-hub)
10. [Architecture & Data Resilience Rules](#10-architecture--data-resilience-rules)
11. [Security Rules](#11-security-rules)
12. [Frontend & UI Rules](#12-frontend--ui-rules)
13. [Testing Rules](#13-testing-rules)
14. [Cross-Portal Synchronization Rules](#14-cross-portal-synchronization-rules)

---

## 1. Production Deployment Rules

**Source:** `GEMINI.md` — *"This is a Deployed Production Project"*

- **NEVER** use words like `demo`, `mock`, `fake`, `placeholder`, `dummy`, or `sample` in code, comments, UI text, or variable names.
- All data must come from real APIs and the Supabase database — never hardcode fake/demo data.
- All API keys and secrets must be stored in the `.env` file and accessed via `process.env` on the backend.
- Never commit real secrets to Git.
- Every feature must be fully functional end-to-end (frontend → API → database), not a stub.

---

## 2. Error Handling Rules

**Source:** `GEMINI.md` — *"Error Handling"*

- **NEVER** expose raw backend errors, stack traces, or technical error messages to the user.
- Always show user-friendly error messages in the UI (e.g., *"Something went wrong. Please try again."*).
- Log detailed errors server-side only (using `console.error`).
- Never write code that simply shows an `if/else` statement as a response to the user — always handle errors gracefully with proper UI feedback (toasts, inline messages, loading states).

---

## 3. Code Quality Rules

**Source:** `GEMINI.md` — *"Code Quality"*

- Think carefully before making any change — understand the impact on the full system before proceeding.
- Every feature must be fully functional end-to-end (frontend → API → database), not a stub.
- Use real API integrations (Supabase, Gemini AI, etc.) configured via `.env`.
- Maintain the `.env` file with all required environment variables, documented with comments.

---

## 4. Tech Stack Rules

**Source:** `GEMINI.md` — *"Tech Stack"* + `tech.md`

- **Frontend:** Vanilla HTML5, Tailwind CSS (CDN), vanilla JavaScript (ES6+ modules in `js/frontend/`).
- **Backend:** Node.js / Express (`backend/server.js`), route files in `backend/routes/`.
- **Database:** Supabase (PostgreSQL) configured in `backend/config/supabase.js`.
- **AI:** Google Gemini API for Zulu AI features, with NVIDIA NIM as optional multi-tier failover.
- **Dual-Runtime Architecture:** Primary runtime is Node.js/Express 5; secondary mirror runtime is Python Flask 3.0+.
- **Offline Resilience:** If Supabase drops, both backends instantly switch to in-memory database store (`backend/data/database.js`).

---

## 5. Environment & Secrets Rules

**Source:** `.env.example`, `GEMINI.md`

- All API keys stored exclusively in `.env`, accessed via `process.env` on the backend.
- `.env` must never be committed to Git (enforced by `.gitignore`).
- `.env.example` must document every required variable with comments.
- Required variable groups:
  - **Server:** `PORT`
  - **Google Gemini AI:** `GOOGLE_AI_STUDIO_MAIN`, `GOOGLE_AI_STUDIO_BACKUP`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and aliases.
  - **NVIDIA NIM:** `NVIDIA_API_KEY` (optional failover).
  - **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Git & Version Control Rules

**Source:** Global user rules

- **NEVER** push or commit any code to GitHub without explicit user consent.
- All changes must remain local unless the user explicitly asks and approves a push.
- Do NOT run `git commit` or `git push` autonomously.

---

## 7. Ponytail — Lazy Senior Dev Mode

**Source:** `.agents/rules/ponytail.md`, `GEMINI.md`, `AGENTS.md`

### Philosophy
You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.

### Decision Ladder
Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper, util, or pattern that's already here — don't re-write it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

The ladder runs **after** you understand the problem, not instead of it: read the task and the code it touches, trace the real flow end to end, then climb.

### Bug Fix Rule
Bug fix = root cause, not symptom. A report names a symptom. Grep every caller of the function you touch and fix the shared function once — one guard there is a smaller diff than one per caller, and patching only the path the ticket names leaves a sibling caller still broken.

### Hard Rules
- No abstractions that weren't explicitly requested.
- No new dependency if it can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem.
- Question complex requests: *"Do you actually need X, or does Y cover it?"*
- Pick the edge-case-correct option when two stdlib approaches are the same size — lazy means less code, not the flimsier algorithm.
- Mark deliberate simplifications that cut a real corner with a known ceiling (global lock, O(n²) scan, naive heuristic) with a `ponytail:` comment naming the ceiling and upgrade path.

### Never Lazy About
- Understanding the problem (read it fully and trace the real flow before picking a rung).
- Input validation at trust boundaries.
- Error handling that prevents data loss.
- Security.
- Accessibility.
- Hardware calibration (the platform is never the spec ideal — a clock drifts, a sensor reads off).
- Anything explicitly requested.

### Testing Rule
Lazy code without its check is unfinished: non-trivial logic leaves ONE runnable check behind — the smallest thing that fails if the logic breaks (an assert-based self-check or one small test file; no frameworks, no fixtures). Trivial one-liners need no test.

---

## 8. Code-Review-Graph MCP Tools

**Source:** `.agents/rules/code-review-graph.md`, `GEMINI.md`, `AGENTS.md`

### Core Mandate
This project has a knowledge graph. **Start with the code-review-graph MCP tools to narrow scope, then read the source.** The graph is cheaper than scanning files and gives you structural context (callers, dependents, test coverage) that file search cannot.

### When to Use Graph Tools FIRST
- **Exploring code:** `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep.
- **Understanding impact:** `get_impact_radius_tool` instead of manually tracing imports.
- **Code review:** `detect_changes_tool` + `get_review_context_tool` instead of reading entire files.
- **Finding relationships:** `query_graph_tool` with `callers_of` / `callees_of` / `imports_of` / `tests_for`.
- **Architecture questions:** `get_architecture_overview_tool` + `list_communities_tool`.

### Verification Rule
- Narrow scope with the graph, then read the source. **Do not change code from graph output alone.**
- For any non-trivial change, read the implementation and the relevant tests before concluding.
- Verify the exact source when touching behavior, database logic, migrations, retries, fallbacks, recovery, or compatibility code.
- When the graph and the source disagree, **the source wins**. The graph may be stale.
- An empty graph result can mean "not indexed" or "not statically visible", not "does not exist".

### Key Tools Reference

| Tool | Use when |
| :--- | :--- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow
1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

---

## 9. RepoBrain Knowledge Hub

**Source:** `.agents/rules/repobrain.md`, `GEMINI.md`, `AGENTS.md`

### Core Mandate
**MANDATORY.** When `.repobrain/` exists, any *broad* codebase question MUST go through `rb-ask` first.

Broad questions include: architecture, "where is X implemented", "how does X work", "what calls X", dependency or impact analysis, data flow, and onboarding.

```bash
rb-ask "<question>" --workspace .
```

### Hard Rule
Do NOT manually `grep`, `rg`, `find`, or fan out file reads to answer a broad question before you have run `rb-ask` for it. Doing so is wasteful and skips the grounded, cross-referenced answer the hub already has.

### Refresh Commands
```bash
# First-time generation
rb-refresh --workspace .

# After later commits (incremental)
rb-refresh --workspace . --quick
```

### Exceptions (when direct file reads are allowed)
- Verifying exact lines after `rb-ask` gives candidate files.
- Narrow symbol or single-string lookups (not broad exploration).
- Editing or debugging specific files you already located.
- Cases where `rb-ask` is genuinely unavailable or fails (state which).

---

## 10. Architecture & Data Resilience Rules

**Source:** `Methodology.md`, `tech.md`, `backend/server.js`

- **Supabase-First, Fallback-Always:** Every route that queries Supabase must gracefully fall back to the local in-memory `DB` object (`backend/data/database.js`) if Supabase is unreachable, returns an error, or returns empty data.
- **No HTTP 500 for data unavailability:** If the database table is empty or the connection is down, serve seed data from `DB` and return HTTP 200 — never crash with a raw 500.
- **Dual Backend Parity:** The Node.js Express backend and the Python Flask backend must expose identical API contracts and response schemas.
- **Pre-Seeded Fallback Personas:** The in-memory fallback always contains 4 verified personas: Student (Aarav Sharma), Academic Dean (Prof. R.K. Sharma), Industry HR (Corporate Talent Lead), and Platform Admin.
- **CORS & Security Middleware:** CORS must be enabled via `cors()` middleware. Sensitive paths (`.env`, `backend/`, `package.json`, `.git`) must be blocked from HTTP access.

---

## 11. Security Rules

**Source:** `Methodology.md` Phase 5, `backend/server.js`, `GEMINI.md`

- **Zero-Trust Credential Verification:** All certificates and badges use SHA-256 HMAC cryptographic signing.
- **Protected System Resources:** Direct HTTP access to `.env`, `backend/`, `package.json`, `package-lock.json`, `.git`, `.code-review-graph`, and `.agents` is blocked with 403 responses.
- **JWT Authentication:** All protected API routes require valid JWT tokens validated by `auth.middleware.js`.
- **Role-Based Access Control (RBAC):** Routes are guarded by `requireRole()` middleware ensuring only authorized roles (`student`, `academy`, `industry`) can access their respective endpoints.
- **No Secrets in Client Code:** API keys and service role keys must never appear in frontend JavaScript or HTML files.
- **Input Validation:** All trust boundary inputs (user-submitted forms, API request bodies) must be validated server-side before processing.

---

## 12. Frontend & UI Rules

**Source:** `GEMINI.md`, `tech.md`, portal HTML files

- **No CDN-Only Dependencies in Production:** Critical CSS/JS assets must have local fallback copies. CDNs are used with local fallback strategy.
- **Dark/Light Theme Support:** All pages must support `dark` class toggle on `<html>` via `theme.js`.
- **Consistent Design Language:** All portals use the JOBLEX editorial typography stack (Plus Jakarta Sans, Newsreader, JetBrains Mono) and the bone/obsidian/sage/terracotta color palette.
- **Responsive Design:** All pages must be mobile-first responsive with `lg:` breakpoint desktop layouts.
- **Material Symbols Outlined:** All icons use Google Material Symbols Outlined — no icon library mixing.
- **User-Friendly Feedback:** All user-facing actions must show toast notifications, loading states, or inline messages — never silent failures.
- **No Raw Technical Output:** Never display JSON responses, error codes, or stack traces in the UI.

---

## 13. Testing Rules

**Source:** `GEMINI.md`, `backend/tests/`

- **Test Suites Must Pass:** All existing test suites must pass before any PR or deployment:
  - `verify_resume_and_matching.js` — 7/7 E2E suites.
  - `verify_profile_and_companies.js` — Company profile and search tests.
  - `verify_onboarding_flow.js` — Student onboarding pipeline.
  - `verify_cross_portal_connectivity.js` — All portal health checks.
  - `audit_portal_handlers.js` — Zero missing `onclick`/`onsubmit` event handlers.
- **No Framework Test Dependencies:** Tests use Node.js `assert` module — no Jest, Mocha, or external test frameworks.
- **Ponytail Testing Rule:** Non-trivial logic leaves ONE runnable check behind. Trivial one-liners need no test.

---

## 14. Cross-Portal Synchronization Rules

**Source:** `tmp/plan/00_MASTER_SYNC_ARCHITECTURE_PLAN.md`, PPT presentation

- **Student ↔ Industry:** Actions taken in the Industry Portal (e.g., hiring exam assignment, application status change) must immediately reflect in the Student Portal (To-Do docket, notifications, Quiz Arena).
- **Industry ↔ Academy:** Corporate syllabus reviews and MoU proposals must be delivered in real-time to the Academy Portal's Board of Studies and MoU management interfaces.
- **Student ↔ Academy:** 1-on-1 guidance requests from students must appear in the Academy faculty mentor inbox, and confirmed sessions must sync back to the student's To-Do docket.
- **Unified Notification Dispatch:** All cross-portal events must fire notifications via the `JoblexNotifications` system so users are alerted in real-time regardless of which portal they are currently viewing.
- **Data Consistency:** All three portals must read from the same canonical data sources (Supabase tables or `DB` fallback) — no portal-specific data silos.

---

## Appendix: Rule Source Map

| Rule Category | Original Source Files |
| :--- | :--- |
| Production & Error Handling | `GEMINI.md` lines 1–14 |
| Code Quality & Tech Stack | `GEMINI.md` lines 16–28 |
| Ponytail (Lazy Dev) | `.agents/rules/ponytail.md`, `GEMINI.md` lines 77–107, `AGENTS.md` lines 48–78 |
| Code-Review-Graph | `.agents/rules/code-review-graph.md`, `GEMINI.md` lines 30–74, `AGENTS.md` lines 1–45 |
| RepoBrain | `.agents/rules/repobrain.md`, `GEMINI.md` lines 109–156, `AGENTS.md` lines 80–127 |
| Git Directives | Global user rules (`user_global`) |
| Architecture & Resilience | `Methodology.md`, `tech.md`, `backend/server.js` |
| Security | `Methodology.md` Phase 5, `backend/server.js` lines 102–110 |
| Environment Config | `.env.example` |
| Cross-Portal Sync | `tmp/plan/00_MASTER_SYNC_ARCHITECTURE_PLAN.md` |

---

*Consolidated: 2026-10-02 | All rules extracted from 9 source files across the JOBLEX repository.*
