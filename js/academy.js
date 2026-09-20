/**
 * JOBLEX Academy Portal - Interactive Logic
 * Enhanced with SIH 26044 Innovation Ideas from otherIdeas.md:
 * 9. Curriculum Gap Alerts & NEP-2020 Accreditation Audit
 * 10. Placement Cell (TPO) Command Center
 */

let activeAcademyTab = 'Progress';

const STUDENTS_DATA = [
  { name: 'Aarav Sharma', dept: 'Pharmacology & Health-AI', score: 88, quizzes: 8, status: 'On Track' },
  { name: 'Kavya Singh', dept: 'Ayurvedic Informatics', score: 92, quizzes: 10, status: 'On Track' },
  { name: 'Rohan Sharma', dept: 'Phytochemistry & QC', score: 68, quizzes: 4, status: 'Needs Attention' },
  { name: 'Ananya Roy', dept: 'Clinical Herbal Medicine', score: 79, quizzes: 7, status: 'On Track' },
  { name: 'Deepak Joshi', dept: 'Pharmacognosy', score: 54, quizzes: 2, status: 'At Risk' },
  { name: 'Priya Nair', dept: 'Ayurvedic Drug Discovery', score: 95, quizzes: 12, status: 'On Track' }
];

const SYLLABUS_PROPOSALS = [
  {
    id: 101,
    currentTopic: 'Traditional Herbal Pharmacognosy (Unit 3)',
    suggestedAddition: 'Computational Molecular Docking of Botanicals using Python & AutoDock',
    source: 'MoU Partner: Dabur Research & Development Ltd.',
    impact: 'Closes 68% candidate gap for Formulation Scientist positions',
    adopted: false
  },
  {
    id: 102,
    currentTopic: 'Herbal Standardization & Quality Control (Unit 5)',
    suggestedAddition: 'Automated High-Performance Thin-Layer Chromatography (HPTLC) Fingerprinting Protocols',
    source: 'MoU Partner: Himalaya Wellness R&D',
    impact: 'Required for Good Laboratory Practice (GLP) industrial compliance',
    adopted: false
  },
  {
    id: 103,
    currentTopic: 'Clinical Medicine Protocols (Unit 2)',
    suggestedAddition: 'Digital Health Records & AI-Powered Prakriti Profiling Databases',
    source: 'National AYUSH Mission Initiative 2026',
    impact: 'Meets NEP-2020 technology integration benchmarks',
    adopted: false
  }
];

document.addEventListener('DOMContentLoaded', () => {
  renderStudentTable();
  renderSyllabusProposals();
  renderTPOMetrics();
});

function switchAcademyTab(tabId) {
  activeAcademyTab = tabId;

  document.querySelectorAll('.academy-tab-content').forEach(el => el.classList.add('hidden'));

  const target = document.getElementById(`academy-tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.academy-nav-tab').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'academy-nav-tab pb-2 text-xs sm:text-sm font-bold border-b-2 border-emerald-500 text-emerald-300 transition whitespace-nowrap';
    } else {
      btn.className = 'academy-nav-tab pb-2 text-xs sm:text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition whitespace-nowrap';
    }
  });
}

function renderStudentTable() {
  const tbody = document.getElementById('student-table-body');
  if (!tbody) return;

  tbody.innerHTML = STUDENTS_DATA.map(st => {
    let statusClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (st.status === 'Needs Attention') statusClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (st.status === 'At Risk') statusClass = 'bg-red-500/20 text-red-300 border-red-500/40';

    return `
      <tr class="border-b border-gray-800 hover:bg-white/[0.02] transition">
        <td class="py-3 px-4 text-xs font-semibold text-white">${st.name}</td>
        <td class="py-3 px-4 text-xs text-gray-300">${st.dept}</td>
        <td class="py-3 px-4 text-xs font-mono font-bold text-emerald-400">${st.score}%</td>
        <td class="py-3 px-4 text-xs text-gray-300">${st.quizzes} Done</td>
        <td class="py-3 px-4 text-xs">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}">
            ${st.status}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderSyllabusProposals() {
  const container = document.getElementById('syllabus-proposals-grid');
  if (!container) return;

  container.innerHTML = SYLLABUS_PROPOSALS.map(prop => `
    <div class="p-5 rounded-2xl bg-gray-900/60 border ${prop.adopted ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-gray-800'} backdrop-blur-md space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-[10px] uppercase font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          AI Curriculum Recommendation
        </span>
        <span class="text-xs text-gray-400 font-mono">${prop.source}</span>
      </div>
      <div>
        <h4 class="text-xs text-gray-400 font-semibold mb-0.5">Target Course Topic:</h4>
        <p class="text-xs text-gray-200">${prop.currentTopic}</p>
      </div>
      <div class="p-3 rounded-xl bg-black/40 border border-emerald-500/20">
        <h4 class="text-xs text-emerald-300 font-bold mb-1">Proposed Syllabus Modernization:</h4>
        <p class="text-xs sm:text-sm text-white font-medium">${prop.suggestedAddition}</p>
        <span class="text-[11px] text-gray-400 mt-1 block">Impact: ${prop.impact}</span>
      </div>
      <div class="flex items-center justify-end gap-2 pt-2">
        ${prop.adopted 
          ? `<span class="text-xs text-emerald-400 font-bold px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">✓ Adopted for Academic Council</span>`
          : `
            <button onclick="adoptProposal(${prop.id})" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition">
              Adopt Syllabus Add-on
            </button>
          `
        }
      </div>
    </div>
  `).join('');
}

function adoptProposal(id) {
  const p = SYLLABUS_PROPOSALS.find(x => x.id === id);
  if (p) {
    p.adopted = true;
    renderSyllabusProposals();
  }
}

// ─────────────────────────────────────────────────────────────
// TPO COMMAND CENTER LOGIC (Idea #10)
// ─────────────────────────────────────────────────────────────
function renderTPOMetrics() {
  const tpo = JoblexAPI.tpoMetrics;
  if (!tpo) return;

  const appliedEl = document.getElementById('tpo-applied');
  const shortEl = document.getElementById('tpo-shortlisted');
  const placedEl = document.getElementById('tpo-placed');
  const readinessEl = document.getElementById('tpo-readiness');

  if (appliedEl) appliedEl.innerText = tpo.funnel.applied;
  if (shortEl) shortEl.innerText = tpo.funnel.shortlisted;
  if (placedEl) placedEl.innerText = tpo.funnel.offersAccepted;
  if (readinessEl) readinessEl.innerText = `${tpo.predictivePlacementReadiness}% Placement Ready`;
}
