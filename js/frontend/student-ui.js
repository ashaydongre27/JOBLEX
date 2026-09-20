/**
 * JOBLEX Student Portal UI Controller (Client-Side JavaScript)
 * Pure frontend DOM, rendering, and interaction logic
 * Features:
 * - Collapsible Sidebar (w-64 <-> w-20) with localStorage persistence
 * - Modular Navigation across dedicated student pages
 * - Separate Application pipelines for Internships & Full-Time Jobs linked to Industry Portal
 * - Gemini-style centered Zulu AI Counselor
 */

let roadmapState = null;
let currentXp = 0;
let currentStreak = 0;
let activeModule = 'Roadmap';

let quizState = { started: false, currentIndex: 0, selectedAnswer: null, answers: [], questions: [], finished: false, difficulty: 'mixed', prompt: '', attemptId: null, result: null, loading: false };

document.addEventListener('DOMContentLoaded', async () => {
  // Auth Guard: ensure user is authenticated before accessing student portal
  if (!JoblexApiClient.requireAuth('student')) return;

  initSidebarState();

  const user = JoblexApiClient.getCurrentUser();
  if (user) {
    document.querySelectorAll('.user-name-display').forEach(el => el.innerText = user.name || 'Scholar');
    document.querySelectorAll('.user-inst-display').forEach(el => el.innerText = user.institution || 'University / Collegiate Institute');
    document.querySelectorAll('.user-dept-display').forEach(el => el.innerText = user.department || user.year || 'Higher Education & Research');
    currentXp = (user.xp !== undefined && user.xp !== null) ? Number(user.xp) : 0;
    currentStreak = (user.streak !== undefined && user.streak !== null) ? Number(user.streak) : 0;
  } else {
    currentXp = 0;
    currentStreak = 0;
  }

  updateHeaderMetrics();
  await updateDashboardStats(user);

  // Page-specific initializations
  if (document.getElementById('roadmap-catalog-section') || document.getElementById('roadmap-cards-grid')) {
    initSectorRoadmaps();
  } else if (document.getElementById('roadmap-phases-container')) {
    roadmapState = await JoblexApiClient.getRoadmap();
    renderRoadmap();
  }

  if (document.getElementById('internships-container')) {
    renderInternshipsBoard('All');
  }

  if (document.getElementById('jobs-container')) {
    renderJobsBoard();
  }

  if (document.getElementById('peer-benchmarking-card')) {
    renderPeerBenchmarking();
  }

  if (document.getElementById('skill-tree-canvas')) {
    initSkillTree();
  }

  if (document.getElementById('zulu-sessions-list')) {
    initZuluChat();
  }

  if (document.getElementById('side-by-side-parsed-list') || document.getElementById('resume-dropzone')) {
    initResumeUploader();
  }

  if (document.getElementById('quiz-arena-container')) {
    renderQuiz();
  }

  if (document.getElementById('credentials-grid')) {
    renderPortfolioGrid();
  }
});

async function updateDashboardStats(user) {
  if (!user) return;
  const sId = user.id || user.student_id || user.email || '';
  const email = (user.email || '').trim().toLowerCase();

  // 1. Mastered Skills
  let skillsCount = 0;
  if (Array.isArray(user.verified_skills)) {
    skillsCount = user.verified_skills.length;
  }
  const skillsCountEl = document.getElementById('stat-skills-count');
  const skillsSubEl = document.getElementById('stat-skills-sub');
  if (skillsCountEl) skillsCountEl.innerText = skillsCount;
  if (skillsSubEl) {
    skillsSubEl.innerText = skillsCount > 0 ? `${skillsCount} Verified Skills` : '0 Verified Skills';
  }

  // 2. Assessments & XP
  const assessCountEl = document.getElementById('stat-assessments-count');
  const assessSubEl = document.getElementById('stat-assessments-sub');
  let certCount = 0;
  try {
    const certRes = await JoblexApiClient.getCertifications(sId);
    if (certRes && Array.isArray(certRes.certifications)) {
      certCount = certRes.certifications.length;
    }
  } catch (e) {
    console.warn('[DashboardStats] Certifications fetch error:', e);
  }
  if (assessCountEl) assessCountEl.innerText = certCount;
  if (assessSubEl) assessSubEl.innerText = currentXp > 0 ? `+${currentXp} XP Earned` : '0 XP Earned';

  // 3. Applications
  const appsCountEl = document.getElementById('stat-applications-count');
  const appsSubEl = document.getElementById('stat-applications-sub');
  let activeAppsCount = 0;
  if (email) {
    try {
      const appRes = await JoblexApiClient.getMyApplications(email);
      const apps = appRes.applications || appRes || [];
      if (Array.isArray(apps)) {
        activeAppsCount = apps.length;
      }
    } catch (e) {
      console.warn('[DashboardStats] Applications fetch error:', e);
    }
  }
  if (appsCountEl) appsCountEl.innerText = activeAppsCount;
  if (appsSubEl) appsSubEl.innerText = activeAppsCount > 0 ? `${activeAppsCount} Active` : '0 Active';

  // 4. Readiness Index
  const readinessEl = document.getElementById('stat-readiness-index');
  const readinessSubEl = document.getElementById('stat-readiness-sub');
  let readinessScore = 0;
  try {
    const profRes = await JoblexApiClient.getSkillProfile(sId);
    if (profRes && profRes.profile && typeof profRes.profile.readinessScore === 'number') {
      readinessScore = profRes.profile.readinessScore;
    }
  } catch (e) {
    console.warn('[DashboardStats] Readiness fetch error:', e);
  }
  if (readinessEl) readinessEl.innerText = `${readinessScore}%`;
  if (readinessSubEl) {
    readinessSubEl.innerText = readinessScore > 0 ? (readinessScore >= 75 ? 'Cohort Ready' : 'In Progress') : 'Diagnostic Pending';
  }

  // Opportunity lists are rendered only on their dedicated database-backed pages.
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR COLLAPSE CONTROLLER
// ─────────────────────────────────────────────────────────────
function initSidebarState() {
  const isCollapsed = localStorage.getItem('joblex_sidebar_collapsed') === 'true';
  applySidebarState(isCollapsed);
}

function toggleSidebarCollapse() {
  const sidebar = document.getElementById('student-sidebar');
  if (!sidebar) return;
  const isNowCollapsed = !sidebar.classList.contains('sidebar-collapsed');
  localStorage.setItem('joblex_sidebar_collapsed', isNowCollapsed ? 'true' : 'false');
  applySidebarState(isNowCollapsed);
}

function applySidebarState(collapsed) {
  const sidebar = document.getElementById('student-sidebar');
  const toggleBtn = document.getElementById('sidebar-collapse-btn');
  if (!sidebar) return;

  if (collapsed) {
    sidebar.classList.add('sidebar-collapsed');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<span>▶</span>';
      toggleBtn.title = 'Expand Sidebar';
    }
  } else {
    sidebar.classList.remove('sidebar-collapsed');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<span>◀</span>';
      toggleBtn.title = 'Collapse Sidebar';
    }
  }
}

// Global window bindings
window.toggleSidebarCollapse = toggleSidebarCollapse;
window.initSidebarState = initSidebarState;
window.applySidebarState = applySidebarState;

// Run immediate init in case script loaded after DOM parsing
initSidebarState();

function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) drawer.classList.toggle('hidden');
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) drawer.classList.add('hidden');
}

function updateHeaderMetrics() {
  const xpEl = document.getElementById('header-xp-badge');
  const streakEl = document.getElementById('header-streak-badge');
  if (xpEl) xpEl.innerHTML = `<span class="material-symbols-outlined text-purple-400 text-sm align-middle mr-1">bolt</span>${currentXp} XP`;
  if (streakEl) streakEl.innerHTML = `<span class="material-symbols-outlined text-amber-400 text-sm align-middle mr-1">local_fire_department</span>${currentStreak}-Day Streak`;
}

