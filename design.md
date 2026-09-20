# JOBLEX Design System & Architectural Specification

## 1. Design Philosophy & Aesthetic Core

JOBLEX is engineered around a **High-Tech Calm Editorial & Velvet Obsidian** visual design system. The user interface harmonizes rigorous academic authority with modern institutional fintech clarity, steering clear of generic SaaS tropes and flashy neon gradients in favor of earthy botanical tones, refined serif accents, and tactile surfaces.

### Core Tenets
1. **Dignified Institutional Authority**: Academic and statutory institutions require trust, gravitas, and legibility. Visual depth is established through micro-borders and subtle contrast rather than gratuitous drop shadows or cartoonish badges.
2. **Tactile Precision & Bento Density**: Complex data layers (skill vectors, accreditation gaps, bilateral MoUs, and career roadmaps) are organized into structured Bento modules with strict geometric rhythm and proportional padding.
3. **Dual Atmosphere (Calm Warm Mineral & Velvet Obsidian)**:
   - **Light Mode**: Warm Bone (`#FAF8F5`) and Soft Mineral paper tones, inspired by classical research papers and clinical journals.
   - **Dark Mode**: Blackish Velvet Obsidian (`#070709`) and Soot surfaces (`#101115`), paired with desaturated botanical glows that prevent eye fatigue during prolonged analytical sessions.
4. **Typographic Hierarchy**: Distinctive pairing of modern geometric sans-serif for UI clarity, paired with classical serif italics for editorial nuance and monospaced fonts for telemetry and data arrays.

---

## 2. Color Palette & Token System

### 2.1 Surfaces & Neutrals

| Token Name | Light Mode Value | Dark Mode Value | Usage Context |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#FAF8F5` (Warm Bone) | `#070709` (Obsidian Soot) | Main document canvas, page background |
| `--bg-card` | `#FFFFFF` (Pure Mineral) | `#101115` (Deep Slate) | Bento cards, modal dialogs, primary containers |
| `--bg-card-hover` | `#FCFBF9` | `#14161B` | Hover state for interactive container cards |
| `--bg-subtle` | `#F3F1EA` (Warm Gray) | `#16181D` | Secondary wells, disabled fields, inner wells |
| `--bg-elevated` | `#FFFFFF` | `#16181E` | Dropdowns, popovers, floating headers |
| `--border-card` | `#E7E4DC` (Warm Stone) | `rgba(255,255,255, 0.075)` | 1px hairline perimeter borders |
| `--border-subtle` | `rgba(28,25,23, 0.07)` | `rgba(255,255,255, 0.05)` | Internal dividers, grid rules |
| `--border-focus` | `#2D5542` (Sage) | `rgba(255,255,255, 0.25)` | Form control focus rings, active states |

### 2.2 Typographic Tones

| Token Name | Light Mode Value | Dark Mode Value | WCAG Contrast Ratio |
| :--- | :--- | :--- | :--- |
| `--text-main` | `#1C1917` (Deep Charcoal) | `#F4F4F6` (Zinc White) | ≥ 12.5:1 (AAA Compliant) |
| `--text-muted` | `#6E6962` (Natural Stone) | `#8E929B` (Muted Slate) | ≥ 5.2:1 (AA Compliant) |
| `--text-dim` | `#9E9991` (Mineral Fog) | `#545763` (Dark Pewter) | Metadata, timestamp captions |

### 2.3 Domain Accents (Natural Botanical Spectrum)

Unlike generic neon tech palettes, JOBLEX uses nature-derived accents reflective of academic research and botanical sciences:

| Accent Family | Light Mode | Dark Mode Glow | Purpose & Semantic Role |
| :--- | :--- | :--- | :--- |
| **Botanical Sage** | `#2D5542` / Bg `#EEF4F0` | `#4EBA87` / Bg `rgba(78,186,135,0.12)` | Primary system actions, academic accreditation, positive matches |
| **Warm Terracotta** | `#944C23` / Bg `#FAF2ED` | `#E07A48` / Bg `rgba(224,122,72,0.12)` | Skill decay warnings, urgent interventions, corporate partner tier |
| **Institutional Ochre** | `#855828` / Bg `#FAF6EF` | `#D4973B` / Bg `rgba(212,151,59,0.12)` | XP progress, curriculum modernizations, R&D grants |
| **Charcoal Slate** | `#374151` / Bg `#F2F0E8` | `#94A3B8` / Bg `rgba(255,255,255,0.05)` | Structural tags, neutral indicators, protocol badges |

---

## 3. Typographic System

### 3.1 Font Stack
- **Primary Interface Font**: `Plus Jakarta Sans` (300, 400, 500, 600, 700, 800)  
  *Crisp geometric proportions optimized for high-density dashboards and data tables.*
- **Editorial Accent Font**: `Newsreader` (Georgia / Serif fallback, 400 italic, 500 italic)  
  *Adds warmth, prestige, and institutional authority to headline accents.*
- **Technical & Numeric Font**: `JetBrains Mono` (400, 500, 600)  
  *Monospaced alignment for vector weights, match percentiles, HMAC hashes, and timestamps.*
- **Iconography System**: `Material Symbols Outlined` (variable weight 400, optical size 20–24px).

### 3.2 Typographic Hierarchy Matrix

