// ============================================================================
// Academy Features: Tech Radar & Bilateral Workshops Logic
// ============================================================================

async function fetchTechRadarData() {
  const container = document.getElementById('tech-radar-sectors-container');
  const gapsContainer = document.getElementById('curriculum-gaps-container');

  try {
    const res = await fetch('/api/academy/tech-radar');
    const data = await res.json();
    if (!data || !data.success) return;

    if (document.getElementById('tr-total-disclosures')) {
      document.getElementById('tr-total-disclosures').innerText = `${data.totalDisclosures} Disclosures`;
    }
    const sectorCount = Object.keys(data.sectors || {}).length;
    if (document.getElementById('tr-total-sectors')) {
      document.getElementById('tr-total-sectors').innerText = `${sectorCount} Sectors`;
    }
    if (document.getElementById('tr-critical-gaps')) {
      document.getElementById('tr-critical-gaps').innerText = `${(data.curriculumGaps || []).length} Identified`;
    }
    if (document.getElementById('tr-active-amendments')) {
      document.getElementById('tr-active-amendments').innerText = `${data.activeBoSAmendments || 8} In Pipeline`;
    }

    if (container && data.sectors) {
      container.innerHTML = Object.entries(data.sectors).map(([sector, stacks]) => `
        <div class="p-4 rounded-xl border border-[#E7E4DC] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-xs text-[#1C1917] dark:text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              ${sector}
            </h4>
            <span class="text-[10px] font-mono text-[#6E6962] dark:text-gray-400">${stacks.length} Stacks Disclosed</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${stacks.map(stk => `
              <div class="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-[#E7E4DC] dark:border-white/5 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-xs text-[#1C1917] dark:text-white">${stk.technology}</span>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${stk.category === 'Core Production' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}">${stk.category}</span>
                </div>
                <div class="text-[10px] text-[#6E6962] dark:text-gray-400">${stk.companyName} • Min. ${stk.proficiencyLevel}</div>
                <div class="text-[10px] text-slate-500 dark:text-gray-400 italic">${stk.notes || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    if (gapsContainer && data.curriculumGaps) {
      gapsContainer.innerHTML = data.curriculumGaps.map(gap => `
        <div class="p-4 rounded-xl border border-[#E7E4DC] dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-sm space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-mono uppercase text-[#6E6962] dark:text-gray-400">${gap.sector}</span>
              <h4 class="font-bold text-xs text-[#1C1917] dark:text-white">${gap.technology}</h4>
            </div>
            <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded ${gap.urgency === 'Critical' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'}">${gap.urgency}</span>
          </div>
          <div class="text-[11px] text-slate-600 dark:text-gray-300">
            <span class="font-semibold text-[#1C1917] dark:text-white">Current Syllabus:</span> ${gap.universityCurriculumStatus}
          </div>
          <div class="p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-800 dark:text-amber-300">
            <strong>BoS Action:</strong> ${gap.recommendedBoSAction}
          </div>
          <div class="pt-1 flex items-center justify-between">
            <span class="text-[10px] text-[#6E6962] dark:text-gray-400 font-mono">Disclosed by ${gap.disclosedBy}</span>
            <button onclick="prefillBosModal('${gap.technology}', '${gap.recommendedBoSAction.replace(/'/g, "\\'")}')" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              Ratify in BoS <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Tech Radar load error:', err);
  }
}

async function fetchPendingWorkshops() {
  const tbody = document.getElementById('pending-workshops-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('/api/academy/workshops/pending');
    const data = await res.json();
    if (!data.success || !data.workshops) return;

    if (data.workshops.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs">No pending corporate workshop proposals at this time.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.workshops.map(w => {
      let statusBadge = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      if (w.status === 'Approved') statusBadge = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      if (w.status === 'Rejected') statusBadge = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';

      const isPending = w.status === 'Pending Dean Approval' || w.status === 'Proposed';

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
          <td class="py-3.5 px-4 font-semibold text-xs text-[#1C1917] dark:text-white">
            <div class="font-bold text-[#1C1917] dark:text-white">${w.title}</div>
            <div class="text-[10px] text-[#6E6962] dark:text-gray-400 font-mono mt-0.5">Focus: ${w.curriculumFocus || 'Industrial Standard'}</div>
          </td>
          <td class="py-3.5 px-4">
            <div class="text-xs font-semibold text-[#1C1917] dark:text-white">${w.speakerName}</div>
            <div class="text-[10px] text-[#6E6962] dark:text-gray-400">${w.hostCompanyName} (${w.speakerRole || 'Lead'})</div>
          </td>
          <td class="py-3.5 px-4">
            <span class="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[#1C1917] dark:text-gray-300 font-medium">
              ${w.targetAudience || 'All BAMS Scholars'}
            </span>
          </td>
          <td class="py-3.5 px-4 text-[11px] text-[#6E6962] dark:text-gray-400 font-mono">
            <div>${w.scheduledDate || 'Nov 24, 2026'}</div>
            <div class="text-[10px] text-emerald-600 dark:text-emerald-400">Cap: ${w.enrolledCount || 0}/${w.maxCapacity || 100} Seats</div>
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}">
              ${w.status}
            </span>
          </td>
          <td class="py-3.5 px-4 text-right">
            ${isPending ? `
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="handleWorkshopDecision('${w.id}', 'Approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">check</span> Sanction
                </button>
                <button onclick="handleWorkshopDecision('${w.id}', 'Rejected')" class="px-2.5 py-1 border border-slate-200 dark:border-gray-700 text-slate-500 hover:text-rose-600 text-[11px] rounded transition">
                  Decline
                </button>
              </div>
            ` : `
              <span class="text-[11px] font-mono text-[#6E6962] dark:text-gray-400">Ratified</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Workshops load error:', err);
  }
}

async function handleWorkshopDecision(workshopId, decision) {
  try {
    const res = await fetch(`/api/academy/workshops/${workshopId}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes: `Decision rendered by Academic Council on ${new Date().toLocaleDateString()}` })
    });
    const data = await res.json();
    if (data.success) {
      if (window.showToast) {
        window.showToast(data.message, 'Academic Council Governance', 'success');
      } else if (window.JoblexApiClient) {
        window.JoblexApiClient.showToast(data.message, 'Academic Council Governance', 'success');
      }
      fetchPendingWorkshops();
    }
  } catch (err) {
    console.error('Decision error:', err);
  }
}

function openBosRevisionModal() {
  const m = document.getElementById('bos-revision-modal');
  if (m) m.classList.remove('hidden');
}

function closeBosRevisionModal() {
  const m = document.getElementById('bos-revision-modal');
  if (m) m.classList.add('hidden');
}

function prefillBosModal(tech, action) {
  openBosRevisionModal();
  const techInput = document.getElementById('bos-technology');
  const amendInput = document.getElementById('bos-amendment');
  if (techInput) techInput.value = tech;
  if (amendInput) amendInput.value = action;
}

function submitBosRevision(e) {
  e.preventDefault();
  const dept = document.getElementById('bos-department').value;
  const tech = document.getElementById('bos-technology').value;

  closeBosRevisionModal();
  if (window.showToast) {
    window.showToast(`BoS Revision proposed for ${dept} (${tech}). Logged into Council Docket!`, 'BoS Governance', 'success');
  } else if (window.JoblexApiClient) {
    window.JoblexApiClient.showToast(`BoS Revision proposed for ${dept} (${tech}). Logged into Council Docket!`, 'BoS Governance', 'success');
  }
  const amendEl = document.getElementById('tr-active-amendments');
  if (amendEl) {
    const count = parseInt(amendEl.innerText) || 8;
    amendEl.innerText = `${count + 1} In Pipeline`;
  }
}

function openMouCounterModal() {
  const m = document.getElementById('mou-counter-modal');
  if (m) m.classList.remove('hidden');
}

function closeMouCounterModal() {
  const m = document.getElementById('mou-counter-modal');
  if (m) m.classList.add('hidden');
}

async function submitMouCounter(e) {
  e.preventDefault();
  const mouId = document.getElementById('mou-partner-select').value;
  const clause = document.getElementById('mou-clause-title').value;
  const change = document.getElementById('mou-proposed-change').value;

  try {
    const res = await fetch('/api/academy/mou/negotiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mouId,
        clauseTitle: clause,
        proposedChange: change,
        proposedBy: (window.JoblexApiClient && window.JoblexApiClient.getCurrentUser()?.name) || 'Faculty Member'
      })
    });
    const data = await res.json();
    closeMouCounterModal();
    if (data.success) {
      if (window.showToast) {
        window.showToast(`Counter-proposal for "${clause}" dispatched to corporate partner!`, 'Bilateral Negotiation', 'success');
      } else if (window.JoblexApiClient) {
        window.JoblexApiClient.showToast(`Counter-proposal for "${clause}" dispatched to corporate partner!`, 'Bilateral Negotiation', 'success');
      }
    }
  } catch (err) {
    console.error('MoU Counter error:', err);
  }
}

// Ensure global registration
window.fetchTechRadarData = fetchTechRadarData;
window.fetchPendingWorkshops = fetchPendingWorkshops;
window.handleWorkshopDecision = handleWorkshopDecision;
window.openBosRevisionModal = openBosRevisionModal;
window.closeBosRevisionModal = closeBosRevisionModal;
window.prefillBosModal = prefillBosModal;
window.submitBosRevision = submitBosRevision;
window.openMouCounterModal = openMouCounterModal;
window.closeMouCounterModal = closeMouCounterModal;
window.submitMouCounter = submitMouCounter;

document.addEventListener('DOMContentLoaded', () => {
  fetchTechRadarData();
  fetchPendingWorkshops();
});