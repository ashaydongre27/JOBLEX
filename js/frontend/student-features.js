// ============================================================================
// FEATURE 1: Contextual To-Do Engine Logic
// ============================================================================
let studentTodos = [];
let activeTodoCategory = 'All';

async function fetchStudentTodos() {
  try {
    const user = JoblexApiClient.getCurrentUser();
    const sId = user ? (user.id || user.email) : 'guest';
    const res = await fetch(`/api/todos?studentId=${encodeURIComponent(sId)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.todos)) {
      studentTodos = data.todos;
      renderTodosList();
    }
  } catch (err) {
    console.warn('[Fetch Todos Error]:', err.message);
  }
}

function filterTodos(category) {
  activeTodoCategory = category;
  document.querySelectorAll('.todo-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-category') === category) {
      btn.className = 'todo-tab-btn px-3 py-1 rounded-lg font-bold transition bg-[#1C1917] text-white dark:bg-white dark:text-[#070709]';
    } else {
      btn.className = 'todo-tab-btn px-3 py-1 rounded-lg font-medium transition text-[#6E6962] dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5';
    }
  });
  renderTodosList();
}

function renderTodosList() {
  const container = document.getElementById('student-todos-list');
  if (!container) return;

  const filtered = activeTodoCategory === 'All'
    ? studentTodos
    : studentTodos.filter(t => t.category === activeTodoCategory);

  const completedCount = studentTodos.filter(t => t.isCompleted).length;
  const countEl = document.getElementById('todo-completion-count');
  if (countEl) {
    countEl.innerText = `${completedCount}/${studentTodos.length} Done (+10 XP/task)`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-xs text-[#6E6962] dark:text-gray-400">
        No tasks in "${activeTodoCategory}" category. Click "+ Add Task" to create one!
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const priorityColor = t.priority === 'Urgent' ? 'border-l-4 border-l-[#944C23] bg-rose-50/20' : (t.priority === 'High' ? 'border-l-2 border-l-[#855828]' : '');
    const priorityBadge = t.priority === 'Urgent' ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' : (t.priority === 'High' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' : 'text-slate-500 bg-slate-100 dark:bg-white/5');

    return `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-[#E7E4DC] dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/[0.04] ${priorityColor}">
        <div class="flex items-start gap-3 flex-1 min-w-0 pr-3">
          <button onclick="toggleTodo('${t.id}')" class="mt-0.5 w-5 h-5 rounded-md border ${t.isCompleted ? 'bg-[#2D5542] border-[#2D5542] text-white' : 'border-slate-300 dark:border-gray-600 hover:border-[#2D5542]'} flex items-center justify-center shrink-0 transition">
            ${t.isCompleted ? '<span class="material-symbols-outlined text-sm">check</span>' : ''}
          </button>
          <div class="min-w-0">
            <h4 class="text-xs font-semibold ${t.isCompleted ? 'line-through text-[#6E6962] dark:text-gray-500' : 'text-[#1C1917] dark:text-white'} truncate">${t.title}</h4>
            ${t.description ? `<p class="text-[11px] text-[#6E6962] dark:text-gray-400 line-clamp-1 mt-0.5">${t.description}</p>` : ''}
            <div class="flex items-center gap-2 mt-1 text-[10px]">
              <span class="px-1.5 py-0.5 rounded font-mono font-bold ${priorityBadge}">${t.priority}</span>
              <span class="text-[#6E6962] dark:text-gray-400 font-medium">${t.category}</span>
              ${t.dueDate ? `<span class="text-slate-400 dark:text-gray-500 font-mono">· Due ${new Date(t.dueDate).toLocaleDateString()}</span>` : ''}
            </div>
          </div>
        </div>

        <button onclick="deleteTodo('${t.id}')" class="text-slate-400 hover:text-rose-500 p-1 rounded transition shrink-0" title="Delete Task">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    `;
  }).join('');
}

async function toggleTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      const todo = studentTodos.find(t => t.id === id);
      if (todo) {
        todo.isCompleted = data.todo.isCompleted;
      }
      renderTodosList();
      if (window.showToast) {
        window.showToast(data.message, 'To-Do Engine', 'success');
      }
    }
  } catch (err) {
    console.error('[Toggle Todo Error]:', err);
  }
}

async function deleteTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      studentTodos = studentTodos.filter(t => t.id !== id);
      renderTodosList();
      if (window.showToast) window.showToast('Task removed from docket.', 'To-Do Engine', 'info');
    }
  } catch (err) {
    console.error('[Delete Todo Error]:', err);
  }
}

function openAddTodoModal() {
  document.getElementById('add-todo-modal')?.classList.remove('hidden');
}
function closeAddTodoModal() {
  document.getElementById('add-todo-modal')?.classList.add('hidden');
}

async function submitNewTodo(e) {
  e.preventDefault();
  const title = document.getElementById('todo-input-title').value;
  const description = document.getElementById('todo-input-desc').value;
  const category = document.getElementById('todo-input-category').value;
  const priority = document.getElementById('todo-input-priority').value;
  const dueDate = document.getElementById('todo-input-due').value;

  try {
    const user = JoblexApiClient.getCurrentUser();
    const sId = user ? (user.id || user.email) : 'guest';
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: sId, title, description, category, priority, dueDate })
    });
    const data = await res.json();
    if (data.success) {
      studentTodos.unshift(data.todo);
      renderTodosList();
      closeAddTodoModal();
      document.getElementById('todo-input-title').value = '';
      document.getElementById('todo-input-desc').value = '';
      if (window.showToast) window.showToast(`Task "${title}" created!`, 'To-Do Engine', 'success');
    }
  } catch (err) {
    console.error('[Submit Todo Error]:', err);
  }
}

// ============================================================================
// FEATURE 4: Corporate Masterclasses & Workshops Logic
// ============================================================================
let studentWorkshops = [];

async function fetchStudentWorkshops() {
  try {
    const user = JoblexApiClient.getCurrentUser();
    const sId = user ? (user.id || user.email) : 'guest';
    const res = await fetch(`/api/assessment/workshops?studentId=${encodeURIComponent(sId)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.workshops)) {
      studentWorkshops = data.workshops;
      renderWorkshopsList();
    }
  } catch (err) {
    console.warn('[Fetch Workshops Error]:', err.message);
  }
}

function renderWorkshopsList() {
  const container = document.getElementById('student-workshops-list');
  if (!container) return;

  if (studentWorkshops.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-xs text-[#6E6962]">No workshops scheduled currently.</div>`;
    return;
  }

  container.innerHTML = studentWorkshops.slice(0, 2).map(w => `
    <div class="p-3.5 rounded-xl border border-[#E7E4DC] dark:border-white/5 bg-[#FAF8F5]/60 dark:bg-white/[0.02] space-y-2.5">
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-xs font-bold text-[#1C1917] dark:text-white leading-snug">${w.title}</h4>
        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shrink-0">
          ${w.durationMinutes || 90}m Live
        </span>
      </div>
      <p class="text-[11px] text-[#6E6962] dark:text-gray-400 line-clamp-2 leading-relaxed">
        Speaker: <span class="font-semibold text-[#1C1917] dark:text-white">${w.speakerName}</span> (${w.hostCompanyName})
      </p>
      <div class="flex items-center justify-between pt-1">
        <span class="text-[10px] font-mono text-[#6E6962] dark:text-gray-400">
          ${w.enrolledCount || 0}/${w.maxSeats || 250} Seats Taken
        </span>
        <button onclick="rsvpWorkshop('${w.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition ${w.isEnrolled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-[#944C23] text-white hover:bg-[#7a3e1c]'}">
          ${w.isEnrolled ? '✓ Registered' : 'RSVP - 1 Click'}
        </button>
      </div>
    </div>
  `).join('');
}

async function rsvpWorkshop(wspId) {
  try {
    const user = JoblexApiClient.getCurrentUser();
    const sId = user ? (user.id || user.email) : 'guest';
    const res = await fetch(`/api/assessment/workshops/${wspId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: sId })
    });
    const data = await res.json();
    if (data.success) {
      const wsp = studentWorkshops.find(w => w.id === wspId);
      if (wsp) {
        wsp.isEnrolled = true;
        wsp.enrolledCount = (wsp.enrolledCount || 0) + 1;
      }
      renderWorkshopsList();
      fetchStudentTodos(); // Refresh todos since RSVP injects a task
      if (window.showToast) window.showToast(data.message, 'Workshop Gateway', 'success');
    } else {
      if (window.showToast) window.showToast(data.error || 'Already registered.', 'Workshop Gateway', 'info');
    }
  } catch (err) {
    console.error('[RSVP Error]:', err);
  }
}

// ============================================================================
// FEATURE 5: Aptitude Test Runner Modal Logic
// ============================================================================
let aptitudeQuestions = [];
let aptitudeUserAnswers = {};

async function openAptitudeModal() {
  document.getElementById('aptitude-modal')?.classList.remove('hidden');
  const container = document.getElementById('aptitude-questions-container');
  if (container) container.innerHTML = '<div class="py-12 text-center text-xs text-[#6E6962]">Loading 30 multi-domain questions...</div>';

  try {
    const res = await fetch('/api/assessment/aptitude/questions');
    const data = await res.json();
    if (data.success && Array.isArray(data.questions)) {
      aptitudeQuestions = data.questions;
      aptitudeUserAnswers = {};
      renderAptitudeQuestions();
    }
  } catch (err) {
    console.error('[Load Aptitude Error]:', err);
  }
}

function closeAptitudeModal() {
  document.getElementById('aptitude-modal')?.classList.add('hidden');
}

function renderAptitudeQuestions() {
  const container = document.getElementById('aptitude-questions-container');
  if (!container) return;

  container.innerHTML = aptitudeQuestions.map((q, qIdx) => `
    <div class="p-4 rounded-xl border border-[#E7E4DC] dark:border-white/5 bg-[#FAF8F5]/60 dark:bg-white/[0.02] space-y-3">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#855828]/10 text-[#855828] dark:text-[#D4973B]">
          Q${qIdx + 1} · ${q.domain}
        </span>
        <span class="text-[10px] font-mono text-slate-400">${q.difficulty}</span>
      </div>
      <p class="text-xs font-semibold text-[#1C1917] dark:text-white leading-relaxed">${q.questionText}</p>
      <div class="space-y-1.5 pt-1">
        ${(q.options || []).map((opt, optIdx) => `
          <label class="flex items-center gap-3 p-2.5 rounded-lg border border-[#E7E4DC] dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.04] cursor-pointer transition text-xs text-[#1C1917] dark:text-gray-300">
            <input type="radio" name="q_${q.id}" value="${optIdx}" onchange="recordAptitudeAnswer('${q.id}', ${optIdx})" class="text-[#2D5542] focus:ring-[#2D5542]">
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function recordAptitudeAnswer(qId, optIdx) {
  aptitudeUserAnswers[qId] = optIdx;
  const count = Object.keys(aptitudeUserAnswers).length;
  const el = document.getElementById('aptitude-answered-count');
  if (el) el.innerText = `${count} of ${aptitudeQuestions.length} Answered`;
}

async function submitAptitudeTest() {
  try {
    const user = JoblexApiClient.getCurrentUser();
    const sId = user ? (user.id || user.email) : 'guest';
    const res = await fetch('/api/assessment/aptitude/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: sId,
        answers: aptitudeUserAnswers
      })
    });
    const data = await res.json();
    if (data.success) {
      closeAptitudeModal();
      const pctBadge = document.getElementById('aptitude-percentile-badge');
      if (pctBadge && data.session) {
        pctBadge.innerText = `${data.session.percentile}%`;
      }
      if (window.showToast) window.showToast(data.message, 'Aptitude Engine', 'success');
    }
  } catch (err) {
    console.error('[Submit Aptitude Error]:', err);
  }
}

// ============================================================================
// FEATURE 7: Company Skill Certification Quizzes & Verifications Logic
// ============================================================================
let activeQuizId = null;
let currentQuizData = null;
let quizAnswers = {};

async function fetchCertifications() {
  try {
    const user = JoblexApiClient.getCurrentUser();
    const sId = user ? (user.id || user.email) : 'guest';
    const res = await fetch(`/api/assessment/certifications?studentId=${encodeURIComponent(sId)}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.certifications)) {
      renderCertificationsList(data.certifications);
    }
  } catch (err) {
    console.warn('[Fetch Certs Error]:', err);
  }
}

function renderCertificationsList(certs) {
  const container = document.getElementById('student-certifications-list');
  if (!container) return;

  if (certs.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-xs text-[#6E6962]">Take a skill quiz to earn verified company badges.</div>`;
    return;
  }

  container.innerHTML = certs.map(c => `
    <div class="p-3.5 rounded-xl border border-[#2D5542]/20 dark:border-[#4EBA87]/20 bg-[#2D5542]/5 dark:bg-[#4EBA87]/5 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[#2D5542] dark:bg-[#4EBA87] text-white flex items-center justify-center shrink-0 shadow-sm">
          <span class="material-symbols-outlined text-xl">verified</span>
        </div>
        <div>
          <h4 class="text-xs font-bold text-[#1C1917] dark:text-white">${c.badgeTitle}</h4>
          <p class="text-[11px] text-[#6E6962] dark:text-gray-400">Issued by ${c.companyName} · Score: ${c.scorePercentage}%</p>
        </div>
      </div>
      <button onclick="viewCredentialDetails('${c.verificationToken}')" class="px-3 py-1.5 rounded-lg border border-[#2D5542] dark:border-[#4EBA87] text-[#2D5542] dark:text-[#4EBA87] font-bold text-[11px] hover:bg-[#2D5542] hover:text-white transition">
        View Credential
      </button>
    </div>
  `).join('');
}

async function openSkillQuizModal(quizId) {
  activeQuizId = quizId || 'quiz-dabur-01';
  document.getElementById('quiz-runner-modal')?.classList.remove('hidden');
  const body = document.getElementById('quiz-questions-body');
  if (body) body.innerHTML = '<div class="py-12 text-center text-xs text-[#6E6962]">Loading certification questions...</div>';

  try {
    const res = await fetch(`/api/assessment/quiz/${activeQuizId}`);
    const data = await res.json();
    if (data.success && data.quiz) {
      currentQuizData = data.quiz;
      quizAnswers = {};
      document.getElementById('quiz-modal-title').innerText = data.quiz.badgeTitle;
      document.getElementById('quiz-modal-subtitle').innerText = `Issued by ${data.quiz.companyName} · Passing: ${data.quiz.passingPercentage}%`;

      body.innerHTML = (data.quiz.questions || []).map((q, idx) => `
        <div class="p-4 rounded-xl border border-[#E7E4DC] dark:border-white/5 bg-[#FAF8F5]/60 dark:bg-white/[0.02] space-y-2.5">
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
            Question ${idx + 1}
          </span>
          <p class="text-xs font-semibold text-[#1C1917] dark:text-white leading-relaxed">${q.question}</p>
          <div class="space-y-1.5 pt-1">
            ${(q.options || []).map((opt, optIdx) => `
              <label class="flex items-center gap-3 p-2.5 rounded-lg border border-[#E7E4DC] dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.04] cursor-pointer transition text-xs text-[#1C1917] dark:text-gray-300">
                <input type="radio" name="qz_${q.id}" value="${optIdx}" onchange="quizAnswers['${q.id}'] = ${optIdx}" class="text-[#2D5542] focus:ring-[#2D5542]">
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('[Load Quiz Error]:', err);
  }
}

function closeSkillQuizModal() {
  document.getElementById('quiz-runner-modal')?.classList.add('hidden');
}

async function submitSkillQuiz() {
  if (!activeQuizId) return;
  try {
    const user = JoblexApiClient.getCurrentUser();
    const sId = user ? (user.id || user.email) : 'guest';
    const res = await fetch(`/api/assessment/quiz/${activeQuizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: sId,
        answers: quizAnswers
      })
    });
    const data = await res.json();
    if (data.success) {
      closeSkillQuizModal();
      fetchCertifications();
      if (window.showToast) {
        window.showToast(data.message, 'Skill Certification', data.passed ? 'success' : 'warning');
      }
    }
  } catch (err) {
    console.error('[Submit Quiz Error]:', err);
  }
}

async function viewCredentialDetails(token) {
  try {
    const res = await fetch(`/api/assessment/verify/${token}`);
    const data = await res.json();
    if (data.success && data.credential) {
      document.getElementById('cred-badge-title').innerText = data.credential.badgeTitle;
      document.getElementById('cred-issued-to').innerText = `Conferred upon ${data.credential.recipientName}`;
      document.getElementById('cred-score').innerText = data.credential.scoreAttained;
      document.getElementById('cred-issuer').innerText = data.credential.issuingOrganization;
      document.getElementById('cred-token').innerText = data.credential.verificationToken;
      document.getElementById('credential-viewer-modal')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error('[Verify Credential Error]:', err);
  }
}

function closeCredentialModal() {
  document.getElementById('credential-viewer-modal')?.classList.add('hidden');
}

// Startup initializations
document.addEventListener('DOMContentLoaded', () => {
  fetchStudentTodos();
  fetchStudentWorkshops();
  fetchCertifications();
});