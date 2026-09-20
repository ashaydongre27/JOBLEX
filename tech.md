# JOBLEX Technical Architecture & System Specifications
---

## 1. System Architecture Overview

JOBLEX is designed with a resilient, multi-tier architecture engineered for high availability, 1-click evaluation readiness, and seamless scalability across academic institutions and pharmaceutical/ayurvedic industries.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────┐  │
│  │ Pure HTML5/CSS3/ES6+ Portals    │   │ React 18 + Vite 5 SPA (src) │  │
│  │ (index, student, academy, etc.) │   │ (TailwindCSS, R3F, Motion)  │  │
│  └─────────────────────────────────┘   └─────────────────────────────┘  │
│         ▲ Three.js 3D Particle Starfield & Skill Constellation Canvas   │
└─────────┬───────────────────────────────────────────────────────────────┘
          │ REST API (JSON / Bearer JWT)
┌─────────▼───────────────────────────────────────────────────────────────┐
│                           API SERVICE TIER                              │
│  ┌───────────────────────────────────┐ ┌─────────────────────────────┐  │
│  │ Node.js / Express 5 (Primary)     │ │ Python Flask 3.0+ (Mirror)  │  │
│  │ backend/server.js (Modular routes)│ │ backend/app.py (Full parity)│  │
│  └───────────────────────────────────┘ └─────────────────────────────┘  │
│         ▲ Dual Backend Architecture — Run via run_all.bat or npm dev    │
└─────────┬───────────────────────────────────────────────┬───────────────┘
          │                                               │
┌─────────▼──────────────────────────┐  ┌─────────────────▼───────────────┐
│     DATA & AUTHENTICATION TIER     │  │     DOMAIN AI INTELLIGENCE      │
│  ┌───────────────────────────────┐ │  │  ┌────────────────────────────┐ │
│  │ Supabase (PostgreSQL + RLS)   │ │  │  │ AI Resume & Skill Analyzer │ │
│  │ @supabase/supabase-js         │ │  │  │ (Phytochemistry/GLP/HPTLC) │ │
│  └───────────────────────────────┘ │  │  └────────────────────────────┘ │
│  ┌───────────────────────────────┐ │  │  ┌────────────────────────────┐ │
│  │ Resilient In-Memory Fallback  │ │  │  │ Zulu AI Career Counselor   │ │
│  │ (4 pre-seeded demo personas)  │ │  │  │ (Context Guidance + Gemini)│ │
│  └───────────────────────────────┘ │  │  └────────────────────────────┘ │
│  ┌───────────────────────────────┐ │  │  ┌────────────────────────────┐ │
│  │ RBAC: student/academy/        │ │  │  │ NEP-2020 Syllabus Synthesizer│
│  │       industry/admin          │ │  │  │ (Industry Demand Matrix)   │ │
│  └───────────────────────────────┘ │  │  └────────────────────────────┘ │
└────────────────────────────────────┘  └─────────────────────────────────┘
```

---

## 2. Frontend Specifications

The platform provides a dual frontend structure accommodating both zero-build instant deployments and modular component-driven development:

* **Production & Demo Portals (Root Directory):**
  * **Technology:** Vanilla HTML5, Modern CSS3 (Glassmorphic design, custom variables), and ES6+ JavaScript.
  * **Portals:**
    * `index.html`: Central Landing Hub, 3D Hero canvas, live stats ticker, and Sector Gateways.
    * `auth.html`: 1-Click Judge Demo Persona Logins (Student, Academic Dean, Industry HR, Platform Admin) + Supabase Auth.
    * `student.html`: Interactive Gamified Career Roadmap with Anti-Decay protection, AI Resume Gap Analyzer, Quiz Arena, Micro-Gigs, and AIIA Verified Portfolio.
    * `academy.html`: Student Readiness Matrix, Syllabus Modernization Proposals (NEP-2020), Bilateral MoUs, and FDP Immersion Modules.
    * `industry.html`: Pre-screened Candidate Talent Search, Opportunity Publishing, and Real-time Skill Demand Transmission to Academic Councils.
* **Modern React SPA (`src/`):**
  * **Framework:** React 18 with Vite 5 and React Router DOM v6.
  * **Styling:** TailwindCSS v4 with hardware-accelerated animations.
  * **3D Visuals:** `@react-three/fiber`, `@react-three/drei`, and `three.js`.
* **3D Visuals & Graphics:**
  * Interactive 3D particle starfield rendered in real-time via WebGL (`js/three-scene.js`).
  * 2D Canvas Skill Constellation graph rendering interconnected domain competencies.
* **Bilingual Localization Engine (`js/api.js`):**
  * Live toggle between English and Hindi (हिन्दी) with persistent client-side state in `localStorage`.
* **Deployment Target:** Vercel edge hosting with automated zero-configuration routing (`vercel.json` cleanUrls).

---

## 3. Backend Specifications

JOBLEX features a **Dual-Runtime Backend** ensuring flexibility across both JavaScript and Python development environments:

### Primary Runtime: Node.js / Express
* **Framework:** Express 5 (`backend/server.js`).
* **Architecture:** Modular controller/route design in `backend/routes/`:
  * `auth.routes.js`: Multi-role registration, login, and demo personas.
  * `roadmap.routes.js`: Gamified roadmap milestones, anti-decay mechanics, and XP calculation.
  * `resume.routes.js`: Domain-specific AI skill gap analysis and scoring.
  * `opportunities.routes.js`: Internships, hackathons, and micro-gigs.
  * `zulu.routes.js`: Context-aware career counseling assistant.
  * `academy.routes.js`: MoUs, syllabus updates, consultancy grants, and faculty development programs.
  * `industry.routes.js`: Candidate shortlisting and skill demand dispatch.
* **Middleware:** Bearer JWT authentication and Role-Based Access Control (`backend/middleware/auth.middleware.js`).

### Secondary / Mirror Runtime: Python Flask
* **Framework:** Python 3.10+ with Flask 3.0+ (`backend/app.py`).
* **CORS Support:** `flask-cors` for cross-origin API access.
* **Parity:** Mirrors 100% of Node.js routes and seed state for single-file lightweight Python execution (`python backend/app.py`).

### 1-Click Platform Launcher:
* Windows launcher script (`run_all.bat`) launches the server on `http://localhost:5000` and automatically opens the browser.

