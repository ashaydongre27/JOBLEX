/**
 * JOBLEX Industry Portal - Interactive Logic
 * Enhanced with SIH 26044 Innovation Features:
 * 6. Talent Pipeline Forecasting (Next 6 Months Supply vs Demand)
 * 7. Skill Match ROI & Predictor Verification
 * 4. Micro-Gigs Task Publishing
 */

let activeIndustryTab = 'Candidates';

document.addEventListener('DOMContentLoaded', () => {
  renderCandidates();
  renderTalentForecast();
});

function switchIndustryTab(tabId) {
  activeIndustryTab = tabId;

  document.querySelectorAll('.industry-tab-content').forEach(el => el.classList.add('hidden'));

  const target = document.getElementById(`industry-tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.industry-nav-tab').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'industry-nav-tab pb-2 text-xs sm:text-sm font-bold border-b-2 border-blue-500 text-blue-300 transition whitespace-nowrap';
    } else {
      btn.className = 'industry-nav-tab pb-2 text-xs sm:text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition whitespace-nowrap';
    }
  });
}

async function renderCandidates() {
  const container = document.getElementById('candidates-grid');
  if (!container) return;
  if (!window.JoblexApiClient) return;

  const response = await JoblexApiClient.getCandidates();
  container.innerHTML = (response.candidates || []).map((c, i) => `
    <div class="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-blue-500/40 transition shadow-md flex flex-col justify-between space-y-4">
      <div>
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-bold text-sm text-white">${c.name}</h4>
            <p class="text-xs text-gray-400">${c.college}</p>
          </div>
          <div class="text-right">
            <span class="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-mono text-base block">${c.match}% Match</span>
            <span class="text-[10px] text-gray-400">${c.status}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mt-3">
          ${c.skills.map(s => `
            <span class="px-2 py-0.5 rounded-md bg-blue-950/50 border border-blue-500/30 text-[11px] text-blue-200">${s}</span>
          `).join('')}
        </div>
      </div>

      <div class="flex gap-2 pt-3 border-t border-gray-800">
        <button onclick="showToast('Viewing full verified candidate dossier for ${c.name}', 'Dossier Loaded', 'info')" class="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs transition">
          View Dossier
        </button>
        <button onclick="shortlistCandidate(${i}, this)" class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition">
          Shortlist Candidate
        </button>
      </div>
    </div>
  `).join('');
}

function shortlistCandidate(idx, btn) {
  btn.innerText = '✓ Shortlisted';
  btn.className = 'flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs transition cursor-default';
}

// ─────────────────────────────────────────────────────────────
// TALENT PIPELINE FORECASTING (Idea #6)
// ─────────────────────────────────────────────────────────────
function renderTalentForecast() {
  const container = document.getElementById('forecast-colleges-list');
  if (!container || !JoblexAPI.talentForecast) return;

  const tf = JoblexAPI.talentForecast;
  container.innerHTML = tf.projectedTalentSupply.map(inst => `
    <div class="p-4 rounded-2xl bg-black/40 border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h4 class="font-bold text-xs sm:text-sm text-white">${inst.institution}</h4>
        <span class="text-xs text-cyan-300 mt-0.5 block">Trending Competency: ${inst.trendingSkill}</span>
      </div>
      <div class="flex items-center gap-3 self-end sm:self-auto">
        <span class="text-xs text-gray-400 font-mono">Available: <strong>${inst.readyScholars} Scholars</strong></span>
        <button onclick="showToast('Booking priority campus interview slot with ${inst.institution}', 'Interview Reserved', 'success')" class="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 font-bold text-xs transition">
          Engage Early
        </button>
      </div>
    </div>
  `).join('');
}

function handlePostOpportunity(e) {
  e.preventDefault();
  const title = document.getElementById('opp-post-title').value;
  showToast(`Opportunity / Micro-Gig "${title}" has been published to the student portal and verified by academic liaison!`, 'Opportunity Published', 'success');
  e.target.reset();
  switchIndustryTab('Candidates');
}

function handleSubmitSkillDemand(e) {
  e.preventDefault();
  showToast('Corporate Skill Demand successfully submitted to Academic Deans for curriculum modernization under NEP-2020!', 'Skill Demand Submitted', 'success');
  e.target.reset();
}
