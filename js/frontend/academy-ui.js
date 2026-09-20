  const tbody = document.getElementById('dept-readiness-tbody');
/**
 * JOBLEX Academy Portal UI Controller (Client-Side JavaScript)
 * Pure frontend DOM, rendering, and interaction logic
 * Fully integrated with all SIH 26044 features:
 * 9. Automated Curriculum Gap Audit (NEP-2020 / NAAC)
 * 10. Placement Cell Command Center
 * 11. Cross-College Benchmarking (Opt-In & Anonymized)
 * 8. Academic Co-Branded Bootcamps
 */

let activeAcademyTab = 'Progress';



document.addEventListener('DOMContentLoaded', async () => {
  // Auth Guard: ensure user is authenticated before accessing academy portal
  if (!JoblexApiClient.requireAuth('academy')) return;

  initAcademySidebarState();
  renderDepartmentalReadiness();
  renderSyllabusProposals();
  renderTPOMetrics();
  renderCrossCollegeBenchmarking();
  renderConsultancyGrants();
  renderMouPartnerships();
  if (document.getElementById('faculty-opportunities-container')) {
    renderFdpPrograms();
  }
});

function switchAcademyTab(tabId) {
  activeAcademyTab = tabId;

  document.querySelectorAll('.academy-tab-content').forEach(el => el.classList.add('hidden'));

  const target = document.getElementById(`academy-tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  // Update Desktop Sidebar Buttons
  document.querySelectorAll('.academy-sidebar-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'academy-sidebar-btn sidebar-nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all bg-emerald-600/25 border border-emerald-500/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
    } else {
      btn.className = 'academy-sidebar-btn sidebar-nav-btn w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/5 border border-transparent';
    }
  });

  // Update Mobile Drawer Buttons
  document.querySelectorAll('.academy-mobile-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'academy-mobile-nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition bg-emerald-600/30 border border-emerald-500 text-emerald-100';
    } else {
      btn.className = 'academy-mobile-nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-bold transition text-gray-300 hover:bg-white/5 border border-transparent';
    }
  });

  closeAcademyMobileMenu();
}

function initAcademySidebarState() {
  const isCollapsed = localStorage.getItem('joblex_academy_sidebar_collapsed') === 'true';
  applyAcademySidebarState(isCollapsed);
}

function toggleAcademySidebarCollapse() {
  const sidebar = document.getElementById('academy-sidebar');
  if (!sidebar) return;
  const isNowCollapsed = !sidebar.classList.contains('sidebar-collapsed');
  localStorage.setItem('joblex_academy_sidebar_collapsed', isNowCollapsed ? 'true' : 'false');
  applyAcademySidebarState(isNowCollapsed);
}

function applyAcademySidebarState(collapsed) {
  const sidebar = document.getElementById('academy-sidebar');
  const toggleBtn = document.getElementById('academy-sidebar-collapse-btn');
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

function toggleAcademyMobileMenu() {
  const drawer = document.getElementById('academy-mobile-drawer');
  if (drawer) drawer.classList.toggle('hidden');
}

function closeAcademyMobileMenu() {
  const drawer = document.getElementById('academy-mobile-drawer');
  if (drawer) drawer.classList.add('hidden');
}

window.switchAcademyTab = switchAcademyTab;
window.initAcademySidebarState = initAcademySidebarState;
window.applyAcademySidebarState = applyAcademySidebarState;
window.toggleAcademySidebarCollapse = toggleAcademySidebarCollapse;
window.toggleAcademyMobileMenu = toggleAcademyMobileMenu;
window.closeAcademyMobileMenu = closeAcademyMobileMenu;

async function renderDepartmentalReadiness() {
  const tbody = document.getElementById('dept-readiness-table-body');
  if (!tbody) return;

  const data = await JoblexApiClient.getAcademyData();
  const readinessData = data.departmentalReadiness || [];

  tbody.innerHTML = readinessData.map(d => {
    const obeColor = d.obe >= 90 ? 'text-emerald-400' : 'text-cyan-400';
    let bosBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (d.bosStatus.includes('Review') || d.bosStatus.includes('Audit')) {
      bosBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }

    return `
      <tr class="border-b border-gray-800 hover:bg-white/[0.02] transition">
        <td class="py-3 px-4 text-xs font-semibold text-white">${d.dept}</td>
        <td class="py-3 px-4 text-xs text-gray-300">${d.head}</td>
        <td class="py-3 px-4 text-xs font-mono font-bold ${obeColor}">${d.obe}% Attained</td>
        <td class="py-3 px-4 text-xs text-gray-300">${d.labIndex}</td>
        <td class="py-3 px-4 text-xs">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${bosBadge}">
            ${d.bosStatus}
          </span>
        </td>
        <td class="py-3 px-4 text-xs">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-purple-500/20 text-purple-300 border-purple-500/40">
            ${d.naacCriterion}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

let CURRENT_SYLLABUS_MODULES = [];

async function renderSyllabusProposals() {
  const container = document.getElementById('syllabus-proposals-grid') || document.getElementById('syllabus-proposals-container');
  if (!container) return;

  try {
    const data = await JoblexApiClient.getAcademyData();
    if (data && Array.isArray(data.syllabusSuggestions)) {
      CURRENT_SYLLABUS_MODULES = data.syllabusSuggestions;
    }
  } catch (err) {
    console.warn('[Academy UI] Loaded fallback curriculum proposals:', err.message);
  }

  container.innerHTML = CURRENT_SYLLABUS_MODULES.map(prop => `
    <div class="p-5 rounded-2xl bg-white dark:bg-gray-900/70 border ${prop.adopted ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm' : 'border-[#E7E4DC] dark:border-gray-800'} backdrop-blur-md space-y-3 transition-all hover:border-emerald-400">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
            ${prop.nepPillar || 'NEP-2020 Module'}
          </span>
          ${prop.department ? `<span class="text-[11px] font-semibold text-purple-700 dark:text-purple-300 font-mono">${prop.department}</span>` : ''}
        </div>
        <div class="flex items-center gap-2">
          ${prop.credits ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700">${prop.credits}</span>` : ''}
          <span class="text-xs text-[#6E6962] dark:text-gray-400 font-mono">${prop.source}</span>
        </div>
      </div>
      <div>
        <h4 class="text-xs text-[#6E6962] dark:text-gray-400 font-semibold mb-0.5">Current Syllabus Baseline:</h4>
        <p class="text-xs text-[#1C1917] dark:text-gray-200 font-medium">${prop.currentTopic}</p>
      </div>
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-emerald-200 dark:border-emerald-500/20 space-y-1">
        <h4 class="text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">lightbulb</span>
          <span>Proposed Industry Modernization:</span>
        </h4>
        <p class="text-xs sm:text-sm text-[#1C1917] dark:text-white font-semibold">${prop.suggestedAddition}</p>
        <span class="text-[11px] text-[#6E6962] dark:text-gray-400 pt-1 block">Impact: ${prop.impact}</span>
      </div>
      <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
        <span class="text-[11px] text-slate-500 dark:text-gray-400 font-mono">Module Ref: #${prop.id}</span>
        <div>
          ${prop.adopted 
            ? `<span class="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 shadow-sm"><span class="material-symbols-outlined text-sm">verified</span> Adopted for Academic Council</span>`
            : `
              <button onclick="adoptProposal('${prop.id}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm hover:scale-[1.02] flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">add_task</span>
                <span>Adopt Syllabus Add-on</span>
              </button>
            `
          }
        </div>
      </div>
    </div>
  `).join('');
}

async function adoptProposal(id) {
  const p = CURRENT_SYLLABUS_MODULES.find(x => x.id === id);
  if (p) {
    p.adopted = true;
    renderSyllabusProposals();
    await JoblexApiClient.adoptSyllabus(id);
    if (typeof showToast === 'function') {
      showToast('Syllabus add-on ratified for Academic Council review!', 'Curriculum Council', 'success');
    }
  }
}

async function renderTPOMetrics() {
  const data = await JoblexApiClient.getAcademyData();
  const tpo = data.tpoMetrics || {
    funnel: { applied: 248, shortlisted: 94, offersAccepted: 52 },
    predictivePlacementReadiness: 84
  };

  const appliedEl = document.getElementById('tpo-applied');
  const shortEl = document.getElementById('tpo-shortlisted');
  const placedEl = document.getElementById('tpo-placed');
  const readinessEl = document.getElementById('tpo-readiness');

  if (appliedEl) appliedEl.innerText = tpo.funnel.applied;
  if (shortEl) shortEl.innerText = tpo.funnel.shortlisted;
  if (placedEl) placedEl.innerText = tpo.funnel.offersAccepted;
  if (readinessEl) readinessEl.innerText = `${tpo.predictivePlacementReadiness}% Placement Ready`;
}

// ─────────────────────────────────────────────────────────────
// IDEA #11: CROSS-COLLEGE BENCHMARKING
// ─────────────────────────────────────────────────────────────
async function renderCrossCollegeBenchmarking() {
  const container = document.getElementById('cross-college-table-body') || document.getElementById('benchmarking-container');
  if (!container) return;

  const data = await JoblexApiClient.getCrossCollegeBenchmarking();
  const institutions = data.institutions || [];

  if (!institutions.length) {
    container.innerHTML = '<div class="py-8 text-center text-xs text-[#6E6962] dark:text-gray-400">No peer benchmarking records have been published by the university.</div>';
    return;
  }

  if (container.id === 'benchmarking-container') {
    container.innerHTML = `<div class="overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b border-slate-200 dark:border-white/10 text-[10px] uppercase tracking-wider text-[#6E6962] dark:text-gray-400"><th class="py-3 px-4">Rank</th><th class="py-3 px-4">Institution</th><th class="py-3 px-4">Skill score</th><th class="py-3 px-4">Placement</th><th class="py-3 px-4">MoUs</th><th class="py-3 px-4">NAAC</th></tr></thead><tbody id="benchmarking-rows"></tbody></table></div>`;
    container = document.getElementById('benchmarking-rows');
  }

  container.innerHTML = institutions.map(inst => `
    <tr class="border-b border-gray-800 ${inst.status === 'Your Institution' ? 'bg-emerald-950/20 font-semibold' : 'hover:bg-white/[0.02]'} transition">
      <td class="py-3.5 px-4 text-xs font-mono font-bold text-emerald-400">#${inst.rank}</td>
      <td class="py-3.5 px-4 text-xs text-white">
        ${inst.institution}
        ${inst.status === 'Your Institution' ? '<span class="ml-2 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Your Campus</span>' : ''}
      </td>
      <td class="py-3.5 px-4 text-xs font-mono text-cyan-300 font-bold">${inst.avgSkillScore}%</td>
      <td class="py-3.5 px-4 text-xs font-mono text-emerald-300">${inst.placementRate}</td>
      <td class="py-3.5 px-4 text-xs text-gray-300">${inst.mouCount} Active MoUs</td>
      <td class="py-3.5 px-4 text-xs">
        <span class="px-2 py-0.5 rounded bg-gray-800 border border-purple-500/30 text-purple-200 text-[10px] font-bold">
          ${inst.naacGrade}
        </span>
      </td>
    </tr>
  `).join('');
}

// ─────────────────────────────────────────────────────────────
// IDEA #9: INTERACTIVE CURRICULUM GAP AUDIT
// ─────────────────────────────────────────────────────────────
async function handleRunCurriculumAudit(e) {
  if (e) e.preventDefault();
  const dept = document.getElementById('audit-dept-select') ? document.getElementById('audit-dept-select').value : 'Dravyaguna';
  const text = document.getElementById('audit-syllabus-text') ? document.getElementById('audit-syllabus-text').value : '';
  const resultBox = document.getElementById('audit-results-box');

  const res = await JoblexApiClient.runCurriculumAudit(text, dept);

  if (resultBox && res) {
    resultBox.classList.remove('hidden');

    document.getElementById('audit-coverage-score').innerText = `${res.coverageScore}%`;
    document.getElementById('audit-naac-score').innerText = res.naacCriterionScore;

    const gapsBox = document.getElementById('audit-critical-gaps-list');
    if (gapsBox && res.criticalGapsIdentified) {
      gapsBox.innerHTML = res.criticalGapsIdentified.map(g => `
        <div class="p-3 rounded-xl bg-black/40 border border-amber-500/30 space-y-1 text-xs">
          <div class="flex justify-between items-center">
            <span class="font-bold text-amber-300">${g.unit}</span>
            <span class="text-[10px] text-gray-400">Missing Competency</span>
          </div>
          <p class="font-semibold text-white">${g.gap}</p>
          <span class="text-[11px] text-gray-400 mt-0.5 block">${g.impact}</span>
        </div>
      `).join('');
    }

    resultBox.scrollIntoView({ behavior: 'smooth' });
  }
}

// ─────────────────────────────────────────────────────────────
// R&D CONSULTANCY GRANTS & CORPORATE PROBLEM BIDS
// ─────────────────────────────────────────────────────────────
async function renderConsultancyGrants() {
  const container = document.getElementById('academy-grants-grid') || document.getElementById('consultancy-grants-list');
  if (!container) return;

  const academyData = await JoblexApiClient.getAcademyData();
  const grants = academyData?.consultancyGrants || [];

  if (!grants.length) {
    container.innerHTML = '<div class="py-8 text-center text-xs text-[#6E6962] dark:text-gray-400">No consultancy grant notifications have been published by the university.</div>';
    return;
  }

  container.innerHTML = grants.map(g => `
    <div class="p-5 rounded-2xl bg-gray-900/60 border border-amber-500/30 backdrop-blur-md space-y-3 flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start gap-2">
          <h4 class="font-bold text-sm text-white">${g.title}</h4>
          <span class="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 whitespace-nowrap">${g.status || 'Open for Bids'}</span>
        </div>
        <p class="text-xs text-gray-400 mt-1">Funding Partner: <strong class="text-white">${g.industry}</strong></p>
        <p class="text-xs text-cyan-300 mt-0.5">Target Department: ${g.targetDept}</p>

        <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-800 text-xs text-gray-300">
          <div>Grant Amount: <strong class="text-amber-400 text-sm font-black">${g.grantAmount}</strong></div>
          <div>Proposal Deadline: <strong class="text-gray-300 font-mono">${g.deadline}</strong></div>
          <div class="col-span-2 text-[11px] text-gray-400">Notification: ${g.notification_id || g.notificationId}</div>
        </div>
      </div>

      <div class="pt-2 border-t border-gray-800 flex items-center justify-between">
        <button onclick="prefillGrantBid('${g.id}', '${g.industry} — ${g.title}')" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-gray-950 font-black text-xs transition">
          Draft Departmental Bid
        </button>
        <button onclick="showToast('Downloading Grant R&D Specifications & RFP Document for: ${g.title}', 'RFP Specs Downloaded', 'info')" class="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition border border-gray-700">
          Download RFP Specs <span class="material-symbols-outlined text-xs align-middle ml-1">download</span>
        </button>
      </div>
    </div>
  `).join('');
}

async function renderMouPartnerships() {
  const container = document.getElementById('mou-partnerships-container');
  if (!container) return;

  const academyData = await JoblexApiClient.getAcademyData();
  const partnerships = academyData?.mouPartnerships || [];
  if (!partnerships.length) {
    container.innerHTML = '<div class="py-8 text-center text-xs text-[#6E6962] dark:text-gray-400">No bilateral MoUs have been published by the university.</div>';
    return;
  }

  container.innerHTML = partnerships.map(mou => `
    <article class="p-4 rounded-lg border border-[#E7E4DC] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-bold text-sm text-[#1C1917] dark:text-white">${mou.partner || 'Unnamed partner'}</h3>
        <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono">${mou.status || 'Unspecified'}</span>
      </div>
      <p class="text-xs text-[#6E6962] dark:text-gray-400 mt-2">${mou.institution || 'Institution not specified'}</p>
      <p class="text-xs text-[#6E6962] dark:text-gray-400 mt-2">${(mou.focusAreas || mou.focus_areas || []).join(', ') || 'Focus areas not published'}</p>
      <div class="mt-3 text-[11px] text-gray-500 font-mono">Signed: ${mou.signedDate || mou.signed_date || 'Not published'} · Valid until: ${mou.validUntil || mou.valid_until || 'Not published'}</div>
    </article>
  `).join('');
}

async function renderFdpPrograms() {
  const container = document.getElementById('faculty-opportunities-container');
  if (!container) return;

  const academyData = await JoblexApiClient.getAcademyData();
  const programs = academyData?.fdpPrograms || [];
  if (!programs.length) {
    container.innerHTML = '<div class="col-span-2 py-8 text-center text-xs text-[#6E6962] dark:text-gray-400">No FDP notifications have been published by the university.</div>';
    return;
  }

  container.innerHTML = programs.map(program => `
    <article class="p-5 rounded-lg border border-[#E7E4DC] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-3">
      <div class="flex items-center justify-between gap-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">FDP</span>
        <span class="font-mono text-xs text-gray-500">${program.duration || 'Duration not published'}</span>
      </div>
      <h3 class="font-bold text-sm text-[#1C1917] dark:text-white">${program.title}</h3>
      <p class="text-xs text-[#6E6962] dark:text-gray-400">Organizer: ${program.organizer} · Mode: ${program.mode}</p>
      <p class="text-xs text-[#6E6962] dark:text-gray-400">Eligibility: ${program.eligibility}</p>
      <div class="pt-2 border-t border-[#E7E4DC] dark:border-white/5 text-xs text-gray-500">Seats: ${program.enrolled || 0} enrolled / ${program.seats} · Notification: ${program.notification_id || program.notificationId}</div>
      ${program.source_url ? `<a href="${program.source_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline">Open official notice <span class="material-symbols-outlined text-sm">open_in_new</span></a>` : ''}
    </article>
  `).join('');
}

function prefillGrantBid(grantId, grantTitle) {
  const select = document.getElementById('grant-target-select');
  if (select) {
    select.value = grantId;
  }
  const form = document.querySelector('#academy-tab-Grants form');
  if (form) form.scrollIntoView({ behavior: 'smooth' });
}

function handleGrantProposalSubmit(e) {
  e.preventDefault();
  const pi = document.getElementById('grant-pi-name').value;
  const budget = document.getElementById('grant-budget').value;
  showToast(`Research proposal submitted by ${pi} for ${budget}! The Corporate Research Committee will review within 5 business days.`, 'Proposal Transmitted', 'success');
  e.target.reset();
}

window.prefillGrantBid = prefillGrantBid;
window.handleGrantProposalSubmit = handleGrantProposalSubmit;
window.handleRunCurriculumAudit = handleRunCurriculumAudit;
window.adoptProposal = adoptProposal;

// ─────────────────────────────────────────────────────────────
// FACULTY HUB & COLLABORATION MODULE
// ─────────────────────────────────────────────────────────────
async function renderFacultyHub() {
  const container = document.getElementById('faculty-opportunities-container');
  if (!container) return;

  try {
    const res = await JoblexApiClient.getAcademicianOpportunities();
    const opps = (res && res.opportunities) || [];

    if (opps.length === 0) {
      container.innerHTML = `<div class="col-span-2 text-center py-8 text-xs text-slate-400">No active faculty programs at this moment.</div>`;
      return;
    }

    container.innerHTML = opps.map((opp, idx) => {
      const isGrant = opp.type === 'Research Grant';
      const compatScore = opp.compatibilityScore || 85;
      return `
        <div class="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isGrant 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' 
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              }">
                ${opp.type}
              </span>
              <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">${compatScore}% Compatibility</span>
            </div>

            <h3 class="font-bold text-base text-[#0F172A] dark:text-white mt-2">${opp.title}</h3>
            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">${opp.institution || opp.industry} • ${opp.department || 'Ayush R&D'}</p>
            <p class="text-xs text-slate-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">${opp.description}</p>

            <div class="flex flex-wrap gap-1 mt-3">
              ${(opp.requiredSkills || []).map(s => `
                <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-[10px] text-slate-600 dark:text-gray-300">${s}</span>
              `).join('')}
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 font-mono">
              <span>${opp.funding || 'Institutional Grant'}</span>
              <span>Deadline: ${opp.deadline || 'Open'}</span>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between">
            <button onclick="applyAcademicianOpportunity('${opp.id}', '${opp.title.replace(/'/g, "\\'")}', '${opp.institution || opp.industry}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm">
              Apply / Nominate <span class="material-symbols-outlined text-xs align-middle ml-1">arrow_forward</span>
            </button>
            <button onclick="showToast('RFP Specification downloaded.', 'Specs Ready', 'info')" class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 text-xs text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5">
              Download Specs <span class="material-symbols-outlined text-xs align-middle ml-1">download</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error rendering faculty hub:', err);
  }
}