---

## 4. Database & Authentication Architecture

### Supabase Cloud Integration
* **Database Engine:** Managed PostgreSQL.
* **Client Library:** `@supabase/supabase-js` configured via `backend/config/supabase.js`.
* **Schema Definition (`backend/data/supabase_schema.sql`):**
  * `public.profiles`: Stores user metadata, XP, streaks, verified skills, and institutional affiliations.
  * `public.user_role` ENUM: `student`, `academy`, `industry`, `admin`.
  * **Row-Level Security (RLS):** Authenticated read access with strict user-level update checks (`auth.uid() = id`).
  * **Automated Trigger (`handle_new_user`):** Automatically initializes a profile record upon Supabase Auth signup.

### Zero-Downtime In-Memory Fallback (Judge Demo Mode)
* Both backends feature a built-in mock database (`backend/data/database.js` / `backend/app.py:DB`) containing pre-seeded personas:
  * **Student:** Ashay Verma (All India Institute of Ayurveda, 1450 XP, 7-Day Streak)
  * **Academy Dean:** Dr. Sunita Sharma (Dean of Academic Affairs, AIIA)
  * **Industry HR:** Rajesh Malhotra (Head of Talent Acquisition, Dabur R&D)
  * **Platform Admin:** Dr. Rajesh Kotecha (Central Nodal Officer, Ministry of Ayush)
* Guarantees uninterrupted demonstration and testing even when offline or when external Supabase credentials are not configured.

---

## 5. Domain AI & Intelligence Engines

The AI architecture is tailored specifically to Problem Statement 26044 (Ayush Academia-Industry synergy):