// ─────────────────────────────────────────────────────────────
// INTERNSHIPS & MICRO-GIGS MODULE (Intelligent Recommendation Engine)
// ─────────────────────────────────────────────────────────────
async function renderInternshipsBoard(typeFilter = 'All') {
  const container = document.getElementById('internships-container');
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-1 md:col-span-2 text-center py-10 space-y-3">
      <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs text-slate-500 dark:text-gray-400">Calculating Hybrid Cosine-Jaccard Recommendation Vectors...</p>
    </div>
  `;

  try {
    const res = await JoblexApiClient.getStudentRecommendations({ type: typeFilter, refresh: true });
    const opps = res.recommendations || [];

    // Filter for chosen opportunity type or show all
    const filtered = opps.filter(o => {
      if (typeFilter === 'All') return true;
      if (typeFilter === 'Internship') return o.type === 'Internship';
      if (typeFilter === 'Job') return o.type === 'Job';
      if (typeFilter === 'Micro-Gig') return o.type === 'Micro-Gig';
      return (o.type || '').toLowerCase() === typeFilter.toLowerCase();
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-1 md:col-span-2 text-center py-12 p-6 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-gray-800 text-xs text-slate-500">
          No active opportunities matching filter "${typeFilter}". Try selecting "All Opportunities".
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((opp, idx) => {
      const isMicroGig = opp.type === 'Micro-Gig';
      const tier = opp.matchTier || (opp.matchPercentage >= 80 ? 'Strong Match' : 'Growth Opportunity');
      const tierBadgeClass = opp.matchPercentage >= 85 
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
        : (opp.matchPercentage >= 70 
          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60');
      
      const cardId = `opp-card-${opp.id || idx}`;
      const accordionId = `accordion-${opp.id || idx}`;
      const diag = opp.diagnostics || {};
      const strengths = diag.topContributingSkills || [];
      const gaps = diag.criticalGaps || [];
      const actions = diag.actionRecommendations || [];

      return `
        <div id="${cardId}" class="p-5 rounded-2xl bg-white dark:bg-gray-900/70 border border-[#E2E8F0] dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/60 transition shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div class="flex justify-between items-start gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isMicroGig 
                    ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40' 
                    : 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40'
                }">
                  ${isMicroGig ? '<span class="material-symbols-outlined text-xs align-middle text-amber-400 mr-0.5">bolt</span>' + opp.type : opp.type}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierBadgeClass}">
                  ${tier}
                </span>
              </div>
              
              <div class="flex items-center gap-2">
                <button onclick="handleToggleWishlist('${opp.id}', '${opp.type}', '${opp.title.replace(/'/g, "\\'")}', '${opp.company.replace(/'/g, "\\'")}')" title="Save to Wishlist" class="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition">
                  <span class="material-symbols-outlined text-[18px]">bookmark_border</span>
                </button>
                <span class="text-xs font-mono font-bold text-emerald-600 dark:text-cyan-300">${opp.matchPercentage || opp.match || 75}% Fit</span>
              </div>
            </div>

            <h3 class="font-bold text-base text-[#0F172A] dark:text-white mt-2 mb-0.5">${opp.title}</h3>
            <p class="text-xs text-purple-600 dark:text-purple-300 font-medium">${opp.company} • ${opp.location || 'New Delhi'}</p>
            <p class="text-xs text-slate-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">${opp.description}</p>

            <div class="flex flex-wrap gap-1.5 mt-3">
              ${(opp.skills || []).map(s => `
                <span class="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-200">${s}</span>
              `).join('')}
            </div>

            <!-- Explainable Match Diagnostics Accordion -->
            <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-gray-800">
              <button onclick="toggleWhyMatch('${accordionId}')" class="w-full flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">psychology</span>
                  <span>Why this recommendation? (Explainable AI)</span>
                </span>
                <span id="${accordionId}-arrow" class="text-xs">▼</span>
              </button>

              <div id="${accordionId}" class="hidden mt-2 p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-gray-800 space-y-2 text-xs">
                ${strengths.length > 0 ? `
                  <div>
                    <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block mb-1">Your Key Strengths For This Role:</span>
                    <div class="flex flex-wrap gap-1">
                      ${strengths.map(s => `<span class="px-2 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-[10px]"><span class="material-symbols-outlined text-[13px] align-middle text-emerald-500 mr-0.5">check_circle</span>${s.skill || s}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}

                ${gaps.length > 0 ? `
                  <div class="pt-1">
                    <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block mb-1">Recommended Gaps to Bridge:</span>
                    <div class="flex flex-wrap gap-1">
                      ${gaps.map(g => `<span class="px-2 py-0.5 rounded bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-[10px]"><span class="material-symbols-outlined text-[13px] align-middle text-amber-500 mr-0.5">info</span>${g.skill || g}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}

                ${actions.length > 0 ? `
                  <div class="pt-1 text-[11px] text-slate-500 dark:text-gray-400">
                    <strong>Action:</strong> ${actions[0]}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[#E2E8F0] dark:border-gray-800/80 flex justify-between items-center text-xs">
            <div>
              <span class="text-slate-500 dark:text-gray-400 block text-[10px]">Stipend / Bounty</span>
              <span class="font-bold text-[#0F172A] dark:text-white font-mono">${opp.stipend}</span>
            </div>
            <button id="apply-btn-${opp.id}" onclick="handleApplyOpportunity('${opp.id}', '${opp.title.replace(/'/g, "\\'")}', '${opp.company.replace(/'/g, "\\'")}', '${opp.type}', ${opp.matchPercentage || opp.match || 75})" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition hover:scale-105">
              Apply for ${opp.type} <span class="material-symbols-outlined text-sm align-middle ml-1">arrow_forward</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error rendering internships board:', err);
    container.innerHTML = `<div class="col-span-2 text-center py-6 text-xs text-red-400">Failed to load opportunities. Please try again.</div>`;
  }
}

// ─────────────────────────────────────────────────────────────
// JOBS MODULE (Intelligent Corporate Placements Engine)
// ─────────────────────────────────────────────────────────────
async function renderJobsBoard() {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-10 space-y-3">
      <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs text-slate-500 dark:text-gray-400">Calculating Hybrid Cosine-Jaccard Job Fit Vectors...</p>
    </div>
  `;

  try {
    const res = await JoblexApiClient.getStudentRecommendations({ type: 'Job', refresh: true });
    const opps = res.recommendations || [];
    const jobs = opps.filter(o => o.type === 'Job');

    if (jobs.length === 0) {
      container.innerHTML = `<div class="text-center py-12 text-xs text-slate-400">No corporate placement positions open at this time.</div>`;
      return;
    }

    container.innerHTML = jobs.map((opp, idx) => {
      const tier = opp.matchTier || (opp.matchPercentage >= 80 ? 'Strong Match' : 'Growth Opportunity');
      const tierBadgeClass = opp.matchPercentage >= 85 
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      
      const accordionId = `job-accordion-${opp.id || idx}`;
      const diag = opp.diagnostics || {};
      const strengths = diag.topContributingSkills || [];
      const gaps = diag.criticalGaps || [];
      const actions = diag.actionRecommendations || [];

      return `
        <div class="p-6 rounded-3xl bg-white dark:bg-gray-900/80 border border-[#E2E8F0] dark:border-blue-500/40 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div class="flex justify-between items-start gap-2">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
                  Corporate Placement
                </span>
                <span class="px-3 py-1 rounded-full text-[10px] font-bold border ${tierBadgeClass}">
                  ${tier}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="handleToggleWishlist('${opp.id}', '${opp.type}', '${opp.title.replace(/'/g, "\\'")}', '${opp.company.replace(/'/g, "\\'")}')" title="Save to Wishlist" class="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition">
                  <span class="material-symbols-outlined text-[18px]">bookmark_border</span>
                </button>
                <span class="text-xs font-mono font-bold text-emerald-600 dark:text-cyan-300">${opp.matchPercentage || opp.match || 78}% Fit</span>
              </div>
            </div>

            <h3 class="font-black text-lg text-[#0F172A] dark:text-white mt-2.5 mb-1">${opp.title}</h3>
            <p class="text-xs text-blue-600 dark:text-blue-300 font-semibold">${opp.company} • ${opp.location || 'Corporate Campus'}</p>
            <p class="text-xs text-slate-600 dark:text-gray-300 mt-2.5 leading-relaxed">${opp.description}</p>

            <div class="flex flex-wrap gap-1.5 mt-3.5">
              ${(opp.skills || []).map(s => `
                <span class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-700 dark:text-blue-200">${s}</span>
              `).join('')}
            </div>

            <!-- Explainable Match Diagnostics Accordion -->
            <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-gray-800">
              <button onclick="toggleWhyMatch('${accordionId}')" class="w-full flex items-center justify-between text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px]">analytics</span>
                  <span>Why this corporate recommendation? (AI Vector Insights)</span>
                </span>
                <span id="${accordionId}-arrow" class="text-xs">▼</span>
              </button>

              <div id="${accordionId}" class="hidden mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-gray-800 space-y-2 text-xs">
                ${strengths.length > 0 ? `
                  <div>
                    <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block mb-1">Aligned Candidate Strengths:</span>
                    <div class="flex flex-wrap gap-1">
                      ${strengths.map(s => `<span class="px-2 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-[10px]"><span class="material-symbols-outlined text-[13px] align-middle text-emerald-500 mr-0.5">check_circle</span>${s.skill || s}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}

                ${gaps.length > 0 ? `
                  <div class="pt-1">
                    <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block mb-1">Corporate Mandate Competency Gaps:</span>
                    <div class="flex flex-wrap gap-1">
                      ${gaps.map(g => `<span class="px-2 py-0.5 rounded bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-[10px]"><span class="material-symbols-outlined text-[13px] align-middle text-amber-500 mr-0.5">info</span>${g.skill || g}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}

                ${actions.length > 0 ? `
                  <div class="pt-1 text-[11px] text-slate-500 dark:text-gray-400">
                    <strong>Placement Recommendation:</strong> ${actions[0]}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-[#E2E8F0] dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span class="text-slate-500 dark:text-gray-400 block text-[10px]">Compensation Package</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">${opp.stipend}</span>
              <span class="text-[10px] text-slate-400 dark:text-gray-500 block">Deadline: ${opp.deadline || 'Rolling Admissions'}</span>
            </div>
            <button id="apply-btn-${opp.id}" onclick="handleApplyOpportunity('${opp.id}', '${opp.title.replace(/'/g, "\\'")}', '${opp.company.replace(/'/g, "\\'")}', '${opp.type}', ${opp.matchPercentage || opp.match || 78})" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition hover:scale-105">
              Apply for Job <span class="material-symbols-outlined text-sm align-middle ml-1">arrow_forward</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error rendering jobs board:', err);
    container.innerHTML = `<div class="text-center py-6 text-xs text-red-400">Failed to load jobs. Please try again.</div>`;
  }
}

function toggleWhyMatch(accordionId) {
  const el = document.getElementById(accordionId);
  const arrow = document.getElementById(`${accordionId}-arrow`);
  if (!el) return;
  const isHidden = el.classList.contains('hidden');
  if (isHidden) {
    el.classList.remove('hidden');
    if (arrow) arrow.innerText = '▲';
  } else {
    el.classList.add('hidden');
    if (arrow) arrow.innerText = '▼';
  }
}

async function handleToggleWishlist(oppId, type, title, company) {
  const res = await JoblexApiClient.toggleWishlist(oppId, type, title, company);
  if (res && res.saved) {
    showToast(`"${title}" saved to your Wishlist!`, 'Wishlist', 'success');
  } else {
    showToast(`Removed from Wishlist.`, 'Wishlist', 'info');
  }
}

// ─────────────────────────────────────────────────────────────
// APPLICATION SUBMISSION DISPATCH (To Industry Portal)
// ─────────────────────────────────────────────────────────────
async function handleApplyOpportunity(oppId, oppTitle, company, type, match) {
  const btn = document.getElementById(`apply-btn-${oppId}`);
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Transmitting...';
  }

  const user = JoblexApiClient.getCurrentUser() || {
    name: 'Scholar',
    email: 'student@institution.edu',
    institution: 'Ayush Collegiate Institute'
  };

  const payload = {
    opportunityId: oppId,
    opportunityTitle: oppTitle,
    company: company,
    type: type,
    studentName: user.name,
    studentEmail: user.email,
    college: user.institution || 'University / Institution',
    skills: user.skills || ['Full-Stack Development', 'Problem Solving', 'Data Structures', 'Python'],
    match: match || 92
  };

  const res = await JoblexApiClient.applyOpportunity(payload);

  if (btn) {
    btn.innerHTML = '<span class="material-symbols-outlined text-xs align-middle mr-1">check</span>Applied';
    btn.className = 'px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-default';
  }

  showToast(`Application Transmitted Successfully\n\nYour verified institutional dossier has been submitted to ${company} for the "${oppTitle}" position.`, 'Application Transmitted', 'success');
}

// ─────────────────────────────────────────────────────────────
// MULTI-SECTOR ROADMAP & MINDMAP FLOW MODULE
// ─────────────────────────────────────────────────────────────
let sectorRoadmapsCache = [];
let activeRoadmap = null;
let currentSectorFilter = 'All';

async function initSectorRoadmaps() {
  const cardsGrid = document.getElementById('roadmap-cards-grid');
  const countBadge = document.getElementById('roadmap-count-badge');

  try {
    const res = await JoblexApiClient.getRoadmapSectors();
    if (res && res.success && Array.isArray(res.sectors)) {
      sectorRoadmapsCache = res.sectors;
    } else {
      sectorRoadmapsCache = getFallbackSectorRoadmaps();
    }
  } catch (err) {
    console.warn('[Sector Roadmaps] Failed to fetch:', err);
    sectorRoadmapsCache = getFallbackSectorRoadmaps();
  }

  if (countBadge) {
    countBadge.innerText = `${sectorRoadmapsCache.length} Available`;
  }

  renderSectorRoadmapCards();
}

function getFallbackSectorRoadmaps() {
  return [
    {
      id: "fullstack-web",
      title: "Full Stack Software Engineering",
      sector: "Technology & Software",
      icon: "code",
      color: "from-blue-600 to-cyan-500",
      duration: "6 Months",
      difficulty: "Intermediate",
      summary: "Complete modern roadmap from responsive frontend frameworks to scalable cloud microservices.",
      totalMilestones: 4,
      estimatedWeeks: 16
    },
    {
      id: "ai-data-science",
      title: "AI & Machine Learning Engineering",
      sector: "Artificial Intelligence & Data",
      icon: "psychology",
      color: "from-purple-600 to-indigo-600",
      duration: "8 Months",
      difficulty: "Advanced",
      summary: "From statistical mathematics to deep learning architectures, vector databases, and LLM agent systems.",
      totalMilestones: 4,
      estimatedWeeks: 24
    },
    {
      id: "cloud-devops",
      title: "Cloud Architecture & DevOps Engineering",
      sector: "Infrastructure & Cloud",
      icon: "cloud_done",
      color: "from-emerald-600 to-teal-500",
      duration: "6 Months",
      difficulty: "Intermediate",
      summary: "Design reliable, fault-tolerant infrastructure as code, Kubernetes clusters, and enterprise CI/CD.",
      totalMilestones: 4,
      estimatedWeeks: 16
    },
    {
      id: "cybersecurity",
      title: "Cybersecurity & Ethical Hacking",
      sector: "Information Security",
      icon: "security",
      color: "from-rose-600 to-red-500",
      duration: "6 Months",
      difficulty: "Intermediate to Advanced",
      summary: "Comprehensive defensive and offensive security, vulnerability assessment, cryptography, and network defense.",
      totalMilestones: 4,
      estimatedWeeks: 16
    },
    {
      id: "biotech-healthtech",
      title: "Health-Tech, Bioinformatics & Pharma Analytics",
      sector: "Healthcare & Life Sciences",
      icon: "biotech",
      color: "from-amber-600 to-orange-500",
      duration: "6 Months",
      difficulty: "Intermediate",
      summary: "Connecting computational biology, clinical data management, molecular docking, and regulatory compliance.",
      totalMilestones: 4,
      estimatedWeeks: 16
    },
    {
      id: "fintech-blockchain",
      title: "Fintech, Quantitative Systems & Blockchain",
      sector: "Financial Technology",
      icon: "account_balance",
      color: "from-yellow-600 to-amber-500",
      duration: "6 Months",
      difficulty: "Advanced",
      summary: "Build high-frequency trading algorithms, risk analytics models, and decentralized smart contracts.",
      totalMilestones: 4,
      estimatedWeeks: 16
    }
  ];
}

function setRoadmapSectorFilter(sector) {
  currentSectorFilter = sector;
  const buttons = document.querySelectorAll('#sector-filter-buttons .sector-filter-btn');
  buttons.forEach(btn => {
    const isTarget = btn.getAttribute('data-sector') === sector;
    if (isTarget) {
      btn.className = 'sector-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition bg-purple-600 text-white shadow-sm';
    } else {
      btn.className = 'sector-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10';
    }
  });
  renderSectorRoadmapCards();
}

function filterSectorRoadmaps() {
  renderSectorRoadmapCards();
}

function renderSectorRoadmapCards() {
  const cardsGrid = document.getElementById('roadmap-cards-grid');
  if (!cardsGrid) return;

  const searchInput = document.getElementById('roadmap-search-input');
  const query = (searchInput?.value || '').trim().toLowerCase();

  const filtered = sectorRoadmapsCache.filter(item => {
    const matchesSector = currentSectorFilter === 'All' || item.sector === currentSectorFilter;
    if (!matchesSector) return false;

    if (!query) return true;
    const matchTitle = (item.title || '').toLowerCase().includes(query);
    const matchSector = (item.sector || '').toLowerCase().includes(query);
    const matchSummary = (item.summary || '').toLowerCase().includes(query);
    const matchSkills = Array.isArray(item.milestones) && item.milestones.some(m => 
      Array.isArray(m.skills) && m.skills.some(s => s.toLowerCase().includes(query))
    );
    return matchTitle || matchSector || matchSummary || matchSkills;
  });

  const countBadge = document.getElementById('roadmap-count-badge');
  if (countBadge) {
    countBadge.innerText = `${filtered.length} of ${sectorRoadmapsCache.length} Roadmaps`;
  }

  if (filtered.length === 0) {
    cardsGrid.innerHTML = `
      <div class="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-white/[0.02] border border-[#E7E4DC] dark:border-white/5">
        <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-gray-600 mb-2">manage_search</span>
        <h3 class="text-sm font-bold text-slate-800 dark:text-gray-200">No Roadmaps Found</h3>
        <p class="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
          No career roadmap matches your search "${query}". Try adjusting filters or searching for skills like "Python", "Cloud", "Security", or "Data".
        </p>
        <button onclick="setRoadmapSectorFilter('All'); if(document.getElementById('roadmap-search-input')) document.getElementById('roadmap-search-input').value=''; renderSectorRoadmapCards();" class="mt-4 px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition">
          Clear Filters
        </button>
      </div>
    `;
    return;
  }

  cardsGrid.innerHTML = filtered.map(item => {
    const icon = item.icon || 'alt_route';
    const color = item.color || 'from-purple-600 to-indigo-600';
    return `
      <div 
        onclick="openRoadmapMindmap('${item.id}')"
        class="group cursor-pointer rounded-2xl bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] border border-[#E7E4DC] dark:border-white/10 hover:border-purple-500/50 dark:hover:border-purple-500/50 p-5 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          <!-- Header Badge & Icon -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-xl">${icon}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                ${item.duration || '6 Months'}
              </span>
            </div>
          </div>

          <!-- Title & Sector -->
          <span class="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">${item.sector}</span>
          <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mt-0.5">${item.title}</h3>
          <p class="text-xs text-slate-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">${item.summary || 'Comprehensive milestone curriculum and industry deliverables.'}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-[#E7E4DC] dark:border-white/5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-mono text-slate-500 dark:text-gray-400 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-purple-500">account_tree</span>
              ${item.totalMilestones || 4} Phases
            </span>
            <span class="text-slate-300 dark:text-gray-700">•</span>
            <span class="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">${item.difficulty || 'Intermediate'}</span>
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
            <span>View Mindmap</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>
      </div>
    `;
  }).join('');
}

async function openRoadmapMindmap(roadmapId) {
  const mindmapView = document.getElementById('roadmap-mindmap-view');
  if (!mindmapView) return;

  mindmapView.classList.remove('hidden');
  mindmapView.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const nodesContainer = document.getElementById('mindmap-flow-nodes');
  if (nodesContainer) {
    nodesContainer.innerHTML = `
      <div class="p-12 text-center text-slate-400 dark:text-gray-500">
        <span class="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
        <p class="text-xs font-mono">Synthesizing full mindmap flow & timeline architecture...</p>
      </div>
    `;
  }

  try {
    const res = await JoblexApiClient.getRoadmapDetails(roadmapId);
    if (res && res.success && res.roadmap) {
      activeRoadmap = res.roadmap;
    } else {
      activeRoadmap = sectorRoadmapsCache.find(r => r.id === roadmapId) || sectorRoadmapsCache[0];
    }
  } catch (e) {
    console.warn('[Mindmap Details] Error fetching details:', e);
    activeRoadmap = sectorRoadmapsCache.find(r => r.id === roadmapId) || sectorRoadmapsCache[0];
  }

  renderActiveRoadmapMindmap();
}

function closeRoadmapMindmap() {
  const mindmapView = document.getElementById('roadmap-mindmap-view');
  if (mindmapView) {
    mindmapView.classList.add('hidden');
  }
}

function renderActiveRoadmapMindmap() {
  if (!activeRoadmap) return;

  // Header tags & title
  const titleEl = document.getElementById('mindmap-title');
  const printTitleEl = document.getElementById('mindmap-print-title');
  const summaryEl = document.getElementById('mindmap-summary');
  const sectorEl = document.getElementById('mindmap-sector-tag');
  const durationEl = document.getElementById('mindmap-duration-tag');
  const diffEl = document.getElementById('mindmap-difficulty-tag');
  const promptTagContainer = document.getElementById('mindmap-prompt-tag-container');

  if (titleEl) titleEl.innerText = activeRoadmap.title;
  if (printTitleEl) printTitleEl.innerText = `${activeRoadmap.title} • ${activeRoadmap.sector}`;
  if (summaryEl) summaryEl.innerText = activeRoadmap.summary || 'Customized timeline progression roadmap.';
  if (sectorEl) sectorEl.innerText = activeRoadmap.sector || 'Multi-Sector';
  if (durationEl) durationEl.innerText = activeRoadmap.duration || '6 Months';
  if (diffEl) diffEl.innerText = activeRoadmap.difficulty || 'Intermediate';

  if (promptTagContainer) {
    if (activeRoadmap.userPrompt) {
      promptTagContainer.innerHTML = `
        <div class="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-[11px] text-purple-700 dark:text-purple-300 font-mono flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-purple-500">auto_fix_high</span>
          <span>AI Customization: "<strong>${escapeHtml(activeRoadmap.userPrompt)}</strong>"</span>
        </div>
      `;
    } else {
      promptTagContainer.innerHTML = `
        <span class="text-xs font-mono text-slate-500 dark:text-gray-400">Default Baseline Blueprint</span>
      `;
    }
  }

  const nodesContainer = document.getElementById('mindmap-flow-nodes');
  if (!nodesContainer) return;

  const milestones = activeRoadmap.milestones || [];
  if (milestones.length === 0) {
    nodesContainer.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No milestones defined for this roadmap.</div>`;
    return;
  }

  nodesContainer.innerHTML = milestones.map((m, idx) => {
    const isEven = idx % 2 === 0;
    const phaseLabel = m.phase || `Phase 0${idx + 1}`;
    const timelineLabel = m.timeline || `Month ${idx * 2 + 1} - ${idx * 2 + 2}`;
    const skills = Array.isArray(m.skills) ? m.skills : [];
    const deliverables = Array.isArray(m.keyDeliverables) ? m.keyDeliverables : [];

    return `
      <div class="relative flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 z-10">
        <!-- Node Center Hub Marker -->
        <div class="absolute left-6 md:left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#FAF8F5] dark:bg-[#070709] border-4 border-purple-500 flex items-center justify-center text-purple-500 shadow-md font-bold text-xs font-mono">
          ${idx + 1}
        </div>

        <!-- Content Card Box -->
        <div class="ml-14 md:ml-0 md:w-[46%] p-5 sm:p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#E7E4DC] dark:border-white/10 hover:border-purple-400/60 dark:hover:border-purple-500/40 shadow-sm hover:shadow-xl transition-all duration-200">
          <!-- Phase & Timeline Header -->
          <div class="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[#E7E4DC] dark:border-white/5">
            <span class="text-xs font-mono font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">${phaseLabel}</span>
            <span class="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 font-semibold border border-[#E7E4DC] dark:border-white/5">
              ${timelineLabel}
            </span>
          </div>

          <!-- Milestone Title & Description -->
          <h4 class="text-base font-bold text-slate-900 dark:text-white leading-snug">${m.title}</h4>
          <p class="text-xs text-slate-600 dark:text-gray-300 mt-1.5 leading-relaxed">${m.description || ''}</p>

          <!-- Core Skills Badges -->
          ${skills.length > 0 ? `
            <div class="mt-4">
              <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-gray-400 tracking-wider block mb-1.5">Core Competencies:</span>
              <div class="flex flex-wrap gap-1.5">
                ${skills.map(s => `
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 font-medium">
                    ${escapeHtml(s)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Industry Deliverables & Checkpoints -->
          ${deliverables.length > 0 ? `
            <div class="mt-4 pt-3 border-t border-[#E7E4DC] dark:border-white/5 space-y-1.5">
              <span class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">task_alt</span> Key Deliverables &amp; Output:
              </span>
              <ul class="space-y-1">
                ${deliverables.map(d => `
                  <li class="text-[11px] text-slate-700 dark:text-gray-300 flex items-start gap-1.5">
                    <span class="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>${escapeHtml(d)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function applyQuickPrompt(promptText) {
  const input = document.getElementById('roadmap-customize-prompt');
  if (input) {
    input.value = promptText;
    input.focus();
  }
}

async function handleRoadmapCustomization() {
  const input = document.getElementById('roadmap-customize-prompt');
  const btn = document.getElementById('customize-submit-btn');
  const btnText = document.getElementById('customize-btn-text');

  const userPrompt = (input?.value || '').trim();
  if (!userPrompt) {
    showToast('Please type your customization instructions (e.g. "Add Python AI Agents and LangGraph").', 'Prompt Required', 'warning');
    return;
  }

  if (!activeRoadmap) {
    showToast('Please select a roadmap first.', 'Select Roadmap', 'warning');
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerText = 'Synthesizing with LangGraph...';

  try {
    const payload = {
      roadmapId: activeRoadmap.id,
      currentRoadmap: activeRoadmap,
      userPrompt
    };

    const res = await JoblexApiClient.customizeRoadmap(payload);

    if (res && res.success && res.roadmap) {
      activeRoadmap = res.roadmap;
      renderActiveRoadmapMindmap();

      showToast(
        `Your customized roadmap "${res.roadmap.title}" has been orchestrated and rendered into the mindmap flow.`,
        'Roadmap Rebuilt by Zulu AI',
        'success'
      );

      // Clear input
      if (input) input.value = '';
    } else {
      showToast(res?.error || 'Could not customize roadmap. Please try again.', 'Customization Failed', 'error');
    }
  } catch (err) {
    console.error('[Roadmap Customize Error]:', err);
    showToast('Failed to connect to AI roadmap engine. Please check backend server.', 'Customization Error', 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerText = 'Apply AI Changes';
  }
}

async function exportCurrentRoadmapToPdf() {
  if (!activeRoadmap) {
    showToast('No active roadmap to export.', 'Export Notice', 'warning');
    return;
  }

  const exportBtn = document.getElementById('export-pdf-btn');
  const originalBtnContent = exportBtn ? exportBtn.innerHTML : '';
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.innerHTML = `
      <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      <span>Generating PDF...</span>
    `;
  }

  const targetElement = document.getElementById('mindmap-print-container');
  if (!targetElement) {
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalBtnContent;
    }
    return;
  }

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `JOBLEX-Roadmap-${(activeRoadmap.title || 'Career').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    if (window.html2pdf) {
      await window.html2pdf().set(opt).from(targetElement).save();
      showToast('Career roadmap successfully exported as PDF!', 'PDF Export Complete', 'success');
    } else {
      // Fallback to window.print if CDN is not ready
      window.print();
    }
  } catch (err) {
    console.error('[PDF Export Error]:', err);
    // Graceful fallback to browser print dialog
    window.print();
  } finally {
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalBtnContent;
    }
  }
}

// Backward compatibility helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Legacy toggle handler
async function handleTaskToggle(taskId) {
  const res = await JoblexApiClient.toggleRoadmapTask(taskId);
  if (res && res.task) {
    if (res.xpAwarded) {
      currentXp += res.xpAwarded;
      updateHeaderMetrics();
    }
    roadmapState = await JoblexApiClient.getRoadmap();
  }
}

async function handleCheckIn() {
  const btn = document.getElementById('streak-checkin-btn');
  if (btn) btn.disabled = true;

  const res = await JoblexApiClient.checkInStreak();
  currentXp += 50;
  currentStreak += 1;
  updateHeaderMetrics();

  const statusEl = document.getElementById('streak-freeze-status');
  if (statusEl) statusEl.innerText = `✓ Decay frozen until ${new Date(res.decayFrozenUntil).toLocaleDateString()}!`;
  if (btn) btn.innerText = '✓ Checked In (+50 XP)';
  showToast('Streak Protected Your competencies are frozen against decay for the next 72 hours.', 'Streak Protected', 'success');
}

// ─────────────────────────────────────────────────────────────
// AI RESUME ANALYZER, NLP PARSER & AUTO-ASSESSMENT MODULE
// ─────────────────────────────────────────────────────────────
let selectedResumeFile = null;
let currentParsedData = null;
let currentAutoAssessment = null;
let resumeRadarChartInstance = null;

function switchInputMode(mode) {
  const fileMode = document.getElementById('file-upload-mode');
  const textMode = document.getElementById('text-input-mode');
  const tabPdf = document.getElementById('tab-btn-pdf');
  const tabImage = document.getElementById('tab-btn-image');
  const tabText = document.getElementById('tab-btn-text');
  const fileInput = document.getElementById('resume-file-input');
  const dropzoneTitle = document.getElementById('dropzone-title');
  const dropzoneDesc = document.getElementById('dropzone-desc');
  const dropzoneIcon = document.getElementById('dropzone-icon');

  const activeTabClass = "px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white dark:bg-white/10 dark:text-white transition shadow-sm flex items-center gap-2";
  const inactiveTabClass = "px-4 py-2 rounded-xl text-xs font-medium text-[#475569] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition flex items-center gap-2";

  if (mode === 'pdf' || mode === 'file') {
    if (fileMode) fileMode.classList.remove('hidden');
    if (textMode) textMode.classList.add('hidden');
    if (tabPdf) tabPdf.className = activeTabClass;
    if (tabImage) tabImage.className = inactiveTabClass;
    if (tabText) tabText.className = inactiveTabClass;
    if (fileInput) fileInput.accept = ".pdf,.docx,.txt";
    if (dropzoneTitle) dropzoneTitle.innerText = "Drag and drop your PDF Resume document";
    if (dropzoneDesc) dropzoneDesc.innerText = "Supports PDF (via in-browser PDF.js), DOCX, or TXT (Max 10MB)";
    if (dropzoneIcon) dropzoneIcon.innerText = "picture_as_pdf";
  } else if (mode === 'image') {
    if (fileMode) fileMode.classList.remove('hidden');
    if (textMode) textMode.classList.add('hidden');
    if (tabImage) tabImage.className = activeTabClass;
    if (tabPdf) tabPdf.className = inactiveTabClass;
    if (tabText) tabText.className = inactiveTabClass;
    if (fileInput) fileInput.accept = ".png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,image/*";
    if (dropzoneTitle) dropzoneTitle.innerText = "Drag and drop your Resume Image / Photo";
    if (dropzoneDesc) dropzoneDesc.innerText = "Supports PNG, JPG, JPEG, WEBP (Processed via Tesseract.js Optical Character Recognition)";
    if (dropzoneIcon) dropzoneIcon.innerText = "image";
  } else {
    if (fileMode) fileMode.classList.add('hidden');
    if (textMode) textMode.classList.remove('hidden');
    if (tabText) tabText.className = activeTabClass;
    if (tabPdf) tabPdf.className = inactiveTabClass;
    if (tabImage) tabImage.className = inactiveTabClass;
  }
}

function handleDragOver(e) {
  e.preventDefault();
  const dropzone = document.getElementById('resume-dropzone');
  if (dropzone) dropzone.classList.add('border-purple-600', 'bg-purple-100/30');
}

function handleDragLeave(e) {
  e.preventDefault();
  const dropzone = document.getElementById('resume-dropzone');
  if (dropzone) dropzone.classList.remove('border-purple-600', 'bg-purple-100/30');
}

function handleFileDrop(e) {
  e.preventDefault();
  handleDragLeave(e);
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processSelectedFile(e.dataTransfer.files[0]);
  }
}

function handleFileSelect(e) {
  if (e.target && e.target.files && e.target.files.length > 0) {
    processSelectedFile(e.target.files[0]);
  }
}

function processSelectedFile(file) {
  selectedResumeFile = file;
  const infoBox = document.getElementById('selected-file-info');
  const nameDisplay = document.getElementById('file-name-display');
  const sizeDisplay = document.getElementById('file-size-display');

  if (infoBox) infoBox.classList.remove('hidden');
  if (nameDisplay) nameDisplay.innerText = file.name;
  if (sizeDisplay) sizeDisplay.innerText = `(${(file.size / 1024).toFixed(1)} KB)`;
  showToast(`Selected file: ${file.name}`, 'File Loaded', 'info');
}

function clearSelectedFile(e) {
  if (e) e.stopPropagation();
  selectedResumeFile = null;
  const infoBox = document.getElementById('selected-file-info');
  const fileInput = document.getElementById('resume-file-input');
  if (infoBox) infoBox.classList.add('hidden');
  if (fileInput) fileInput.value = '';
}

async function extractTextFromFile(file) {
  return new Promise((resolve, reject) => {
    const recognizeImage = async source => {
      if (!window.Tesseract) {
        throw new Error('OCR engine is unavailable. Please reload the page and try again.');
      }
      const result = await Tesseract.recognize(source, 'eng', {
        logger: message => {
          if (message.status === 'recognizing text' && typeof message.progress === 'number') {
            updateParsingProgress(20 + Math.round(message.progress * 20), 'Reading document with OCR...', 1);
          }
        }
      });
      return result.data.text || '';
    };

    const recognizePdfPages = async (pdfData, pdf) => {
      let ocrText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        ocrText += `${await recognizeImage(canvas)}\n`;
      }
      return ocrText;
    };

    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(file.name)) {
      recognizeImage(file).then(resolve).catch(reject);
      return;
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result);
          if (window['pdfjsLib']) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const strings = content.items.map(item => item.str);
              fullText += strings.join(' ') + '\n';
            }
            if (fullText.trim().length > 20) {
              return resolve(fullText);
            }
            const ocrText = await recognizePdfPages(this.result, pdf);
            if (ocrText.trim()) return resolve(ocrText);
          }
          // Fallback: decode text strings from PDF stream
          const dec = new TextDecoder('utf-8');
          const raw = dec.decode(this.result);
          const textMatches = raw.match(/\(([^)\\]{2,100})\)\s*T[jJ]/g) || [];
          if (textMatches.length > 5) {
            const extracted = textMatches.map(m => m.replace(/^[(\s]+|[)\sTjJ]+$/g, '')).join(' ');
            return resolve(extracted);
          }
          resolve(raw.replace(/[^\x20-\x7E\r\n\t]/g, ' '));
        } catch (err) {
          console.warn('PDF extraction warning:', err);
          const dec = new TextDecoder('utf-8');
          resolve(dec.decode(this.result).replace(/[^\x20-\x7E\r\n\t]/g, ' '));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else if (file.name.toLowerCase().endsWith('.docx') && window['mammoth']) {
      const reader = new FileReader();
      reader.onload = async function() {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: this.result });
          resolve(result.value || '');
        } catch (mErr) {
          console.warn('Mammoth docx extraction error:', mErr);
          resolve('');
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = function() { resolve(this.result || ''); };
      reader.onerror = reject;
      reader.readAsText(file);
    }
  });
}

function updateParsingProgress(percent, stepText, activeStepNum) {
  const bar = document.getElementById('parsing-progress-bar');
  const percentEl = document.getElementById('parsing-progress-percent');
  const stepEl = document.getElementById('parsing-status-step');

  if (bar) bar.style.width = `${percent}%`;
  if (percentEl) percentEl.innerText = `${percent}%`;
  if (stepEl) {
    stepEl.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
      <span>${stepText}</span>
    `;
  }

  for (let s = 1; s <= 4; s++) {
    const el = document.getElementById(`step-${s}`);
    if (el) {
      if (s <= activeStepNum) {
        el.className = 'text-purple-600 font-bold';
      } else {
        el.className = 'text-slate-400';
      }
    }
  }
}

async function handleExecuteParse() {
  const progressBox = document.getElementById('parsing-progress-box');
  const btn = document.getElementById('execute-parse-btn');
  const targetRole = 'auto';

  let resumeText = '';

  if (selectedResumeFile) {
    if (progressBox) progressBox.classList.remove('hidden');
    updateParsingProgress(20, 'Reading Document Text via In-Browser PDF/DOCX Parser...', 1);
    try {
      resumeText = await extractTextFromFile(selectedResumeFile);
    } catch (err) {
      console.warn('File reading error:', err);
      resumeText = '';
    }
    if (!resumeText || resumeText.trim().length < 15) {
      if (progressBox) progressBox.classList.add('hidden');
      if (btn) btn.disabled = false;
      JoblexApiClient.showNoticeModal({
        title: 'Document Text Not Found',
        icon: 'warning',
        message: 'Could not extract readable text from this file. For image or scanned resumes, reload the page to initialize OCR and try again, or upload a searchable document.',
        confirmText: 'Close'
      });
      return;
    }
  } else {
    const textarea = document.getElementById('resume-textarea');
    resumeText = textarea ? textarea.value.trim() : '';
    if (!resumeText) {
      JoblexApiClient.showNoticeModal({
        title: 'No Resume Provided',
        icon: 'warning',
        message: 'Please upload a resume file or paste your resume text into the input field to evaluate your competencies.',
        confirmText: 'Close'
      });
      return;
    }
    if (progressBox) progressBox.classList.remove('hidden');
    updateParsingProgress(25, 'Ingesting Raw Candidate Credentials...', 1);
  }

  if (btn) btn.disabled = true;

  try {
    // Step 2: NLP Entity Recognition
    await new Promise(r => setTimeout(r, 400));
    updateParsingProgress(50, 'NLP Entity Recognition (Contact, Education, Projects)...', 2);

    // Step 3: Ontology Discovery
    await new Promise(r => setTimeout(r, 400));
    updateParsingProgress(75, '85+ Skill Ontology Mapping & Confidence Scoring...', 3);

    // Step 4: Vector Auto Assessment
    await new Promise(r => setTimeout(r, 300));
    updateParsingProgress(90, 'Hybrid Vector Auto-Assessment & Gap Computation...', 4);

    const autoAssessRes = await JoblexApiClient.autoAssessResume(resumeText, targetRole);

    updateParsingProgress(100, 'Assessment Complete!', 4);
    await new Promise(r => setTimeout(r, 300));
    if (progressBox) progressBox.classList.add('hidden');

    let parsed = autoAssessRes?.parsed || autoAssessRes?.parsedResume;
    let assessment = autoAssessRes?.assessment || autoAssessRes?.autoAssessment;

    // Guaranteed resilience fallback:
    if (!parsed || !assessment) {
      console.warn('[handleExecuteParse] Backend assessment incomplete, computing client-side auto-assessment');
      const fallbackResult = JoblexApiClient._heuristicAutoAssessResume(resumeText, targetRole);
      if (fallbackResult) {
        parsed = fallbackResult.parsed;
        assessment = fallbackResult.assessment;
      }
    }

    if (parsed || assessment) {
      currentParsedData = parsed || {
        name: 'Scholar Candidate',
        email: '',
        education: ['Candidate Degree'],
        experienceYears: 'Student Researcher',
        summary: 'Candidate credentials evaluated.',
        extractedSkills: []
      };
      currentAutoAssessment = assessment;
      // Save in session for quiz auto-fill
      sessionStorage.setItem('joblex_latest_parsed_resume', JSON.stringify({
        parsed: currentParsedData,
        assessment: currentAutoAssessment
      }));
      const resolvedDomain = assessment?.targetRole || assessment?.detectedDomain || 'Multi-Disciplinary Specialist';
      renderParsedResults(currentParsedData, currentAutoAssessment, resolvedDomain);
      showToast('Resume Parsed & Auto-Assessed Successfully', 'Auto-Assessment Ready', 'success');
    } else {
      showToast('Error parsing resume. Please check format.', 'Parsing Failed', 'error');
    }
  } catch (err) {
    console.error('Error in handleExecuteParse:', err);
    try {
      const fallbackResult = JoblexApiClient._heuristicAutoAssessResume(resumeText, targetRole);
      if (fallbackResult && fallbackResult.parsed) {
        currentParsedData = fallbackResult.parsed;
        currentAutoAssessment = fallbackResult.assessment;
        renderParsedResults(currentParsedData, currentAutoAssessment, fallbackResult.detectedDomain || 'Multi-Disciplinary Specialist');
        showToast('Parsed and assessed candidate competencies.', 'Assessment Ready', 'success');
        if (progressBox) progressBox.classList.add('hidden');
        return;
      }
    } catch (fErr) {
      console.warn('Fallback error:', fErr);
    }
    showToast('Failed to execute AI Auto-Assessment.', 'Error', 'error');
    if (progressBox) progressBox.classList.add('hidden');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Fallback compatibility for any direct call to handleAnalyzeResume
async function handleAnalyzeResume() {
  await handleExecuteParse();
}

function renderParsedResults(parsed, assessment, targetRole) {
  const container = document.getElementById('resume-results-container');
  if (!container) return;
  container.classList.remove('hidden');

  // Match score & tier
  const scoreEl = document.getElementById('resume-match-score');
  const countEl = document.getElementById('resume-skills-count');
  const roleEl = document.getElementById('results-target-role');
  const tierEl = document.getElementById('match-tier-badge');

  if (scoreEl) scoreEl.innerText = `${assessment.matchPercentage}%`;
  if (countEl) countEl.innerText = `${(parsed.extractedSkills || []).length}`;
  if (roleEl) roleEl.innerText = targetRole;
  if (tierEl) {
    tierEl.innerText = assessment.matchTier || 'Strong Match';
    tierEl.className = assessment.matchPercentage >= 85
      ? 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
      : (assessment.matchPercentage >= 70
        ? 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
        : 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60');
  }

  // Profile details
  const nameEl = document.getElementById('parsed-candidate-name');
  const emailEl = document.getElementById('parsed-candidate-email');
  const eduEl = document.getElementById('parsed-candidate-education');
  const expEl = document.getElementById('parsed-candidate-experience');
  const sumEl = document.getElementById('parsed-candidate-summary');

  if (nameEl) nameEl.innerText = parsed.name || 'Scholar Candidate';
  if (emailEl) emailEl.innerText = parsed.email || (parsed.email === '' ? 'Not specified in resume' : 'candidate@joblex.in');
  if (eduEl) eduEl.innerText = (parsed.education && parsed.education[0]) || 'Academic Scholar';
  if (expEl) expEl.innerText = parsed.experienceYears ? `${parsed.experienceYears}` : 'Practical / Academic Experience';
  if (sumEl) sumEl.innerText = parsed.summary || 'Verified candidate credentials across evaluated competencies.';

  // Side-by-Side Comparator
  const parsedList = document.getElementById('side-by-side-parsed-list');
  const currentList = document.getElementById('side-by-side-current-list');

  const comparison = assessment.sideBySideComparison || [];

  if (parsedList) {
    parsedList.innerHTML = comparison.map((item, i) => {
      const confBadgeColor = (item.confidence || item.confidenceScore || 0) >= 90
        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
        : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300';
      const skillName = item.skill || item.skillName || 'Competency';
      const category = item.category || 'Technical Competency';
      const confScore = item.confidence !== undefined ? item.confidence : (item.confidenceScore || 85);
      return `
        <div class="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2 overflow-hidden">
            <input type="checkbox" id="merge-chk-${i}" data-skill="${skillName}" data-category="${category}" checked class="merge-skill-checkbox rounded text-purple-600 bg-white dark:bg-gray-900 border-slate-300 dark:border-gray-700 focus:ring-purple-500 cursor-pointer">
            <div class="overflow-hidden">
              <span class="font-bold text-slate-800 dark:text-gray-200 block truncate">${skillName}</span>
              <span class="text-[10px] text-slate-400 font-mono">${category}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${confBadgeColor} shrink-0">
            ${confScore}% Conf
          </span>
        </div>
      `;
    }).join('');
  }

  if (currentList) {
    currentList.innerHTML = comparison.map(item => {
      const skillName = item.skill || item.skillName || 'Competency';
      const bLevel = item.benchmarkLevel || `${item.targetBenchmark || 85}%`;
      const isAlready = item.alreadyInProfile !== undefined ? item.alreadyInProfile : item.parsedFromResume;
      return `
      <div class="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
        <div>
          <span class="font-medium text-slate-700 dark:text-gray-300 block">${skillName}</span>
          <span class="text-[10px] text-slate-400">Target Role Benchmark: ${bLevel}</span>
        </div>
        <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
          isAlready 
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200' 
            : 'bg-slate-100 dark:bg-gray-800 text-slate-500'
        }">
          ${isAlready ? '✓ In Profile' : 'Not Merged'}
        </span>
      </div>
    `;
    }).join('');
  }

  // Diagnostics: Strengths
  const strBox = document.getElementById('diagnostic-strengths-box');
  const strCount = document.getElementById('strengths-count');
  const diag = assessment.diagnostics || {
    topContributingSkills: assessment.strengths || [],
    criticalGaps: assessment.criticalGaps || [],
    actionRecommendations: Array.isArray(assessment.actionRecommendation) 
      ? assessment.actionRecommendation 
      : (assessment.actionRecommendation ? [assessment.actionRecommendation] : [])
  };
  const strengths = diag.topContributingSkills || [];

  if (strBox) {
    strBox.innerHTML = strengths.map(s => `
      <span class="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
        <span class="material-symbols-outlined text-[13px] align-middle text-emerald-500 mr-0.5">check_circle</span>${s.skill || s.name || s}
      </span>
    `).join('');
  }
  if (strCount) strCount.innerText = `${strengths.length} Validated`;

  // Diagnostics: Critical Gaps
  const gapsBox = document.getElementById('diagnostic-critical-gaps-box');
  const gapsCount = document.getElementById('critical-gaps-count');
  const gaps = diag.criticalGaps || [];

  if (gapsBox) {
    gapsBox.innerHTML = gaps.map(g => `
      <span class="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200 font-medium">
        <span class="material-symbols-outlined text-[13px] align-middle text-amber-500 mr-0.5">info</span>${g.skill || g.name || g}
      </span>
    `).join('');
  }
  if (gapsCount) gapsCount.innerText = `${gaps.length} Gaps`;

  // Diagnostics: Actions
  const actionsBox = document.getElementById('diagnostic-actions-box');
  const actions = diag.actionRecommendations || (Array.isArray(assessment.actionRecommendation) ? assessment.actionRecommendation : (assessment.actionRecommendation ? [assessment.actionRecommendation] : []));

  if (actionsBox) {
    actionsBox.innerHTML = (actions.length > 0 ? actions : ['Engage in institutional lab modules to bridge benchmark gaps.']).map(a => `
      <div class="flex items-start gap-2">
        <span class="text-purple-600 mt-0.5">•</span>
        <span>${a}</span>
      </div>
    `).join('');
  }

  // Render Radar Chart
  renderResumeRadarChart(assessment.radarComparison);

  // Update Printable Dossier
  updateDossierContent(parsed, assessment, targetRole);

  container.scrollIntoView({ behavior: 'smooth' });
}

function renderResumeRadarChart(radarData) {
  const canvas = document.getElementById('resume-benchmark-radar-chart');
  if (!canvas || !window['Chart']) return;

  if (resumeRadarChartInstance) {
    resumeRadarChartInstance.destroy();
  }

  const isDark = document.documentElement.classList.contains('dark');
  const labels = (radarData && radarData.labels) || ['Pharmacology', 'Chromatography', 'Health-Data', 'Formulation', 'Informatics'];
  const candidateScores = (radarData && (radarData.candidate || radarData.parsedDataset)) || [80, 60, 75, 90, 65];
  const benchmarkScores = (radarData && (radarData.benchmark || radarData.benchmarkDataset)) || [90, 85, 80, 85, 75];

  resumeRadarChartInstance = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Candidate Parsed Vector',
          data: candidateScores,
          backgroundColor: 'rgba(147, 51, 234, 0.25)',
          borderColor: '#9333ea',
          borderWidth: 2,
          pointBackgroundColor: '#9333ea'
        },
        {
          label: 'Target Benchmark Mandate',
          data: benchmarkScores,
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          borderColor: '#06b6d4',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#06b6d4'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' },
          angleLines: { color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' },
          pointLabels: {
            font: { family: 'Inter', size: 10, weight: '600' },
            color: isDark ? '#e2e8f0' : '#334155'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { family: 'Inter', size: 10 },
            color: isDark ? '#94a3b8' : '#64748b'
          }
        }
      }
    }
  });
}

function toggleSelectAllSkills(checked) {
  document.querySelectorAll('.merge-skill-checkbox').forEach(cb => cb.checked = checked);
}

async function handleMergeSelectedSkills() {
  const checkboxes = document.querySelectorAll('.merge-skill-checkbox:checked');
  if (checkboxes.length === 0) {
    showToast('Please select at least one skill to merge.', 'No Skills Selected', 'warning');
    return;
  }

  const selectedSkills = [];
  checkboxes.forEach(cb => {
    selectedSkills.push({
      skill: cb.dataset.skill,
      category: cb.dataset.category,
      proficiency: 4
    });
  });

  const res = await JoblexApiClient.mergeResumeProfile(selectedSkills);
  if (res && res.success) {
    showToast(`Merged ${res.mergedCount} skills into your Live Institutional Profile`, 'Profile Updated', 'success');
    checkboxes.forEach(cb => {
      const parent = cb.closest('div');
      if (parent) parent.classList.add('opacity-60');
    });
  } else {
    showToast('Failed to merge skills to profile.', 'Error', 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// PROMPT GIVER & AI RESUME OPTIMIZER COPILOT (Zulu AI)
// ─────────────────────────────────────────────────────────────
let latestOptimizationData = null;

function setPromptSuggestion(promptText) {
  const promptInput = document.getElementById('resume-custom-prompt');
  if (promptInput) {
    promptInput.value = promptText;
    promptInput.focus();
  }
}

async function handleOptimizeResume() {
  const promptInput = document.getElementById('resume-custom-prompt');
  const customPrompt = promptInput ? promptInput.value.trim() : '';

  const btn = document.getElementById('btn-optimize-resume');
  const loadingIndicator = document.getElementById('optimizer-loading-state');
  const targetRole = (currentAutoAssessment && (currentAutoAssessment.targetRole || currentAutoAssessment.detectedDomain)) 
    ? (currentAutoAssessment.targetRole || currentAutoAssessment.detectedDomain) 
    : 'Professional Specialist';

  let resumeText = '';
  if (selectedResumeFile) {
    try {
      resumeText = await extractTextFromFile(selectedResumeFile);
    } catch (e) {
      console.warn('File read fallback:', e);
    }
  }
  if (!resumeText) {
    const textarea = document.getElementById('resume-textarea');
    resumeText = textarea ? textarea.value.trim() : '';
  }
  if (!resumeText && currentParsedData) {
    resumeText = `Candidate: ${currentParsedData.name || 'Scholar'}\nSummary: ${currentParsedData.summary || ''}\nEducation: ${(currentParsedData.education || []).join(', ')}\nSkills: ${(currentParsedData.extractedSkills || []).join(', ')}`;
  }
  if (!resumeText) {
      JoblexApiClient.showNoticeModal({
        title: 'No Resume Provided',
        icon: 'warning',
        message: 'Please parse a resume first or provide resume text to optimize.',
        confirmText: 'Close'
      });
    return;
  }

  const currentSkills = (currentParsedData && currentParsedData.extractedSkills && currentParsedData.extractedSkills.length > 0)
    ? currentParsedData.extractedSkills
    : [];

  const outputContainer = document.getElementById('optimizer-results-container');

  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  }
  if (loadingIndicator) loadingIndicator.classList.remove('hidden');
  if (outputContainer) outputContainer.classList.add('hidden');

  try {
    const payload = {
      resumeText,
      customPrompt: customPrompt || 'Tailor my resume summary and bullet points to highlight highest-impact technical competencies and align with top industry hiring standards.',
      targetRole,
      currentSkills
    };

    const response = await JoblexApiClient.optimizeResume(payload);

    if (response && response.success && response.optimization) {
      latestOptimizationData = response.optimization;
      renderOptimizationResults(response.optimization, response.provider, targetRole);
      if (outputContainer) {
        outputContainer.classList.remove('hidden');
        outputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      showToast('Resume tailored with AI Copilot successfully!', 'Optimization Ready', 'success');
    } else {
      showToast('Optimization could not be completed. Please try again.', 'Error', 'error');
    }
  } catch (err) {
    console.error('Error optimizing resume:', err);
    showToast('Failed to connect to AI Resume Optimizer.', 'Error', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
  }
}

function renderOptimizationResults(opt, provider, targetRole) {
  // Provider badge
  const providerEl = document.getElementById('optimizer-provider-badge');
  if (providerEl) {
    providerEl.innerText = 'Zulu AI Copilot';
  }

  // Confidence
  const confEl = document.getElementById('optimizer-confidence-score');
  if (confEl) {
    confEl.innerText = `${opt.confidenceScore || 92}% Match`;
  }

  // Revised Summary
  const sumEl = document.getElementById('optimizer-revised-summary');
  if (sumEl) {
    sumEl.innerText = opt.revisedSummary || 'No summary generated.';
  }

  // Tailored Bullets
  const bulletsEl = document.getElementById('optimizer-tailored-bullets');
  if (bulletsEl) {
    const bullets = opt.tailoredBulletPoints || [];
    bulletsEl.innerHTML = bullets.map(b => `
      <li class="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-black/30 border border-purple-100 dark:border-purple-900/30 text-xs text-slate-700 dark:text-gray-200">
        <span class="material-symbols-outlined text-purple-600 dark:text-purple-400 text-sm mt-0.5 shrink-0">check_circle</span>
        <span class="flex-1">${b}</span>
        <button type="button" onclick="copyOptimizedText('${b.replace(/'/g, "\\'")}')" title="Copy Bullet" class="text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 p-1 shrink-0">
          <span class="material-symbols-outlined text-[15px]">content_copy</span>
        </button>
      </li>
    `).join('');
  }

  // Recommended Keywords
  const kwEl = document.getElementById('optimizer-recommended-keywords');
  if (kwEl) {
    const kws = opt.recommendedKeywords || [];
    kwEl.innerHTML = kws.map(k => `
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-medium text-purple-800 dark:text-purple-300">
        <span>+</span><span>${k}</span>
      </span>
    `).join('');
  }

  // Structural Suggestions
  const suggEl = document.getElementById('optimizer-structural-suggestions');
  if (suggEl) {
    const suggestions = opt.structuralSuggestions || [];
    suggEl.innerHTML = suggestions.map(s => `
      <div class="flex items-start gap-2 text-xs text-slate-600 dark:text-gray-300">
        <span class="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">lightbulb</span>
        <span>${s}</span>
      </div>
    `).join('');
  }
}

function applyOptimizedSummary() {
  if (!latestOptimizationData || !latestOptimizationData.revisedSummary) {
    showToast('No revised summary available to apply.', 'Notice', 'info');
    return;
  }
  const sumEl = document.getElementById('parsed-candidate-summary');
  if (sumEl) {
    sumEl.innerText = latestOptimizationData.revisedSummary;
  }
  if (currentParsedData) {
    currentParsedData.summary = latestOptimizationData.revisedSummary;
  }
  const txt = document.getElementById('resume-textarea');
  if (txt && txt.value) {
    txt.value = `SUMMARY:\n${latestOptimizationData.revisedSummary}\n\n` + txt.value;
  }
  showToast('Revised summary applied to Candidate Profile & Dossier!', 'Summary Updated', 'success');
}

function copyOptimizedSummary() {
  if (!latestOptimizationData || !latestOptimizationData.revisedSummary) return;
  navigator.clipboard.writeText(latestOptimizationData.revisedSummary).then(() => {
    showToast('Summary copied to clipboard!', 'Copied', 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard.', 'Error', 'error');
  });
}

function copyOptimizedText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'Copied', 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard.', 'Error', 'error');
  });
}

window.handleOptimizeResume = handleOptimizeResume;
window.setPromptSuggestion = setPromptSuggestion;
window.applyOptimizedSummary = applyOptimizedSummary;
window.copyOptimizedSummary = copyOptimizedSummary;
window.copyOptimizedText = copyOptimizedText;

// ─────────────────────────────────────────────────────────────
// INTERACTIVE RESUME BUILDER & ATS PDF EXPORTER (POWERED BY ZULU AI)
// ─────────────────────────────────────────────────────────────

let resumeBuilderState = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  links: '',
  summary: '',
  skills: '',
  experiences: [],
  projects: [],
  educations: [],
  certifications: ''
};

function escapeResumeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openResumeBuilderModal(mode) {
  const modal = document.getElementById('resume-builder-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (mode === 'parsed') {
    syncParsedDataToBuilder();
  } else if (mode === 'optimized') {
    syncParsedDataToBuilder();
    applyOptimizedDataToState();
  } else if (!resumeBuilderState.name && !resumeBuilderState.email) {
    if (currentParsedData) {
      syncParsedDataToBuilder();
    } else {
      initBuilderFromUserOrSample();
    }
  }

  populateBuilderFormFields();
  renderResumeLivePreview();
}

function closeResumeBuilderModal() {
  const modal = document.getElementById('resume-builder-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function initBuilderFromUserOrSample() {
  const user = (typeof JoblexApiClient !== 'undefined' && JoblexApiClient.getUser) 
    ? JoblexApiClient.getUser() 
    : JSON.parse(localStorage.getItem('joblex_user') || '{}');

  if (user && (user.name || user.email)) {
    resumeBuilderState.name = user.name || 'Scholar Candidate';
    resumeBuilderState.email = user.email || 'student@joblex.edu';
    resumeBuilderState.phone = user.phone || '+91 98765 43210';
    resumeBuilderState.location = user.location || 'Bengaluru, India';
    resumeBuilderState.title = user.fieldOfStudy || user.stream || 'Technology & Applied Sciences Specialist';
    resumeBuilderState.links = 'linkedin.com/in/candidate • github.com/candidate';
    resumeBuilderState.summary = 'Motivated and results-oriented professional with a strong academic foundation, demonstrated practical project competencies, and a proactive drive for continuous technical excellence.';
    resumeBuilderState.skills = Array.isArray(user.verified_skills) && user.verified_skills.length > 0
      ? user.verified_skills.join(', ')
      : 'Python, JavaScript, Data Analysis, Git, Problem Solving, Technical Documentation, Team Leadership';

    resumeBuilderState.experiences = [
      {
        id: Date.now() + 1,
        role: 'Research & Project Trainee',
        company: 'Academic & Industry Research Labs',
        dates: '2025 – Present',
        location: 'Bengaluru, India',
        bullets: '• Spearheaded technical prototyping and data evaluation workflows with cross-functional teams.\n• Optimized process turnaround times by 35% through standardized procedural protocols.\n• Prepared institutional audit trails and peer-level technical documentation.'
      }
    ];

    resumeBuilderState.projects = [
      {
        id: Date.now() + 2,
        title: 'Core System Implementation & Diagnostic Analysis',
        tech: 'Technical Protocols, Modern Frameworks, Analytics',
        link: 'github.com/candidate/project-core',
        bullets: '• Designed and deployed scalable pipeline architecture tested against industrial benchmarks.\n• Integrated automated verification workflows reducing validation discrepancies by 40%.'
      }
    ];

    resumeBuilderState.educations = [
      {
        id: Date.now() + 3,
        degree: user.fieldOfStudy ? `Bachelor of Technology / Science (${user.fieldOfStudy})` : 'Bachelor of Technology',
        institution: user.college || user.institution || 'National Institute of Technology / University',
        year: '2022 – 2026',
        score: 'CGPA: 8.8 / 10.0'
      }
    ];

    resumeBuilderState.certifications = '• National Technical Excellence Certification (Elite Honor)\n• Joblex Verified Competency Dossier (Hash: 0x9B44...F022)';
  } else {
    loadResumeSampleTemplate();
  }
}

function loadResumeSampleTemplate() {
  resumeBuilderState = {
    name: 'Alex Sharma',
    title: 'Full Stack Software Engineer | Distributed Systems',
    email: 'alex.sharma@example.edu',
    phone: '+91 98765 43210',
    location: 'Bengaluru, Karnataka, India',
    links: 'linkedin.com/in/alex-sharma • github.com/alexsharma • alexsharma.dev',
    summary: 'Results-driven Software Engineer with hands-on experience architecting scalable full-stack web applications, microservices, and asynchronous event pipelines. Proven track record in optimizing backend latency by 45% and designing accessible, high-performance user interfaces aligned with enterprise standards.',
    skills: 'JavaScript (ES6+), TypeScript, React.js, Node.js, Express, Python, PostgreSQL, MongoDB, Redis, Docker, AWS (S3, EC2), REST APIs, GraphQL, Git, CI/CD, Jest',
    experiences: [
      {
        id: Date.now() + 10,
        role: 'Full Stack Engineering Intern',
        company: 'HyperScale Technologies',
        dates: 'Jun 2025 – Dec 2025',
        location: 'Bengaluru, India',
        bullets: '• Developed and maintained 14+ RESTful endpoints serving 50k+ daily requests with 99.9% uptime.\n• Refactored SQL query execution plans with indexing, cutting average database response times from 340ms to 85ms.\n• Built responsive customer dashboards in React with real-time WebSocket state synchronization.'
      },
      {
        id: Date.now() + 11,
        role: 'Software Development Trainee',
        company: 'TechCorp Innovation Labs',
        dates: 'Jan 2025 – May 2025',
        location: 'Hyderabad, India',
        bullets: '• Collaborated with senior engineers to implement JWT-based authentication and RBAC authorization.\n• Wrote comprehensive unit and integration test suites in Jest achieving 92% code coverage.'
      }
    ],
    projects: [
      {
        id: Date.now() + 20,
        title: 'Distributed Real-Time Collaborative Canvas',
        tech: 'React, Node.js, WebSockets, Redis, Canvas API',
        link: 'github.com/alexsharma/canvas-sync',
        bullets: '• Engineered a conflict-free replicated data engine supporting simultaneous multi-user drawing.\n• Leveraged Redis Pub/Sub to scale room message broadcasts across multiple Node.js instances with <20ms latency.'
      },
      {
        id: Date.now() + 21,
        title: 'AI Resume & Skill Gap Matcher',
        tech: 'Python, FastAPI, SentenceTransformers, PostgreSQL, Docker',
        link: 'github.com/alexsharma/ai-resume-parser',
        bullets: '• Built vector embedding matching pipeline comparing candidate resumes against 100+ industry job descriptions.\n• Containerized the complete application stack with Docker Compose for seamless zero-downtime deployment.'
      }
    ],
    educations: [
      {
        id: Date.now() + 30,
        degree: 'Bachelor of Technology in Computer Science & Engineering',
        institution: 'National Institute of Technology (NIT)',
        year: '2022 – 2026',
        score: 'CGPA: 8.9 / 10.0'
      }
    ],
    certifications: '• AWS Certified Solutions Architect – Associate (2025)\n• NPTEL Elite Gold Certificate in Cloud Computing & Distributed Systems\n• Meta Certified Frontend Developer Specialization'
  };

  populateBuilderFormFields();
  renderResumeLivePreview();
  showToast('Loaded professional ATS resume template!', 'Template Ready', 'info');
}

function syncParsedDataToBuilder() {
  let pData = currentParsedData;
  if (!pData) {
    const cached = sessionStorage.getItem('joblex_latest_parsed_resume');
    if (cached) {
      try {
        const d = JSON.parse(cached);
        if (d.parsed) pData = d.parsed;
        if (d.assessment) currentAutoAssessment = d.assessment;
      } catch (e) {}
    }
  }

  if (!pData) {
    showToast('No parsed resume detected in current session. Enter details directly or use template.', 'Notice', 'info');
    initBuilderFromUserOrSample();
    return;
  }

  if (pData.name && pData.name !== 'Scholar Candidate') {
    resumeBuilderState.name = pData.name;
  } else if (!resumeBuilderState.name) {
    const user = (typeof JoblexApiClient !== 'undefined' && JoblexApiClient.getUser) ? JoblexApiClient.getUser() : null;
    resumeBuilderState.name = user?.name || 'Candidate';
  }

  if (pData.email) resumeBuilderState.email = pData.email;
  if (currentAutoAssessment?.targetRole) {
    resumeBuilderState.title = currentAutoAssessment.targetRole;
  } else if (pData.experienceYears) {
    resumeBuilderState.title = `${pData.experienceYears} Specialist`;
  }

  if (pData.summary) resumeBuilderState.summary = pData.summary;

  if (Array.isArray(pData.extractedSkills) && pData.extractedSkills.length > 0) {
    resumeBuilderState.skills = pData.extractedSkills.join(', ');
  }

  if (Array.isArray(pData.education) && pData.education.length > 0) {
    resumeBuilderState.educations = pData.education.map((edu, idx) => ({
      id: Date.now() + idx + 50,
      degree: edu,
      institution: 'Accredited University / Institute',
      year: '2022 – 2026',
      score: 'First Class with Distinction'
    }));
  }

  if (!resumeBuilderState.experiences || resumeBuilderState.experiences.length === 0) {
    resumeBuilderState.experiences = [
      {
        id: Date.now() + 60,
        role: resumeBuilderState.title || 'Technical Specialist',
        company: 'Institutional Project & Innovation Center',
        dates: '2024 – Present',
        location: 'India',
        bullets: '• Executed core project deliverables adhering to industry frameworks and analytical protocols.\n• Documented systematic workflows and validated experimental benchmarks with high accuracy.'
      }
    ];
  }

  populateBuilderFormFields();
  renderResumeLivePreview();
  showToast('Synced parsed credentials into Resume Maker!', 'Synced', 'success');
}

function openResumeBuilderWithParsedData() {
  openResumeBuilderModal('parsed');
}

function openResumeBuilderWithOptimizedData() {
  openResumeBuilderModal('optimized');
}

function applyOptimizedDataToState() {
  if (!latestOptimizationData) return;

  if (latestOptimizationData.revisedSummary) {
    resumeBuilderState.summary = latestOptimizationData.revisedSummary;
  }

  if (Array.isArray(latestOptimizationData.recommendedKeywords) && latestOptimizationData.recommendedKeywords.length > 0) {
    const existing = resumeBuilderState.skills ? resumeBuilderState.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    latestOptimizationData.recommendedKeywords.forEach(k => {
      if (!existing.includes(k)) existing.push(k);
    });
    resumeBuilderState.skills = existing.join(', ');
  }

  if (Array.isArray(latestOptimizationData.tailoredBulletPoints) && latestOptimizationData.tailoredBulletPoints.length > 0) {
    if (!resumeBuilderState.experiences || resumeBuilderState.experiences.length === 0) {
      resumeBuilderState.experiences = [
        {
          id: Date.now() + 70,
          role: resumeBuilderState.title || 'Specialist Engineer',
          company: 'Industry Capstone Organization',
          dates: '2024 – Present',
          location: 'Bengaluru, India',
          bullets: latestOptimizationData.tailoredBulletPoints.map(b => `• ${b}`).join('\n')
        }
      ];
    } else {
      resumeBuilderState.experiences[0].bullets = latestOptimizationData.tailoredBulletPoints.map(b => `• ${b}`).join('\n');
    }
  }

  populateBuilderFormFields();
  renderResumeLivePreview();
  showToast('Applied Zulu AI Optimized Summary & Tailored Bullets!', 'Zulu AI Applied', 'success');
}

function populateBuilderFormFields() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('rb-name', resumeBuilderState.name);
  setVal('rb-title', resumeBuilderState.title);
  setVal('rb-email', resumeBuilderState.email);
  setVal('rb-phone', resumeBuilderState.phone);
  setVal('rb-location', resumeBuilderState.location);
  setVal('rb-links', resumeBuilderState.links);
  setVal('rb-summary', resumeBuilderState.summary);
  setVal('rb-skills', resumeBuilderState.skills);
  setVal('rb-certifications', resumeBuilderState.certifications);

  renderExperienceEntries();
  renderProjectEntries();
  renderEducationEntries();
}

function handleResumeFieldInput() {
  const getVal = id => (document.getElementById(id)?.value || '').trim();

  resumeBuilderState.name = getVal('rb-name');
  resumeBuilderState.title = getVal('rb-title');
  resumeBuilderState.email = getVal('rb-email');
  resumeBuilderState.phone = getVal('rb-phone');
  resumeBuilderState.location = getVal('rb-location');
  resumeBuilderState.links = getVal('rb-links');
  resumeBuilderState.summary = document.getElementById('rb-summary')?.value || '';
  resumeBuilderState.skills = document.getElementById('rb-skills')?.value || '';
  resumeBuilderState.certifications = document.getElementById('rb-certifications')?.value || '';

  renderResumeLivePreview();
}

function renderExperienceEntries() {
  const container = document.getElementById('rb-experience-container');
  if (!container) return;

  if (!resumeBuilderState.experiences || resumeBuilderState.experiences.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic p-2">No experience entries added yet. Click "+ Add Position" above.</p>`;
    return;
  }

  container.innerHTML = resumeBuilderState.experiences.map((exp, idx) => `
    <div class="p-3.5 rounded-xl bg-white dark:bg-[#101115] border border-slate-200 dark:border-gray-700 space-y-2.5 text-xs relative">
      <div class="flex items-center justify-between">
        <span class="font-bold text-slate-700 dark:text-gray-300">Position #${idx + 1}</span>
        <button type="button" onclick="removeExperienceEntry(${exp.id})" class="text-slate-400 hover:text-red-500 transition p-1" title="Remove position">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Role / Title</label>
          <input type="text" value="${escapeResumeHtml(exp.role || '')}" oninput="updateExperienceField(${exp.id}, 'role', this.value)" placeholder="e.g. Software Engineer Intern" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Company / Organization</label>
          <input type="text" value="${escapeResumeHtml(exp.company || '')}" oninput="updateExperienceField(${exp.id}, 'company', this.value)" placeholder="e.g. Acme Corp" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Date Range / Duration</label>
          <input type="text" value="${escapeResumeHtml(exp.dates || '')}" oninput="updateExperienceField(${exp.id}, 'dates', this.value)" placeholder="e.g. Jan 2025 – Present" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Location</label>
          <input type="text" value="${escapeResumeHtml(exp.location || '')}" oninput="updateExperienceField(${exp.id}, 'location', this.value)" placeholder="e.g. Bengaluru, India" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
      </div>
      <div>
        <div class="flex items-center justify-between mb-0.5">
          <label class="block text-[10px] text-slate-400 font-semibold">Bullet Points (One per line):</label>
          <button type="button" onclick="insertTailoredBulletsIntoExp(${exp.id})" class="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5">
            <span class="material-symbols-outlined text-[12px]">auto_fix_high</span>
            <span>Insert AI Bullets</span>
          </button>
        </div>
        <textarea rows="3" oninput="updateExperienceField(${exp.id}, 'bullets', this.value)" placeholder="• Implemented high-throughput data processing pipeline...\n• Reduced query execution latency by 40%..." class="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white leading-relaxed text-xs">${escapeResumeHtml(exp.bullets || '')}</textarea>
      </div>
    </div>
  `).join('');
}

function addExperienceEntry() {
  if (!resumeBuilderState.experiences) resumeBuilderState.experiences = [];
  resumeBuilderState.experiences.push({
    id: Date.now(),
    role: '',
    company: '',
    dates: '',
    location: '',
    bullets: ''
  });
  renderExperienceEntries();
  renderResumeLivePreview();
}

function removeExperienceEntry(id) {
  resumeBuilderState.experiences = resumeBuilderState.experiences.filter(e => e.id !== id);
  renderExperienceEntries();
  renderResumeLivePreview();
}

function updateExperienceField(id, field, value) {
  const item = resumeBuilderState.experiences.find(e => e.id === id);
  if (item) {
    item[field] = value;
    renderResumeLivePreview();
  }
}

function insertTailoredBulletsIntoExp(expId) {
  if (latestOptimizationData && Array.isArray(latestOptimizationData.tailoredBulletPoints) && latestOptimizationData.tailoredBulletPoints.length > 0) {
    const item = resumeBuilderState.experiences.find(e => e.id === expId);
    if (item) {
      item.bullets = latestOptimizationData.tailoredBulletPoints.map(b => `• ${b}`).join('\n');
      renderExperienceEntries();
      renderResumeLivePreview();
      showToast('Inserted tailored bullet points from Zulu AI!', 'Bullets Added', 'success');
    }
  } else {
    showToast('Run the AI Prompt Optimizer first to generate tailored bullets.', 'Notice', 'info');
  }
}

function renderProjectEntries() {
  const container = document.getElementById('rb-projects-container');
  if (!container) return;

  if (!resumeBuilderState.projects || resumeBuilderState.projects.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic p-2">No projects added yet. Click "+ Add Project" above.</p>`;
    return;
  }

  container.innerHTML = resumeBuilderState.projects.map((proj, idx) => `
    <div class="p-3.5 rounded-xl bg-white dark:bg-[#101115] border border-slate-200 dark:border-gray-700 space-y-2.5 text-xs relative">
      <div class="flex items-center justify-between">
        <span class="font-bold text-slate-700 dark:text-gray-300">Project #${idx + 1}</span>
        <button type="button" onclick="removeProjectEntry(${proj.id})" class="text-slate-400 hover:text-red-500 transition p-1" title="Remove project">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Project Title</label>
          <input type="text" value="${escapeResumeHtml(proj.title || '')}" oninput="updateProjectField(${proj.id}, 'title', this.value)" placeholder="e.g. Distributed Analytics Engine" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Technologies / Tools</label>
          <input type="text" value="${escapeResumeHtml(proj.tech || '')}" oninput="updateProjectField(${proj.id}, 'tech', this.value)" placeholder="e.g. React, Node.js, Docker, AWS" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
      </div>
      <div>
        <label class="block text-[10px] text-slate-400 mb-0.5">Project / Repository Link (Optional)</label>
        <input type="text" value="${escapeResumeHtml(proj.link || '')}" oninput="updateProjectField(${proj.id}, 'link', this.value)" placeholder="e.g. github.com/username/project" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
      </div>
      <div>
        <label class="block text-[10px] text-slate-400 font-semibold mb-0.5">Key Highlights &amp; Metrics (One per line):</label>
        <textarea rows="2" oninput="updateProjectField(${proj.id}, 'bullets', this.value)" placeholder="• Architected scalable processing pipeline with 99.9% reliability..." class="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white leading-relaxed text-xs">${escapeResumeHtml(proj.bullets || '')}</textarea>
      </div>
    </div>
  `).join('');
}

function addProjectEntry() {
  if (!resumeBuilderState.projects) resumeBuilderState.projects = [];
  resumeBuilderState.projects.push({
    id: Date.now(),
    title: '',
    tech: '',
    link: '',
    bullets: ''
  });
  renderProjectEntries();
  renderResumeLivePreview();
}

function removeProjectEntry(id) {
  resumeBuilderState.projects = resumeBuilderState.projects.filter(p => p.id !== id);
  renderProjectEntries();
  renderResumeLivePreview();
}

function updateProjectField(id, field, value) {
  const item = resumeBuilderState.projects.find(p => p.id === id);
  if (item) {
    item[field] = value;
    renderResumeLivePreview();
  }
}

function renderEducationEntries() {
  const container = document.getElementById('rb-education-container');
  if (!container) return;

  if (!resumeBuilderState.educations || resumeBuilderState.educations.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic p-2">No education entries added yet. Click "+ Add Education" above.</p>`;
    return;
  }

  container.innerHTML = resumeBuilderState.educations.map((edu, idx) => `
    <div class="p-3.5 rounded-xl bg-white dark:bg-[#101115] border border-slate-200 dark:border-gray-700 space-y-2.5 text-xs relative">
      <div class="flex items-center justify-between">
        <span class="font-bold text-slate-700 dark:text-gray-300">Degree #${idx + 1}</span>
        <button type="button" onclick="removeEducationEntry(${edu.id})" class="text-slate-400 hover:text-red-500 transition p-1" title="Remove degree">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Degree / Certification</label>
          <input type="text" value="${escapeResumeHtml(edu.degree || '')}" oninput="updateEducationField(${edu.id}, 'degree', this.value)" placeholder="e.g. Bachelor of Technology" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Institution / University</label>
          <input type="text" value="${escapeResumeHtml(edu.institution || '')}" oninput="updateEducationField(${edu.id}, 'institution', this.value)" placeholder="e.g. National Institute of Technology" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Graduation Year / Range</label>
          <input type="text" value="${escapeResumeHtml(edu.year || '')}" oninput="updateEducationField(${edu.id}, 'year', this.value)" placeholder="e.g. 2022 – 2026" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 mb-0.5">Grade / CGPA</label>
          <input type="text" value="${escapeResumeHtml(edu.score || '')}" oninput="updateEducationField(${edu.id}, 'score', this.value)" placeholder="e.g. CGPA: 8.9 / 10.0" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 outline-none text-slate-900 dark:text-white">
        </div>
      </div>
    </div>
  `).join('');
}

function addEducationEntry() {
  if (!resumeBuilderState.educations) resumeBuilderState.educations = [];
  resumeBuilderState.educations.push({
    id: Date.now(),
    degree: '',
    institution: '',
    year: '',
    score: ''
  });
  renderEducationEntries();
  renderResumeLivePreview();
}

function removeEducationEntry(id) {
  resumeBuilderState.educations = resumeBuilderState.educations.filter(e => e.id !== id);
  renderEducationEntries();
  renderResumeLivePreview();
}

function updateEducationField(id, field, value) {
  const item = resumeBuilderState.educations.find(e => e.id === id);
  if (item) {
    item[field] = value;
    renderResumeLivePreview();
  }
}

function insertAiSummaryIntoBuilder() {
  if (latestOptimizationData && latestOptimizationData.revisedSummary) {
    resumeBuilderState.summary = latestOptimizationData.revisedSummary;
    const el = document.getElementById('rb-summary');
    if (el) el.value = latestOptimizationData.revisedSummary;
    renderResumeLivePreview();
    showToast('Inserted Zulu AI rewritten professional summary!', 'Summary Updated', 'success');
  } else {
    showToast('Run the AI Prompt Optimizer first to generate a tailored summary.', 'Notice', 'info');
  }
}

function importParsedSkillsIntoBuilder() {
  if (currentParsedData && Array.isArray(currentParsedData.extractedSkills) && currentParsedData.extractedSkills.length > 0) {
    const existing = resumeBuilderState.skills ? resumeBuilderState.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    currentParsedData.extractedSkills.forEach(s => {
      if (!existing.includes(s)) existing.push(s);
    });
    resumeBuilderState.skills = existing.join(', ');
    const el = document.getElementById('rb-skills');
    if (el) el.value = resumeBuilderState.skills;
    renderResumeLivePreview();
    showToast(`Imported ${currentParsedData.extractedSkills.length} verified resume skills!`, 'Skills Imported', 'success');
  } else {
    showToast('No parsed resume skills detected in current session.', 'Notice', 'info');
  }
}

function renderResumeLivePreview() {
  const sheet = document.getElementById('resume-preview-sheet');
  if (!sheet) return;

  const name = resumeBuilderState.name || 'Candidate Name';
  const title = resumeBuilderState.title || '';
  const email = resumeBuilderState.email || '';
  const phone = resumeBuilderState.phone || '';
  const location = resumeBuilderState.location || '';
  const links = resumeBuilderState.links || '';

  // Contact line items
  const contactParts = [email, phone, location, links].filter(Boolean);
  const contactLine = contactParts.map(p => `<span>${escapeResumeHtml(p)}</span>`).join(`<span style="color: #94a3b8;"> • </span>`);

  // Parse bullets helper
  const formatBullets = raw => {
    if (!raw) return '';
    const lines = raw.split('\n').map(l => l.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean);
    if (lines.length === 0) return '';
    return `<ul style="list-style-type: disc; padding-left: 1.25rem; margin-top: 0.25rem; margin-bottom: 0.25rem; font-size: 11px; line-height: 1.45; color: #1e293b;">
      ${lines.map(l => `<li style="margin-bottom: 2px;">${escapeResumeHtml(l)}</li>`).join('')}
    </ul>`;
  };

  // Sections
  let summaryHtml = '';
  if (resumeBuilderState.summary && resumeBuilderState.summary.trim()) {
    summaryHtml = `
      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px;">
          Professional Summary
        </div>
        <p style="font-size: 11px; line-height: 1.5; color: #1e293b; text-align: justify; margin: 0;">
          ${escapeResumeHtml(resumeBuilderState.summary)}
        </p>
      </div>
    `;
  }

  let skillsHtml = '';
  if (resumeBuilderState.skills && resumeBuilderState.skills.trim()) {
    const skillList = resumeBuilderState.skills.split(',').map(s => s.trim()).filter(Boolean);
    skillsHtml = `
      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px;">
          Technical &amp; Core Competencies
        </div>
        <div style="font-size: 11px; line-height: 1.6; color: #1e293b;">
          <strong>Core Skills:</strong> ${skillList.map(s => escapeResumeHtml(s)).join(', ')}
        </div>
      </div>
    `;
  }

  let experienceHtml = '';
  if (Array.isArray(resumeBuilderState.experiences) && resumeBuilderState.experiences.length > 0) {
    const validExp = resumeBuilderState.experiences.filter(e => e.role || e.company || e.bullets);
    if (validExp.length > 0) {
      experienceHtml = `
        <div style="margin-top: 14px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px;">
            Work &amp; Internship Experience
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${validExp.map(exp => `
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 11px;">
                  <div>
                    <strong style="color: #0f172a;">${escapeResumeHtml(exp.role || 'Specialist')}</strong>
                    ${exp.company ? `<span style="color: #475569;"> | ${escapeResumeHtml(exp.company)}</span>` : ''}
                  </div>
                  <div style="font-size: 10px; color: #475569; font-weight: 500;">
                    ${escapeResumeHtml(exp.dates || '')} ${exp.location ? `• ${escapeResumeHtml(exp.location)}` : ''}
                  </div>
                </div>
                ${formatBullets(exp.bullets)}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  let projectsHtml = '';
  if (Array.isArray(resumeBuilderState.projects) && resumeBuilderState.projects.length > 0) {
    const validProj = resumeBuilderState.projects.filter(p => p.title || p.tech || p.bullets);
    if (validProj.length > 0) {
      projectsHtml = `
        <div style="margin-top: 14px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px;">
            Academic &amp; Engineering Projects
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${validProj.map(proj => `
              <div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 11px;">
                  <div>
                    <strong style="color: #0f172a;">${escapeResumeHtml(proj.title || 'Project')}</strong>
                    ${proj.tech ? `<span style="color: #64748b; font-size: 10px;"> (${escapeResumeHtml(proj.tech)})</span>` : ''}
                  </div>
                  ${proj.link ? `<div style="font-size: 10px; color: #2563eb; font-family: monospace;">${escapeResumeHtml(proj.link)}</div>` : ''}
                </div>
                ${formatBullets(proj.bullets)}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  let educationHtml = '';
  if (Array.isArray(resumeBuilderState.educations) && resumeBuilderState.educations.length > 0) {
    const validEdu = resumeBuilderState.educations.filter(e => e.degree || e.institution);
    if (validEdu.length > 0) {
      educationHtml = `
        <div style="margin-top: 14px;">
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px;">
            Education &amp; Academics
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${validEdu.map(edu => `
              <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 11px;">
                <div>
                  <strong style="color: #0f172a;">${escapeResumeHtml(edu.degree || 'Degree')}</strong>
                  ${edu.institution ? `<span style="color: #475569;"> — ${escapeResumeHtml(edu.institution)}</span>` : ''}
                  ${edu.score ? `<span style="color: #059669; font-weight: 600; font-size: 10px;"> (${escapeResumeHtml(edu.score)})</span>` : ''}
                </div>
                <div style="font-size: 10px; color: #475569; font-weight: 500;">
                  ${escapeResumeHtml(edu.year || '')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  let certHtml = '';
  if (resumeBuilderState.certifications && resumeBuilderState.certifications.trim()) {
    certHtml = `
      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin-bottom: 6px;">
          Certifications &amp; Distinctions
        </div>
        ${formatBullets(resumeBuilderState.certifications)}
      </div>
    `;
  }

  sheet.innerHTML = `
    <div style="font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; background-color: #ffffff; padding: 0;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">
        <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; margin: 0; color: #0f172a;">
          ${escapeResumeHtml(name)}
        </h1>
        ${title ? `
          <div style="font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 3px;">
            ${escapeResumeHtml(title)}
          </div>
        ` : ''}
        ${contactLine ? `
          <div style="font-size: 10.5px; color: #475569; margin-top: 5px; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">
            ${contactLine}
          </div>
        ` : ''}
      </div>

      <!-- Content Sections -->
      ${summaryHtml}
      ${skillsHtml}
      ${experienceHtml}
      ${projectsHtml}
      ${educationHtml}
      ${certHtml}
    </div>
  `;
}

function downloadResumePdf() {
  const sheet = document.getElementById('resume-preview-sheet');
  if (!sheet) {
    showToast('Resume preview element not found.', 'Export Error', 'error');
    return;
  }

  const rawName = (resumeBuilderState.name || 'Candidate').trim();
  const safeFilename = (rawName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Candidate') + '_Resume.pdf';

  showToast('Generating high-resolution ATS Resume PDF...', 'Preparing PDF', 'info');

  const btnTop = document.getElementById('btn-download-resume-pdf-top');
  if (btnTop) {
    btnTop.disabled = true;
    btnTop.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">progress_activity</span><span>Generating...</span>`;
  }

  const opt = {
    margin: [10, 10, 10, 10], // 10mm margins for ATS standard
    filename: safeFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const finish = () => {
    if (btnTop) {
      btnTop.disabled = false;
      btnTop.innerHTML = `<span class="material-symbols-outlined text-[17px]">download</span><span>Download PDF</span>`;
    }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(sheet).save().then(() => {
      showToast('Resume PDF downloaded successfully!', 'PDF Exported', 'success');
      finish();
    }).catch(err => {
      console.error('html2pdf generation error:', err);
      showToast('Client generator fell back to print engine.', 'Notice', 'info');
      finish();
      window.print();
    });
  } else {
    finish();
    window.print();
  }
}

function printResumeDocument() {
  window.print();
}

function switchBuilderMobileTab(tab) {
  const edPane = document.getElementById('builder-editor-pane');
  const prevPane = document.getElementById('builder-preview-pane');
  const edTab = document.getElementById('tab-toggle-editor');
  const prevTab = document.getElementById('tab-toggle-preview');

  if (tab === 'editor') {
    if (edPane) edPane.classList.remove('hidden');
    if (prevPane) prevPane.classList.add('hidden');
    if (edTab) { edTab.classList.add('bg-purple-600', 'text-white'); edTab.classList.remove('text-slate-600', 'dark:text-gray-300'); }
    if (prevTab) { prevTab.classList.remove('bg-purple-600', 'text-white'); prevTab.classList.add('text-slate-600', 'dark:text-gray-300'); }
  } else {
    if (edPane) edPane.classList.add('hidden');
    if (prevPane) prevPane.classList.remove('hidden');
    if (prevTab) { prevTab.classList.add('bg-purple-600', 'text-white'); prevTab.classList.remove('text-slate-600', 'dark:text-gray-300'); }
    if (edTab) { edTab.classList.remove('bg-purple-600', 'text-white'); edTab.classList.add('text-slate-600', 'dark:text-gray-300'); }
  }
}

window.openResumeBuilderModal = openResumeBuilderModal;
window.closeResumeBuilderModal = closeResumeBuilderModal;
window.openResumeBuilderWithParsedData = openResumeBuilderWithParsedData;
window.openResumeBuilderWithOptimizedData = openResumeBuilderWithOptimizedData;
window.loadResumeSampleTemplate = loadResumeSampleTemplate;
window.syncParsedDataToBuilder = syncParsedDataToBuilder;
window.handleResumeFieldInput = handleResumeFieldInput;
window.addExperienceEntry = addExperienceEntry;
window.removeExperienceEntry = removeExperienceEntry;
window.updateExperienceField = updateExperienceField;
window.insertTailoredBulletsIntoExp = insertTailoredBulletsIntoExp;
window.addProjectEntry = addProjectEntry;
window.removeProjectEntry = removeProjectEntry;
window.updateProjectField = updateProjectField;
window.addEducationEntry = addEducationEntry;
window.removeEducationEntry = removeEducationEntry;
window.updateEducationField = updateEducationField;
window.insertAiSummaryIntoBuilder = insertAiSummaryIntoBuilder;
window.importParsedSkillsIntoBuilder = importParsedSkillsIntoBuilder;
window.downloadResumePdf = downloadResumePdf;

function downloadOptimizedResumeDirectPdf() {
  if (latestOptimizationData) {
    applyOptimizedDataToState();
  } else {
    syncParsedDataToBuilder();
  }
  renderResumeLivePreview();
  downloadResumePdf();
}

window.downloadOptimizedResumeDirectPdf = downloadOptimizedResumeDirectPdf;
window.printResumeDocument = printResumeDocument;
window.switchBuilderMobileTab = switchBuilderMobileTab;
window.resumeBuilderState = resumeBuilderState;

function updateDossierContent(parsed, assessment, targetRole) {
  const dName = document.getElementById('dossier-name');
  const dRole = document.getElementById('dossier-target-role');
  const dScore = document.getElementById('dossier-fit-score');
  const dDate = document.getElementById('dossier-date');
  const dSkills = document.getElementById('dossier-skills-list');
  const dGaps = document.getElementById('dossier-gaps-list');

  if (dName) dName.innerText = parsed.name || 'Scholar Candidate';
  if (dRole) dRole.innerText = targetRole;
  if (dScore) dScore.innerText = `${assessment.matchPercentage}% (${assessment.matchTier || 'Strong Match'})`;
  if (dDate) dDate.innerText = new Date().toLocaleDateString();

  if (dSkills) {
    dSkills.innerHTML = (parsed.extractedSkills || []).map(s => `
      <div class="border p-1.5 rounded flex justify-between">
        <span>${s}</span>
        <span class="font-mono text-emerald-700">✓ Verified</span>
      </div>
    `).join('');
  }

  if (dGaps) {
    const gaps = (assessment.diagnostics && assessment.diagnostics.criticalGaps) || [];
    dGaps.innerHTML = gaps.map(g => `
      <div class="text-amber-800">• ${g.skill || g} (Action: Complete institutional training module)</div>
    `).join('');
  }
}

function triggerDossierExport() {
  const modal = document.getElementById('printable-dossier-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  window.print();
  setTimeout(() => { modal.classList.add('hidden'); }, 1000);
}

function initResumeUploader() {
  // Resume textarea remains clean for user input / upload
}

// ─────────────────────────────────────────────────────────────
// QUIZ ARENA MODULE (Multi-Category Assessment & Verification)
// ─────────────────────────────────────────────────────────────
let quizLoadingInterval = null;

function setQuizQuestionCount(count) {
  const inputEl = document.getElementById('quiz-question-count');
  const displayEl = document.getElementById('quiz-count-display');
  const val = Math.min(15, Math.max(3, parseInt(count, 10) || 5));
  if (inputEl) inputEl.value = val;
  if (displayEl) displayEl.innerText = `${val} Questions`;
}

async function startQuiz() {
  const sliderEl = document.getElementById('quiz-difficulty-slider');
  const countEl = document.getElementById('quiz-question-count');
  const promptEl = document.getElementById('quiz-focus-prompt');

  // Convert slider (1 = easy, 2 = mixed, 3 = hard)
  const sliderVal = parseInt(sliderEl?.value || '2', 10);
  let difficulty = 'mixed';
  if (sliderVal === 1) difficulty = 'easy';
  else if (sliderVal === 3) difficulty = 'hard';

  const rawCount = parseInt(countEl?.value || '5', 10);
  const questionCount = (!isNaN(rawCount) && rawCount >= 3 && rawCount <= 15) ? rawCount : 5;

  quizState = {
    started: false,
    currentIndex: 0,
    selectedAnswer: null,
    answers: [],
    questions: [],
    finished: false,
    difficulty,
    questionCount,
    prompt: promptEl?.value?.trim() || '',
    attemptId: null,
    result: null,
    loading: true
  };
  renderQuiz();

  try {
    const response = await JoblexApiClient.generateAdaptiveQuiz({
      difficulty: quizState.difficulty,
      prompt: quizState.prompt,
      questionCount: quizState.questionCount
    });

    if (quizLoadingInterval) {
      clearInterval(quizLoadingInterval);
      quizLoadingInterval = null;
    }

    if (!response?.success || !Array.isArray(response.questions) || response.questions.length === 0) {
      quizState.loading = false;
      renderQuiz(response?.error || 'Adaptive quiz generation is temporarily unavailable.');
      return;
    }
    quizState.started = true;
    quizState.loading = false;
    quizState.questions = response.questions;
    quizState.attemptId = response.attemptId;
    renderQuiz();
  } catch (err) {
    if (quizLoadingInterval) {
      clearInterval(quizLoadingInterval);
      quizLoadingInterval = null;
    }
    quizState.loading = false;
    renderQuiz('Connection to AI quiz engine timed out. Please try again.');
  }
}

function updateDifficultySliderLabel(val) {
  const labelEl = document.getElementById('difficulty-slider-label');
  const descEl = document.getElementById('difficulty-slider-desc');
  const num = parseInt(val, 10);
  if (num === 1) {
    if (labelEl) {
      labelEl.innerText = 'Beginner / Easy';
      labelEl.className = 'text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono';
    }
    if (descEl) descEl.innerText = 'Foundational concept verification and core terminology';
  } else if (num === 3) {
    if (labelEl) {
      labelEl.innerText = 'Advanced / Hard';
      labelEl.className = 'text-xs font-bold text-rose-600 dark:text-rose-400 font-mono';
    }
    if (descEl) descEl.innerText = 'Deep scenario debugging, edge cases, and architectural tradeoffs';
  } else {
    if (labelEl) {
      labelEl.innerText = 'Adaptive Mix (Recommended)';
      labelEl.className = 'text-xs font-bold text-purple-600 dark:text-purple-400 font-mono';
    }
    if (descEl) descEl.innerText = 'Dynamic blend testing both fundamentals and practical challenges';
  }
}

function autoFillQuizWithResume() {
  const cached = sessionStorage.getItem('joblex_latest_parsed_resume');
  if (!cached) {
    showToast('No parsed resume found in current session. Please parse a resume first.', 'Auto-Fill', 'info');
    return;
  }
  try {
    const data = JSON.parse(cached);
    const skills = (data.parsed && data.parsed.extractedSkills) || [];
    const promptEl = document.getElementById('quiz-focus-prompt');
    if (promptEl && skills.length) {
      promptEl.value = `Focus on my top skills: ${skills.slice(0, 4).join(', ')}`;
    }
    showToast(`Auto-fill activated based on ${skills.length} verified resume skills!`, 'Resume Synced', 'success');
  } catch (e) {
    console.warn(e);
  }
}

function renderQuiz(errorMessage = '') {
  const container = document.getElementById('quiz-arena-container');
  if (!container) return;

  if (quizState.loading) {
    // Engaging holographic multi-step loading animation
    container.innerHTML = `
      <div class="py-16 text-center space-y-6 max-w-lg mx-auto">
        <!-- Multi-ring pulsing radar animation -->
        <div class="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-purple-500/20 dark:bg-purple-500/10 animate-ping"></div>
          <div class="absolute inset-2 rounded-full border-2 border-dashed border-purple-400 dark:border-purple-500/60 animate-spin"></div>
          <div class="absolute inset-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-xl flex items-center justify-center text-white">
            <span class="material-symbols-outlined text-3xl animate-pulse">psychology</span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold">
            <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            LangGraph AI Assessment Engine
          </div>
          <h3 id="quiz-loading-stage-text" class="text-lg font-extrabold text-slate-900 dark:text-white">
            Synthesizing ${quizState.questionCount || 5} Questions...
          </h3>
          <p id="quiz-loading-subtext" class="text-xs text-slate-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            NVIDIA NIM &amp; Google AI Studio failover pipeline is formulating questions calibrated to your skill profile.
          </p>
        </div>

        <!-- Step progress indicators -->
        <div class="grid grid-cols-3 gap-2 text-left max-w-xs mx-auto text-[11px] font-mono">
          <div class="p-2 rounded-xl bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 text-purple-700 dark:text-purple-300">
            <span class="block font-bold">1. Topic Analysis</span>
            <span class="text-[9px] text-slate-400">Context mapped</span>
          </div>
          <div class="p-2 rounded-xl bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 text-purple-700 dark:text-purple-300 animate-pulse">
            <span class="block font-bold">2. LLM Synthesis</span>
            <span class="text-[9px] text-purple-500 font-bold">In progress...</span>
          </div>
          <div class="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-slate-400">
            <span class="block font-bold">3. Verification</span>
            <span class="text-[9px]">Securing keys</span>
          </div>
        </div>
      </div>
    `;

    // Dynamic stage cycling for engagement
    const stages = [
      { main: `Synthesizing ${quizState.questionCount || 5} Questions...`, sub: "LangGraph failover pipeline is querying models for optimal questions." },
      { main: "Calibrating Difficulty Distractors...", sub: "Generating realistic options, test scenarios, and conceptual edge cases." },
      { main: "Locking Assessment Integrity...", sub: "Encrypting correct answer hashes to prevent client-side inspection." }
    ];
    let step = 0;
    if (quizLoadingInterval) clearInterval(quizLoadingInterval);
    quizLoadingInterval = setInterval(() => {
      step = (step + 1) % stages.length;
      const mainEl = document.getElementById('quiz-loading-stage-text');
      const subEl = document.getElementById('quiz-loading-subtext');
      if (mainEl) mainEl.innerText = stages[step].main;
      if (subEl) subEl.innerText = stages[step].sub;
    }, 2400);

    return;
  }

  if (!quizState.started) {
    const hasParsedResume = !!sessionStorage.getItem('joblex_latest_parsed_resume');
    container.innerHTML = `
      <div class="py-6 space-y-6 max-w-3xl mx-auto">
        <div class="text-center space-y-3">
          <div class="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-600/20 border border-purple-200 dark:border-purple-500/40 flex items-center justify-center text-3xl mx-auto shadow-sm">
            <span class="material-symbols-outlined text-purple-600 dark:text-purple-300">tune</span>
          </div>
          <div>
            <h3 class="text-2xl font-black text-[#0F172A] dark:text-white">Custom Adaptive Quiz Studio</h3>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1 max-w-xl mx-auto">
              Select your question volume, slide your challenge level, and define custom skill targets. Zulu AI will generate a tailored assessment using multi-agent failover.
            </p>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-5 text-left">
          <!-- NUMBER OF QUESTIONS INPUT -->
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-gray-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-purple-500">pin</span>
                Number of Questions
              </span>
              <span id="quiz-count-display" class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                5 Questions
              </span>
            </div>
            <div class="flex items-center gap-3 pt-1">
              <input 
                id="quiz-question-count" 
                type="number" 
                min="3" 
                max="15" 
                value="5" 
                oninput="const v = Math.min(15, Math.max(3, parseInt(this.value)||5)); const d = document.getElementById('quiz-count-display'); if(d) d.innerText = v + ' Questions';"
                class="w-24 px-3 py-2.5 rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-gray-700 text-sm font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
              <div class="flex-1 text-[11px] text-slate-500 dark:text-gray-400 leading-snug">
                Choose between <strong class="text-slate-800 dark:text-gray-200">3 to 15 questions</strong> per assessment session.
              </div>
            <div class="flex items-center gap-1.5 pt-2 flex-wrap">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Select:</span>
              <button type="button" onclick="setQuizQuestionCount(3)" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition">3 Qs</button>
              <button type="button" onclick="setQuizQuestionCount(5)" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition">5 Qs</button>
              <button type="button" onclick="setQuizQuestionCount(8)" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition">8 Qs</button>
              <button type="button" onclick="setQuizQuestionCount(10)" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition">10 Qs</button>
              <button type="button" onclick="setQuizQuestionCount(15)" class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition">15 Qs</button>
            </div>
          </div>

          <!-- TARGET TOPIC / FOCUS PROMPT -->
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-gray-800 space-y-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-purple-500">psychology</span>
              Target Skill or Domain
            </span>
            <input 
              id="quiz-focus-prompt" 
              type="text" 
              maxlength="180" 
              placeholder="e.g. Next.js 14, Docker, PyTorch, LangGraph..." 
              class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-gray-700 text-xs text-slate-700 dark:text-gray-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
          </div>

          <!-- DIFFICULTY SLIDER (REPLACED SELECT DROPDOWN) -->
          <div class="col-span-full p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-gray-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-purple-500">tune</span>
                Challenge Level Slider
              </span>
              <span id="difficulty-slider-label" class="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                Adaptive Mix (Recommended)
              </span>
            </div>

            <!-- Slider Control -->
            <div class="space-y-1.5 pt-1">
              <input 
                id="quiz-difficulty-slider" 
                type="range" 
                min="1" 
                max="3" 
                step="1" 
                value="2" 
                oninput="updateDifficultySliderLabel(this.value)" 
                class="w-full h-2.5 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              >
              <div class="flex justify-between text-[10px] font-mono font-semibold text-slate-400 px-1">
                <span>1. Beginner / Easy</span>
                <span class="text-purple-600 dark:text-purple-400">2. Adaptive Mix</span>
                <span>3. Advanced / Hard</span>
              </div>
            </div>

            <p id="difficulty-slider-desc" class="text-xs text-slate-500 dark:text-gray-400">
              Dynamic blend testing both fundamentals and practical challenges.
            </p>
          </div>
        </div>

        <div id="quiz-learning-insights" class="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-gray-800 text-left text-xs text-slate-600 dark:text-gray-300">${errorMessage ? `<span class="text-rose-600 dark:text-rose-300 font-semibold">${errorMessage}</span>` : 'Loading your learning profile...'}</div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button onclick="startQuiz()" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-base">rocket_launch</span>
            <span>Launch Dynamic Assessment</span>
          </button>
          ${hasParsedResume ? `
            <button onclick="autoFillQuizWithResume()" class="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-purple-300 dark:border-purple-600/40 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs transition hover:bg-purple-100 flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>Sync with Resume Profile</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
    loadQuizInsights();
    return;
  }

  if (quizState.finished) {
    const result = quizState.result || {};
    const accuracy = result.accuracy || 0;
    const totalQ = result.totalQuestions || quizState.questions.length;
    const correctQ = result.correctCount || 0;

    container.innerHTML = `
      <div id="quiz-printable-report" class="text-center py-8 space-y-6 max-w-xl mx-auto p-4 sm:p-6 bg-white dark:bg-white/[0.02] rounded-2xl border border-[#E7E4DC] dark:border-white/10">
        <!-- Header Badge & Icon -->
        <div class="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-sm text-emerald-600 dark:text-emerald-400">
          <span class="material-symbols-outlined text-3xl">verified</span>
        </div>

        <div>
          <span class="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            Competency Assessment Validated
          </span>
          <h3 class="text-2xl font-black text-[#0F172A] dark:text-white mt-2">Assessment Results Verified</h3>
          <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">Official competency scorecard verified and recorded on the Academic Ledger.</p>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-2 gap-3 text-left">
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Score &amp; Accuracy</span>
            <strong class="text-xl font-mono text-emerald-600 dark:text-emerald-400">${correctQ} / ${totalQ} (${accuracy}%)</strong>
          </div>
          <div class="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30">
            <span class="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold block">XP &amp; Skill Mastery</span>
            <strong class="text-base font-mono text-purple-600 dark:text-purple-300">${accuracy >= 70 ? '+250 XP Awarded' : '+100 XP Practice'}</strong>
          </div>
        </div>

        <!-- Anti-Decay Status -->
        <div class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 text-left space-y-1">
          <div class="font-bold flex items-center gap-1.5">
            <span class="material-symbols-outlined text-teal-400 text-base">shield</span> 
            <span>Decay Freeze Extended for 72 Hours</span>
          </div>
          <div class="text-[11px] text-slate-600 dark:text-gray-300">
            Zulu AI has logged this session into your persistent competency constellation to personalize future assessments.
          </div>
        </div>

        <!-- Action Buttons including Download PDF -->
        <div class="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button onclick="downloadQuizResultPdf()" id="quiz-pdf-btn" class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition flex items-center gap-2 shadow-sm">
            <span class="material-symbols-outlined text-rose-400 text-base">picture_as_pdf</span>
            <span>Download Result as PDF</span>
          </button>
          <button onclick="resetAdaptiveQuiz()" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold transition">
            Build Another Quiz ↺
          </button>
          <a href="student-zulu.html" onclick="openZuluQuizReview()" class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">smart_toy</span>
            <span>Ask Zulu to Explain</span>
          </a>
        </div>
      </div>
    `;
    return;
  }

  const q = quizState.questions[quizState.currentIndex];
  container.innerHTML = `
    <div class="space-y-5 max-w-xl mx-auto py-4">
      <div class="flex justify-between items-center text-xs text-slate-500 dark:text-gray-400">
        <span class="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/40">
          ${q.section || 'Technical Section'}
        </span>
        <span class="font-mono text-purple-600 dark:text-purple-400 font-bold">
          Question ${quizState.currentIndex + 1} of ${quizState.questions.length}
        </span>
      </div>

      <div class="w-full bg-slate-100 dark:bg-gray-900 rounded-full h-2 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all" style="width: ${((quizState.currentIndex + 1) / quizState.questions.length) * 100}%"></div>
      </div>

      <h3 class="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white leading-snug">${q.question}</h3>

      <div class="space-y-2.5 pt-2">
        ${q.options.map((opt, i) => `
          <button onclick="selectQuizAnswer(${i})" class="w-full p-4 rounded-2xl text-left text-xs sm:text-sm transition flex items-center justify-between ${
            quizState.selectedAnswer === i 
              ? 'bg-purple-600 border border-purple-400 text-white font-bold shadow-md' 
              : 'bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-slate-100 dark:hover:bg-gray-800/50'
          }">
            <span class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full border border-slate-300 dark:border-gray-700 flex items-center justify-center text-[10px] shrink-0 font-mono ${quizState.selectedAnswer === i ? 'border-white text-white' : ''}">
                ${String.fromCharCode(65 + i)}
              </span>
              <span>${opt}</span>
            </span>
            <span class="text-xs">
              ${quizState.selectedAnswer === i ? '✓' : ''}
            </span>
          </button>
        `).join('')}
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-gray-800">
          <span class="text-[11px] text-slate-400 font-mono">Competency: ${q.skill} · ${q.difficulty}</span>
        <button onclick="nextQuizQuestion()" class="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md flex items-center gap-2">
          <span>${quizState.currentIndex === quizState.questions.length - 1 ? 'Submit Assessment' : 'Next Question'}</span>
          <span class="material-symbols-outlined text-sm align-middle">arrow_forward</span>
        </button>
      </div>
    </div>
  `;
}

async function nextQuizQuestion() {
  if (quizState.selectedAnswer === null) {
    showToast('Please select an option before continuing.', 'Quiz Arena', 'warning');
    return;
  }

  const q = quizState.questions[quizState.currentIndex];
  if (!quizState.answers) quizState.answers = [];
  quizState.answers.push({
    questionId: q.id,
    selectedIndex: quizState.selectedAnswer
  });

  if (quizState.currentIndex < quizState.questions.length - 1) {
    quizState.currentIndex += 1;
    quizState.selectedAnswer = null;
    renderQuiz();
  } else {
    const result = await JoblexApiClient.submitAdaptiveQuiz({ attemptId: quizState.attemptId, difficulty: quizState.difficulty, prompt: quizState.prompt, answers: quizState.answers });
    if (!result?.success) {
      showToast(result?.error || 'Could not record this attempt.', 'Quiz Arena', 'error');
      return;
    }
    quizState.result = result;
    quizState.finished = true;
    renderQuiz();
  }
}

function selectQuizAnswer(idx) {
  quizState.selectedAnswer = idx;
  renderQuiz();
}

async function loadQuizInsights() {
  const target = document.getElementById('quiz-learning-insights');
  if (!target) return;
  try {
    const response = await JoblexApiClient.getAdaptiveQuizInsights();
    const insights = response?.insights;
    if (!response?.success || !insights || !insights.attempts) {
      target.innerHTML = `<strong class="text-slate-800 dark:text-white">Your Adaptive Profile</strong><span class="block mt-1 text-slate-500 dark:text-gray-400">Ready to validate competencies. Complete your first session to unlock personalized skill analytics and anti-decay tracking.</span>`;
      return;
    }
    const accuracy = insights.totalAnswered ? Math.round((insights.totalCorrect / insights.totalAnswered) * 100) : 0;
    const weakSkills = Object.entries(insights.bySkill || {}).filter(([, stat]) => stat.accuracy < 70).map(([skill]) => `${skill} (${stat.accuracy}%)`);
    target.innerHTML = `<strong class="text-slate-800 dark:text-white">Your Adaptive Profile</strong><span class="block mt-1">${insights.attempts} attempt(s) · ${accuracy}% overall accuracy. ${weakSkills.length ? `Zulu will reinforce: ${weakSkills.join(', ')}.` : 'Zulu is ready to increase the challenge as you improve.'}</span>`;
  } catch (e) {
    target.innerHTML = `<strong class="text-slate-800 dark:text-white">Your Adaptive Profile</strong><span class="block mt-1 text-slate-500 dark:text-gray-400">Ready to begin assessment. Choose your questions and launch when ready.</span>`;
  }
}

function resetAdaptiveQuiz() {
  quizState = { started: false, currentIndex: 0, selectedAnswer: null, answers: [], questions: [], finished: false, difficulty: 'mixed', questionCount: 5, prompt: '', attemptId: null, result: null, loading: false };
  renderQuiz();
}

async function downloadQuizResultPdf() {
  const btn = document.getElementById('quiz-pdf-btn');
  const originalBtn = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      <span>Generating PDF...</span>
    `;
  }

  const reportContainer = document.getElementById('quiz-printable-report');
  if (!reportContainer) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtn;
    }
    return;
  }

  const dateStamp = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const opt = {
    margin: [12, 12, 12, 12],
    filename: `JOBLEX-Assessment-Report-${dateStamp.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    if (window.html2pdf) {
      await window.html2pdf().set(opt).from(reportContainer).save();
      showToast('Assessment result scorecard exported as PDF!', 'PDF Download Complete', 'success');
    } else {
      window.print();
    }
  } catch (err) {
    console.error('[Quiz PDF Download Error]:', err);
    window.print();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtn;
    }
  }
}

function openZuluQuizReview() {
  localStorage.setItem('joblex_zulu_prefill', 'Review my latest adaptive quiz results and explain the skills I should practice next.');
}

// ─────────────────────────────────────────────────────────────
// VERIFIED DIGITAL PORTFOLIO MODULE
// ─────────────────────────────────────────────────────────────
async function renderPortfolioGrid() {
  const container = document.getElementById('credentials-grid');
  if (!container) return;

  try {
    const res = await JoblexApiClient.getPortfolio();
    const items = (res && res.items) || [];
    if (items.length > 0) {
      container.innerHTML = items.map(item => `
        <div class="rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
              ${item.type || 'Verified Certificate'}
            </span>
            <span class="text-xs font-mono text-[#64748B] dark:text-gray-500">${item.date || '2025'}</span>
          </div>
          <h3 class="text-base font-bold text-[#0F172A] dark:text-white">${item.title}</h3>
          <p class="text-xs text-[#64748B] dark:text-gray-400">${item.issuer}</p>
          <div class="pt-3 border-t border-[#E2E8F0] dark:border-white/5 font-mono text-[10px] text-slate-500 dark:text-gray-400 truncate">
            Hash: ${item.hash || '0x' + Math.random().toString(16).substring(2, 10).toUpperCase()} (NAAR Verified)
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div class="col-span-full py-12 px-4 rounded-2xl border border-dashed border-[#E7E4DC] dark:border-white/10 bg-white/40 dark:bg-white/[0.01] text-center space-y-3">
          <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-2xl">verified</span>
          </div>
          <h3 class="text-sm font-bold text-[#1C1917] dark:text-white">No Verified Credentials Yet</h3>
          <p class="text-xs text-[#6E6962] dark:text-gray-400 max-w-sm mx-auto">Complete assessments, earn skill badges, or upload institutional certifications to build your tamper-proof ledger.</p>
          <button onclick="openAddCredentialModal()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition">
            <span class="material-symbols-outlined text-sm">add_circle</span> Add Your First Credential
          </button>
        </div>
      `;
    }
  } catch (e) {
    console.warn('Portfolio load error:', e);
  }
}

function openAddCredentialModal() {
  const modal = document.getElementById('add-credential-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddCredentialModal() {
  const modal = document.getElementById('add-credential-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitNewCredential() {
  const title = document.getElementById('cred-title-input')?.value.trim();
  const issuer = document.getElementById('cred-issuer-input')?.value.trim();
  const type = document.getElementById('cred-type-select')?.value;
  const skillsStr = document.getElementById('cred-skills-input')?.value.trim();

  if (!title || !issuer) {
    showToast('Please provide credential title and issuing body.', 'Validation', 'warning');
    return;
  }

  const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()) : [];
  const res = await JoblexApiClient.uploadPortfolioCredential({
    title,
    issuer,
    type,
    skills
  });

  if (res && res.success) {
    showToast('Credential cryptographically signed & recorded', 'Credential Registered', 'success');
    closeAddCredentialModal();
    renderPortfolioGrid();
  } else {
    showToast('Failed to register credential.', 'Error', 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// ZULU AI GEMINI-STYLE CHAT CONTROLLER WITH SESSION HISTORY
// ─────────────────────────────────────────────────────────────
let currentZuluSessionId = null;
let zuluSessionsList = [];

function formatZuluMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h4 class="font-bold text-purple-900 dark:text-purple-300 text-base my-2">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="font-bold text-purple-900 dark:text-purple-200 text-lg my-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="text-purple-700 dark:text-purple-300">$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-gray-800 px-1.5 py-0.5 rounded text-purple-700 dark:text-cyan-300 font-mono text-[11px]">$1</code>')
    .replace(/^• (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-gray-200 text-sm my-1">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-700 dark:text-gray-200 text-sm my-1">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function toggleZuluHistoryDrawer() {
  const drawer = document.getElementById('zulu-history-drawer');
  if (!drawer) return;
  drawer.classList.toggle('hidden');
}

async function initZuluChat() {
  const container = document.getElementById('zulu-sessions-list');
  if (!container) return;

  const currentUser = JoblexApiClient.getCurrentUser();
  const userId = currentUser ? currentUser.email || currentUser.id || 'usr-student-01' : 'usr-student-01';

  try {
    const res = await JoblexApiClient.getZuluSessions(userId);
    let sessions = res.sessions || [];

    if (sessions.length === 0) {
      const newRes = await JoblexApiClient.createZuluSession(userId, 'Zulu AI');
      if (newRes && newRes.session) {
        sessions = [newRes.session];
      }
    }

    zuluSessionsList = sessions;
    renderZuluSessionsList();

    if (zuluSessionsList.length > 0) {
      const defaultId = zuluSessionsList[0].id;
      await switchZuluSession(defaultId);
    }

    const prefill = localStorage.getItem('joblex_zulu_prefill');
    const input = document.getElementById('zulu-input');
    if (prefill && input) {
      input.value = prefill;
      input.focus();
      localStorage.removeItem('joblex_zulu_prefill');
    }
  } catch (e) {
    console.warn('[Zulu Chat Init Warning]:', e);
  }
}

function renderZuluSessionsList() {
  const container = document.getElementById('zulu-sessions-list');
  if (!container) return;

  if (zuluSessionsList.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-xs text-slate-400">No chat sessions. Click + New above.</div>`;
    return;
  }

  container.innerHTML = zuluSessionsList.map(s => {
    const isActive = s.id === currentZuluSessionId;
    const title = s.title || 'Zulu AI';
    const dateStr = s.updated_at ? new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
    
    return `
      <div onclick="switchZuluSession('${s.id}'); toggleZuluHistoryDrawer();" class="p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
        isActive 
          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-500/40 text-purple-900 dark:text-purple-200 shadow-sm'
          : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300'
      }">
        <div class="flex items-center gap-2 overflow-hidden">
          <span class="material-symbols-outlined text-xs shrink-0 text-indigo-400">${isActive ? "chat" : "description"}</span>
          <div class="flex flex-col text-left overflow-hidden">
            <span class="text-xs font-bold truncate max-w-[150px]">${title}</span>
            <span class="text-[9px] opacity-70 font-mono">${dateStr}</span>
          </div>
        </div>
        <button onclick="deleteZuluSession(event, '${s.id}')" title="Delete thread" class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition rounded-lg">
          <span class="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>
    `;
  }).join('');
}

async function switchZuluSession(sessionId) {
  currentZuluSessionId = sessionId;
  renderZuluSessionsList();

  const session = zuluSessionsList.find(s => s.id === sessionId);
  const titleEl = document.getElementById('zulu-active-session-title');
  if (titleEl && session) {
    titleEl.innerText = session.title || 'Zulu AI';
  }

  const messagesBox = document.getElementById('zulu-messages-box');
  if (!messagesBox) return;

  const currentUser = JoblexApiClient.getCurrentUser();
  const userId = currentUser ? currentUser.email || currentUser.id || 'usr-student-01' : 'usr-student-01';

  try {
    const res = await JoblexApiClient.getZuluMessages(sessionId, userId);
    const msgs = res.messages || [];

    if (msgs.length === 0) {
      messagesBox.innerHTML = `
        <div id="zulu-welcome-hero" class="text-center py-6 sm:py-8 space-y-4">
          <div class="w-14 h-14 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg"><span class="material-symbols-outlined text-2xl">smart_toy</span></div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white">Namaste, <span class="user-name-display">Scholar</span></h1>
          <p class="text-xs sm:text-sm text-[#64748B] dark:text-gray-400 max-w-md mx-auto leading-relaxed">I am Zulu, your AI Career &amp; Research Counselor. Ask any question to start this conversation!</p>
        </div>
      `;
      return;
    }

    let html = '';
    msgs.forEach(m => {
      if (m.sender === 'user') {
        html += `
          <div class="flex justify-end my-3">
            <div class="max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-3xl rounded-br-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm leading-relaxed shadow-md">
              ${m.message}
            </div>
          </div>
        `;
      } else {
        const formatted = formatZuluMarkdown(m.message);
        html += `
          <div class="flex justify-start items-start gap-3 my-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.4)]"><span class="material-symbols-outlined text-sm">smart_toy</span></div>
            <div class="max-w-[85%] sm:max-w-[78%] p-4 sm:p-5 rounded-3xl rounded-tl-md bg-white dark:bg-gray-900/90 border border-[#E2E8F0] dark:border-gray-800 text-[#0F172A] dark:text-gray-100 text-xs sm:text-sm leading-relaxed shadow-sm space-y-2">
              ${formatted}
            </div>
          </div>
        `;
      }
    });

    messagesBox.innerHTML = html;
    messagesBox.scrollTop = messagesBox.scrollHeight;
  } catch (e) {
    console.warn('[Zulu Messages Fetch Error]:', e);
  }
}

async function createNewZuluSession() {
  const currentUser = JoblexApiClient.getCurrentUser();
  const userId = currentUser ? currentUser.email || currentUser.id || 'usr-student-01' : 'usr-student-01';

  const res = await JoblexApiClient.createZuluSession(userId, 'New Conversation');
  if (res && res.session) {
    zuluSessionsList.unshift(res.session);
    await switchZuluSession(res.session.id);
  }
}

async function deleteZuluSession(e, sessionId) {
  if (e) e.stopPropagation();

  const currentUser = JoblexApiClient.getCurrentUser();
  const userId = currentUser ? currentUser.email || currentUser.id || 'usr-student-01' : 'usr-student-01';

  await JoblexApiClient.deleteZuluSession(sessionId, userId);
  showToast('Chat thread deleted successfully.', 'Zulu AI', 'info');

  zuluSessionsList = zuluSessionsList.filter(s => s.id !== sessionId);

  if (zuluSessionsList.length === 0) {
    await createNewZuluSession();
  } else {
    await switchZuluSession(zuluSessionsList[0].id);
  }
}

async function handleZuluSend(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('zulu-input');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  const heroEl = document.getElementById('zulu-welcome-hero');
  if (heroEl) heroEl.classList.add('hidden');

  const messagesBox = document.getElementById('zulu-messages-box');
  if (!messagesBox) return;

  // Ensure active session
  if (!currentZuluSessionId) {
    await createNewZuluSession();
  }

  // Render User Message
  const userDiv = document.createElement('div');
  userDiv.className = 'flex justify-end my-3';
  userDiv.innerHTML = `
    <div class="max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-3xl rounded-br-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm leading-relaxed shadow-md">
      ${text}
    </div>
  `;
  messagesBox.appendChild(userDiv);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  // Typing Indicator
  const typingDiv = document.createElement('div');
  typingDiv.id = 'zulu-typing-indicator';
  typingDiv.className = 'flex justify-start items-center gap-3 my-3';
  typingDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm"><span class="material-symbols-outlined text-sm">smart_toy</span></div>
    <div class="bg-white dark:bg-gray-900/90 border border-[#E2E8F0] dark:border-purple-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
      <span class="text-xs text-purple-700 dark:text-purple-300 font-medium">Zulu is thinking...</span>
      <div class="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
      <div class="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
      <div class="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
    </div>
  `;
  messagesBox.appendChild(typingDiv);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  const currentUser = JoblexApiClient.getCurrentUser();
  const userId = currentUser ? currentUser.email || currentUser.id || 'usr-student-01' : 'usr-student-01';

  const studentContext = {
    studentName: currentUser ? currentUser.name : 'Scholar',
    institution: currentUser ? currentUser.institution : 'Academic Technical Institute',
    department: (currentUser && (currentUser.department || currentUser.year)) || 'Engineering & Technology',
    xp: currentXp,
    streak: currentStreak,
    targetRole: currentUser?.targetRole || currentUser?.domain || 'Full Stack Software Engineer'
  };

  try {
    const insightRes = await JoblexApiClient.getAdaptiveQuizInsights();
    if (insightRes?.success) studentContext.adaptiveQuizPerformance = insightRes.insights;
  } catch (error) {
    console.warn('[Zulu Quiz Context Warning]:', error);
  }

  const res = await JoblexApiClient.askZulu(text, studentContext, currentZuluSessionId, userId);

  const ind = document.getElementById('zulu-typing-indicator');
  if (ind) ind.remove();

  if (!res || !res.success || !res.reply) {
    showToast(res?.error || 'Zulu AI could not respond right now. Please try again.', 'Zulu AI', 'error');
    return;
  }

  if (res && res.sessionId && res.sessionId !== currentZuluSessionId) {
    currentZuluSessionId = res.sessionId;
  }

  // Update session title in list if default
  const activeSess = zuluSessionsList.find(s => s.id === currentZuluSessionId);
  if (activeSess && (activeSess.title === 'New Conversation' || activeSess.title === 'Ayurvedic Pharmacognosy Guidance')) {
    activeSess.title = text.length > 30 ? text.substring(0, 30) + '...' : text;
    renderZuluSessionsList();
    const titleEl = document.getElementById('zulu-active-session-title');
    if (titleEl) titleEl.innerText = activeSess.title;
  }

  // Render Zulu Response
  const formattedReply = formatZuluMarkdown(res.reply);
  const zuluDiv = document.createElement('div');
  zuluDiv.className = 'flex justify-start items-start gap-3 my-3';
  zuluDiv.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-xs text-white shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.4)]"><span class="material-symbols-outlined text-amber-400 text-base">auto_awesome</span></div>
    <div class="max-w-[85%] sm:max-w-[78%] p-4 sm:p-5 rounded-3xl rounded-tl-md bg-white dark:bg-gray-900/90 border border-[#E2E8F0] dark:border-gray-800 text-[#0F172A] dark:text-gray-100 text-xs sm:text-sm leading-relaxed shadow-sm space-y-2">
      ${formattedReply}
    </div>
  `;
  messagesBox.appendChild(zuluDiv);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('zulu-input');
  if (input) {
    input.value = promptText;
    handleZuluSend();
  }
}

function clearZuluChat() {
  const box = document.getElementById('zulu-messages-box');
  const heroEl = document.getElementById('zulu-welcome-hero');
  if (box) box.innerHTML = '';
  if (heroEl) heroEl.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────
// PEER BENCHMARKING (Idea #2)
// ─────────────────────────────────────────────────────────────
function renderPeerBenchmarking() {
  const card = document.getElementById('peer-benchmarking-card');
  if (!card) return;
  card.innerHTML = `
    <div class="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-purple-950/60 dark:via-indigo-950/50 dark:to-gray-900 border border-slate-200 dark:border-purple-500/40 shadow-sm dark:shadow-xl space-y-3">
      <div class="flex justify-between items-start">
        <span class="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/40">
          Anonymized Peer Benchmark
        </span>
        <span class="text-xs font-mono font-black text-cyan-600 dark:text-cyan-300">Cohort Comparison</span>
      </div>
      <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Compare With Industry &amp; Corporate Placement Cohorts</h3>
      <p class="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
        Scholars with verified corporate offers averaged an <strong class="text-slate-900 dark:text-white">86% Competency Score</strong>. Complete assessments and milestones to calibrate your percentile.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
        <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-gray-800"><span class="text-slate-500 dark:text-gray-400 block text-[10px]">Your Score</span><strong class="text-purple-600 dark:text-purple-400">74%</strong></div>
        <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-gray-800"><span class="text-slate-500 dark:text-gray-400 block text-[10px]">Placed Peers</span><strong class="text-emerald-600 dark:text-emerald-400">86% Avg</strong></div>
        <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-gray-800 col-span-2 sm:col-span-1"><span class="text-slate-500 dark:text-gray-400 block text-[10px]">Delta</span><strong class="text-amber-600 dark:text-amber-400">-12% Gap</strong></div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// 2D SKILL TREE CONSTELLATION
// ─────────────────────────────────────────────────────────────
function initSkillTree() {
  window.addEventListener('resize', drawSkillTree);
  setTimeout(drawSkillTree, 50);
}

function drawSkillTree() {
  const canvas = document.getElementById('skill-tree-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const currentUser = JoblexApiClient.getCurrentUser();
  const hasProgress = currentUser && ((currentUser.xp && currentUser.xp > 0) || (currentUser.verified_skills && currentUser.verified_skills.length > 0));

  const nodes = [
    { name: 'Core Foundations', x: w * 0.2, y: h * 0.5, acquired: !!hasProgress },
    { name: 'Domain Methodology', x: w * 0.4, y: h * 0.35, acquired: !!hasProgress },
    { name: 'Applied Analytics', x: w * 0.4, y: h * 0.65, acquired: !!hasProgress },
    { name: 'Industry Protocols', x: w * 0.65, y: h * 0.35, acquired: false },
    { name: 'Data & Systems Tech', x: w * 0.65, y: h * 0.65, acquired: !!hasProgress },
    { name: 'Advanced R&D Modeling', x: w * 0.85, y: h * 0.5, acquired: false }
  ];

  const edges = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]
  ];

  const isDark = document.documentElement.classList.contains('dark');

  // Draw Edges
  edges.forEach(([from, to]) => {
    ctx.beginPath();
    ctx.moveTo(nodes[from].x, nodes[from].y);
    ctx.lineTo(nodes[to].x, nodes[to].y);
    ctx.strokeStyle = isDark ? '#4b5563' : '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw Nodes
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = n.acquired ? '#8b5cf6' : (isDark ? '#374151' : '#e2e8f0');
    ctx.fill();
    ctx.strokeStyle = n.acquired ? '#a78bfa' : (isDark ? '#6b7280' : '#94a3b8');
    ctx.lineWidth = 3;
    ctx.stroke();

    // Node Text
    ctx.fillStyle = n.acquired 
      ? (isDark ? '#ffffff' : '#4c1d95') 
      : (isDark ? '#9ca3af' : '#64748b');
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(n.name, n.x, n.y + 28);
  });
}

// Global Aliases & Handlers for Student Sub-Pages
function filterInternshipTabs(type, btn) {
  document.querySelectorAll('#filter-btn-all, #filter-btn-internship, #filter-btn-job, #filter-btn-gig').forEach(b => {
    b.className = 'px-4 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-white/[0.02] border border-[#E7E4DC] dark:border-white/10 text-[#6E6962] dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500/40 transition';
  });
  if (btn) {
    btn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-[#0F172A] text-white dark:bg-white/10 dark:text-white transition shadow-sm';
  }
  renderInternshipsBoard(type);
}

window.filterInternshipTabs = filterInternshipTabs;
window.handleStreakCheckin = handleCheckIn;

// Quiz Arena Global Window Bindings
window.startQuiz = startQuiz;
window.setQuizQuestionCount = setQuizQuestionCount;
window.updateDifficultySliderLabel = updateDifficultySliderLabel;
window.autoFillQuizWithResume = autoFillQuizWithResume;
window.renderQuiz = renderQuiz;
window.selectQuizAnswer = selectQuizAnswer;
window.nextQuizQuestion = nextQuizQuestion;
window.resetAdaptiveQuiz = resetAdaptiveQuiz;
window.downloadQuizResultPdf = downloadQuizResultPdf;
window.openZuluQuizReview = openZuluQuizReview;