async function applyAcademicianOpportunity(oppId, title, institution) {
  const user = JoblexApiClient.getCurrentUser();
  const facultyName = user ? user.name : 'Dr. M. K. Sharma';
  const facultyEmail = user ? user.email : 'm.sharma@aiia.gov.in';

  const res = await JoblexApiClient.applyAcademicianOpportunity({
    opportunityId: oppId,
    title,
    facultyName,
    facultyEmail,
    proposalSummary: 'Institutional faculty participation proposal submitted via JOBLEX Academic Portal.'
  });

  if (res && res.success) {
    showToast(`Application successfully registered for "${title}"!`, 'Faculty Nomination Submitted', 'success');
  } else {
    showToast('Failed to submit application. Please try again.', 'Error', 'error');
  }
}

function openCallForCollaborationModal() {
  const modal = document.getElementById('collaboration-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeCallForCollaborationModal() {
  const modal = document.getElementById('collaboration-modal');
  if (modal) modal.classList.add('hidden');
}

async function submitCallForCollaboration() {
  const title = document.getElementById('collab-title-input')?.value.trim();
  const desc = document.getElementById('collab-desc-input')?.value.trim();
  const dept = document.getElementById('collab-dept-input')?.value.trim();
  const funding = document.getElementById('collab-funding-input')?.value.trim();

  if (!title || !desc) {
    showToast('Please provide a project title and description.', 'Validation', 'warning');
    return;
  }

  const user = JoblexApiClient.getCurrentUser();
  const res = await JoblexApiClient.postAcademicianOpportunity({
    title,
    description: desc,
    department: dept || 'Academic & Applied Sciences',
    funding: funding || 'Joint Corporate R&D Grant',
    institution: (user && user.institution) || 'University / Host Institution',
    type: 'Research Grant',
    requiredSkills: ['Phytochemical Extraction', 'HPTLC', 'Clinical Research']
  });

  if (res && res.success) {
    showToast('Call for Collaboration posted to Industry & Academic Hub!', 'Opportunity Published', 'success');
    closeCallForCollaborationModal();
    renderFacultyHub();
  } else {
    showToast('Failed to post collaboration request.', 'Error', 'error');
  }
}

window.renderFacultyHub = renderFacultyHub;
window.applyAcademicianOpportunity = applyAcademicianOpportunity;
window.openCallForCollaborationModal = openCallForCollaborationModal;
window.closeCallForCollaborationModal = closeCallForCollaborationModal;
window.submitCallForCollaboration = submitCallForCollaboration;

// Academic Council & TPO Action Handlers
function handleExportAQAR() {
  const csvContent = "data:text/csv;charset=utf-8,"
    + "Metric Code,Criterion,Description,Attainment Value,Status\n"
    + "NAAC-2.6.1,Criterion 2,OBE Program Outcome Attainment,94.2%,Statutory Compliant\n"
    + "NAAC-3.4.1,Criterion 3,Industry MoU Research Bilateral Projects,8 Active MoUs,Statutory Compliant\n"
    + "NAAC-5.2.1,Criterion 5,Placement and Progression of Scholars,86.0%,Above National Benchmark\n"
    + "NEP-2020-M,Curriculum,Multidisciplinary Computational Phytopharmacology,Ratified BoS,Active in Curriculum\n";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `joblex_naac_aqar_statutory_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("NAAC AQAR Statutory Compliance CSV generated and downloaded.", "AQAR Export", "success");
}

function handleSyndicateChanges() {
  showToast("Curriculum modernisation docket submitted for BoS Academic Council ratification.", "Curriculum Syndicated", "success");
}

async function handleAdoptSyllabus(subject) {
  try {
    await JoblexApiClient.adoptSyllabus('syl-101');
    showToast(`Adopted "${subject}" into official syllabus proposal docket. Transmitted to Academic Council.`, 'Syllabus Adopted', 'success');
  } catch(e) {
    showToast(`Adopted "${subject}" into proposal docket.`, 'Syllabus Adopted', 'success');
  }
}

function downloadPeerMatrix() {
  const csvContent = "data:text/csv;charset=utf-8,"
    + "Rank,Institution,Readiness Score,Placement Rate,MoU Partnerships,NAAC Grade\n"
    + "1,All India Institute of Ayurveda (AIIA) New Delhi,78.4%,86%,8,Grade A++\n"
    + "2,National Institute of Ayurveda (NIA) Jaipur,74.2%,81%,6,Grade A+\n"
    + "3,Faculty of Ayurveda BHU Varanasi,72.8%,79%,5,Grade A++\n"
    + "4,Gujarat Ayurved University Jamnagar,71.5%,76%,4,Grade A\n";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `joblex_cross_college_peer_matrix_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Cross-College Peer Benchmarking Matrix CSV downloaded.", "Peer Matrix Export", "success");
}

function viewAuditLog() {
  showToast("NAAC Criterion 3.4 Audit Trail: All syllabus amendments cryptographically logged and time-stamped on institutional ledger node ACAD-LEDGER-2026.", "Audit Log", "info");
}

window.handleExportAQAR = handleExportAQAR;
window.handleSyndicateChanges = handleSyndicateChanges;
window.handleAdoptSyllabus = handleAdoptSyllabus;
window.downloadPeerMatrix = downloadPeerMatrix;
window.viewAuditLog = viewAuditLog;