1. **AI Resume & Skill Gap Analyzer (`/api/resume/analyze`):**
   * Benchmarks candidate credentials against live pharmaceutical standards (Good Laboratory Practice, HPTLC Fingerprinting, Phytochemistry, Formulation Stability).
   * Identifies extracted vs. missing competencies, computes match percentages against industry benchmarks (85%+), and injects recommended remedial modules directly into the candidate's active roadmap.
2. **Zulu AI Career Counselor (`/api/zulu/chat`):**
   * Context-aware conversational AI specialized in traditional medicine careers, regulatory protocols, anti-decay gamification, and corporate MoUs.
   * Ready for hybrid cloud enhancement via Google AI Studio (`GEMINI_API_KEY` in `.env`).
3. **NEP-2020 AI Syllabus Synthesizer:**
   * Automatically aggregates industrial skill demands submitted by pharma partners and formulates accredited curriculum additions with practical credit values for academic councils.

---

## 6. Gamification & Innovation Features

* **Anti-Decay XP Preservation:** Inactivity protection mechanic freezing skill decay for 72 hours upon daily check-in or task completion.
* **Peer Benchmarking Engine:** Live comparison of student skill scores against institutional branch averages and placed peer cohorts.
* **Task-Based Micro-Internships / Paid Gigs:** 1-2 week remote deliverables (₹4,500 - ₹8,000 stipends) for rapid industrial experience.
* **Bilateral MoU Tracking:** Live monitoring of industry-academy MoUs, student allocations, and sponsored PG research grants.

---

## 7. Core REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/demo-users` | Retrieves pre-seeded 1-click login personas |
| `POST` | `/api/auth/login` | Authenticates user (Supabase JWT / Demo Token) |
| `POST` | `/api/auth/register` | Registers user with assigned role and institution |
| `GET` | `/api/roadmap` | Fetches student career roadmap, XP, and anti-decay status |
| `POST` | `/api/roadmap/toggle-task` | Toggles roadmap milestone task and recalculates XP |
| `POST` | `/api/roadmap/check-in` | Records daily check-in, increments streak, freezes decay |
| `POST` | `/api/resume/analyze` | AI analysis of resume text against industry role benchmark |
| `POST` | `/api/zulu/chat` | Queries Zulu AI Career Counselor |
| `GET` | `/api/opportunities` | Returns internships, hackathons, and job postings |
| `GET` | `/api/academy/all-data` | Returns MoUs, syllabus updates, grants, and FDP modules |
| `GET` | `/api/industry/all-data` | Returns candidates, opportunities, and talent pipelines |
| `POST` | `/api/industry/post-opportunity` | Posts new internship or research opening |
| `POST` | `/api/industry/submit-skill-demand` | Submits industry curriculum change request to academy |

---

## 8. Summary: Technology Stack & Provider Matrix

| Domain | Technology / Library | Provider / Project | Role in JOBLEX |
|---|---|---|---|
| **Frontend UI (Multi-Page)** | HTML5, CSS3, ES6+ JS | W3C Standard | Primary production portals with instant zero-build Vercel hosting |
| **Frontend UI (SPA)** | React 18, Vite 5, TailwindCSS 4 | Meta, Vite, Tailwind Labs | Modern component SPA in `src/` |
| **3D & Visualizations** | Three.js, React Three Fiber | Mr.doob, Poimandres | 3D particle starfield & skill constellation canvas |
| **Primary Backend API** | Node.js, Express 5, CORS | Node.js Foundation, OpenJS | Modular REST API server (`backend/server.js`) |
| **Secondary Backend API**| Python 3.10+, Flask 3.0+ | Pallets Projects | Python mirror REST API (`backend/app.py`) |
| **Database & Auth** | PostgreSQL, Supabase Auth | Supabase Inc. | Managed database with Row-Level Security & JWT authentication |
| **Offline Resilience** | In-Memory JSON State Store | Built-in | Pre-seeded 4-persona test accounts for offline judge evaluation |
| **Cloud AI (Optional)** | Google Gemini 2.5 / Flash | Google AI Studio | Optional cloud LLM integration for conversational counseling |
| **Deployment Platform** | Vercel Edge Network | Vercel Inc. | Global hosting via Git integration and `vercel.json` |