| Level | Font Family | Size / Line Height | Tracking | Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Display (H1)** | Plus Jakarta Sans | 48–60px / 1.08 | -0.025em | 700 Bold (Serif Italics for key words) |
| **Section Title (H2)**| Plus Jakarta Sans | 32–36px / 1.15 | -0.025em | 700 Bold |
| **Card Header (H3)** | Plus Jakarta Sans | 20–24px / 1.25 | -0.02em | 600 SemiBold / 700 Bold |
| **Body Primary** | Plus Jakarta Sans | 16px / 1.6 | 0 | 400 Regular (max width: 65–75ch) |
| **Body Secondary** | Plus Jakarta Sans | 14px / 1.5 | 0 | 400 Regular / 500 Medium |
| **Pills & Badges** | Plus Jakarta Sans | 11–12px / 1.0 | +0.02em | 600 SemiBold (Single-line, nowrap) |
| **Data / Hash (Mono)**| JetBrains Mono | 12–13px / 1.4 | 0 | 500 Medium |

---

## 4. Structural Grid & Spacing Rules

### 4.1 Padding Mathematics
- **Container Outer Padding**: Minimum 16px on mobile (`px-4`), 24px on tablet (`px-6`), and 32px on desktop (`px-8`).
- **Bento Card Padding**: Minimum 24px (`p-6`) to 32px (`p-8`). Outer container padding always equals or exceeds inner child gap spacing.
- **Button Padding**: Horizontal padding is strictly double vertical padding (e.g., `px-6 py-3` or `px-4 py-2`).

### 4.2 Mathematical Corner Radii
- Standard Cards (`.portal-card`, `.bento-card`): `16px` (`rounded-2xl`).
- Nested Child Items inside Cards: `12px` (`rounded-xl`).
- Buttons & Input Controls: `12px` (`rounded-xl`).
- Tags & Status Pills: `9999px` (`rounded-full`).

---

## 5. Component Library & Visual Archetypes

### 5.1 Bento Showcase Cards (`.bento-card`)
- **Structure**: Light background with 1px border line (`var(--border-card)`), 16px blur backdrop filter, and very soft ambient occlusion.
- **Interaction**: Subtle elevation lift (`translate-y-[-2px]`) and border focus shift on hover.
- **Header**: Top-level icon accompanied by an uppercase semantic chip (`tech-pill`).

### 5.2 Tactile Buttons
- **Primary Shimmer Button**:
  - Light mode: Deep Charcoal (`#1C1917`), white text, crisp 12px corners, shadow-xs.
  - Dark mode: Clean Zinc (`#F4F4F6`), dark text (`#0C0D10`).
  - Active: Micro scale down (`active:scale-[0.98]`).
- **Secondary Outlined Button**:
  - Surface border (`var(--border-card)`), transparent or subtle surface fill, responsive hover state.

### 5.3 Live Telemetry Ribbon
- Monospaced and bold display counters highlighting platform telemetry (verified skill dossiers, corporate partners, disbursed R&D grants, OBE curriculum alignment).
- Real-time animated number counters initialized with smooth ease-out transitions.

### 5.4 3D Ambient Environment
- Lightweight three-dimensional starfield canvas (`#three-canvas-container`) rendered behind content with interactive mouse parallax.
- Ambient radial blur gradients (`.ambient-glow-orb-1`, `.ambient-glow-orb-2`) creating gentle organic luminosity in both themes without causing visual clutter.

---

## 6. Portal Experience Architectures

JOBLEX features three role-tailored dashboards united under the single design system:

```
                      JOBLEX UNIFIED DESIGN SYSTEM
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  STUDENT PORTAL            ACADEMY PORTAL            INDUSTRY PORTAL
  • 4-Phase Roadmap         • Curriculum Gap Radar    • Vector Talent Search
  • Anti-Decay XP Multiplier • NAAC / OBE Matrix       • Reverse Candidate Dossier
  • NLP Resume Diagnostic   • Bilateral MoU Ledger    • Live Requisition Manager
  • Zulu AI Counselor       • Placement Readiness     • Corporate Grant Tracker
```

### 6.1 Student Portal (`/student.html`)
- **Tone**: Encouraging, developmental, gamified yet academic.
- **Key Modules**: Phase-based progress roadmaps, skill decay protection timers, interactive quiz arena, verified portfolio showcase, and the Zulu AI career advisor.

### 6.2 Academy Portal (`/academy.html`)
- **Tone**: Analytical, statistical, regulatory.
- **Key Modules**: Syllabus modernization gap analysis, NAAC / NBA criteria alignment indicators, peer benchmarking percentiles, and university MoU management.

### 6.3 Industry Portal (`/industry.html`)
- **Tone**: High-velocity, data-dense, executive.
- **Key Modules**: Multidimensional candidate vector matching, requisition posting pipeline, anonymized talent shortlists, and bilateral R&D grant disbursement trackers.

---

## 7. Accessibility & Engineering Quality Standards

- **Contrast Ratios**: All primary text satisfies WCAG AAA (≥ 12.5:1), and secondary/body text satisfies WCAG AA (≥ 4.5:1).
- **Responsive Layout**: Fluid breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`) with maximum content constraint of `max-w-7xl mx-auto`.
- **Keyboard & Focus States**: Visible, high-contrast focus rings (`--border-focus`) on all interactive buttons, tabs, inputs, and role toggles.
- **No Text Wrapping Defects**: Status pills, tags, chips, and button labels are styled with `whitespace-nowrap` to prevent awkward typography breaks.
- **Resilient Offline Fallbacks**: Graceful UI states when backend connections or third-party AI keys are unconfigured.
