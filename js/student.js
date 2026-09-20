/**
 * JOBLEX Student Portal - Core Interactive JavaScript
 * Enhanced with SIH 26044 Innovation Ideas from otherIdeas.md:
 * 1. Skill Decay & Refresh Alerts
 * 2. Anonymized Peer Benchmarking (Percentile comparison with placed peers)
 * 4. Micro-Internships / Task-Based Gigs (1-2 weeks)
 * 5. Failure-Aware Recommendation Loop
 * 13. Bilingual Localization (Hindi / English)
 * 14. Trust & Verification Layer (QR Institutional Verification)
 */

let roadmapState = null;
let currentXp = 1450;
let currentStreak = 7;
let activeModule = 'Roadmap';

// Quiz questions
const QUIZ_DATA = [
  {
    question: "Which of the following is considered one of the three primary doshas in classical Ayurveda?",
    options: ["Prana", "Vata", "Chakra", "Ojas"],
    correct: 1
  },
  {
    question: "What is the primary pharmacological role of Withania somnifera (Ashwagandha)?",
    options: ["Digestive stimulant", "Adaptogen for stress modulation", "Cooling purgative", "Antacid"],
    correct: 1
  },
  {
    question: "In Python, which library is the industry standard for tabular data manipulation?",
    options: ["Django", "TensorFlow", "Pandas", "PyGame"],
    correct: 2
  },
  {
    question: "What analytical chromatography technique is mandated by pharmacopeia for herbal fingerprinting?",
    options: ["HPTLC / HPLC", "Simple Distillation", "Gram Staining", "Paper Chromatography"],
    correct: 0
  },
  {
    question: "Which classical treatise forms the core foundation of Ayurvedic internal medicine (Kayachikitsa)?",
    options: ["Charaka Samhita", "Arthashastra", "Rigveda", "Kama Sutra"],
    correct: 0
  }
];

let quizState = {
  started: false,
  currentIndex: 0,
  selectedAnswer: null,
  score: 0,
  finished: false
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  const user = JoblexAPI.getCurrentUser();
  if (user) {
    document.querySelectorAll('.user-name-display').forEach(el => el.innerText = user.name);
    if (user.xp) currentXp = user.xp;
    if (user.streak) currentStreak = user.streak;
  }

  updateHeaderMetrics();

  // Load Roadmap
  roadmapState = await JoblexAPI.getRoadmap();
  renderRoadmap();

  // Load Opportunities
  renderOpportunities('All');

  // Load Peer Benchmarking & Decay Alert
  renderPeerBenchmarking();

  // Load Skills Canvas if visible
  initSkillTree();

});

function updateHeaderMetrics() {
  const xpEl = document.getElementById('header-xp-badge');
  const streakEl = document.getElementById('header-streak-badge');
  if (xpEl) xpEl.innerText = `${currentXp} XP`;
  if (streakEl) streakEl.innerText = `${currentStreak}-Day Streak`;
}

// Module Navigation
function switchModule(moduleId) {
  activeModule = moduleId;

  // Hide all sections
  document.querySelectorAll('.student-module-section').forEach(sec => sec.classList.add('hidden'));

  // Show active section
  const target = document.getElementById(`module-${moduleId}`);
  if (target) target.classList.remove('hidden');

  // Update desktop sidebar active styles
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    const btnId = btn.getAttribute('data-module');
    if (btnId === moduleId) {
      btn.className = 'sidebar-nav-btn w-full flex flex-col items-start px-3.5 py-2 rounded-xl text-left transition-all bg-purple-600/25 border border-purple-500/80 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.25)]';
    } else {
      btn.className = 'sidebar-nav-btn w-full flex flex-col items-start px-3.5 py-2 rounded-xl text-left transition-all text-gray-400 hover:text-white hover:bg-white/5 border border-transparent';
    }
  });

  // Update mobile quick pills
  document.querySelectorAll('.quick-pill-btn').forEach(btn => {
    const btnId = btn.getAttribute('data-module');
    if (btnId === moduleId) {
      btn.className = 'quick-pill-btn whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all border bg-purple-600 text-white border-purple-400 shadow-sm';
    } else {
      btn.className = 'quick-pill-btn whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all border bg-gray-900 text-gray-400 border-gray-800 hover:text-white';
    }
  });

  // Close mobile drawer if open
  closeMobileMenu();

  // Redraw skill tree if switched to it
  if (moduleId === 'SkillTree') {
    setTimeout(drawSkillTree, 50);
  }
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) drawer.classList.toggle('hidden');
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) drawer.classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────
// ROADMAP LOGIC
// ─────────────────────────────────────────────────────────────
function renderRoadmap() {
  if (!roadmapState) return;

  const container = document.getElementById('roadmap-phases-container');
  if (!container) return;

  container.innerHTML = '';

  let totalTasks = 0;
  let completedTasks = 0;

  roadmapState.phases.forEach((phase, phaseIdx) => {
    totalTasks += phase.tasks.length;
    completedTasks += phase.tasks.filter(t => t.completed).length;

    const isPhaseComplete = phase.tasks.every(t => t.completed);
    const phaseCard = document.createElement('div');
    phaseCard.className = `p-4 sm:p-5 rounded-2xl border transition shadow-md ${
      phase.status === 'IN_PROGRESS' 
        ? 'bg-gray-900/90 border-purple-500/50' 
        : (isPhaseComplete ? 'bg-gray-900/60 border-emerald-500/40' : 'bg-gray-950/60 border-gray-800 opacity-80')
    }`;

    phaseCard.innerHTML = `
      <div class="flex items-center justify-between mb-3 border-b border-gray-800 pb-2.5">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black px-2 py-0.5 rounded-full ${
            isPhaseComplete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-purple-500/20 text-purple-300'
          }">
            PHASE ${phase.id}
          </span>
          <h4 class="text-xs sm:text-sm font-bold text-white">${phase.name}</h4>
        </div>
        <span class="text-xs font-bold text-purple-400 font-mono">+${phase.xpReward} XP</span>
      </div>

      <div class="space-y-2">
        ${phase.tasks.map((task) => `
          <label class="flex items-start gap-2.5 p-2 rounded-xl bg-black/30 border border-white/5 hover:border-purple-500/30 transition cursor-pointer">
            <input 
              type="checkbox" 
              ${task.completed ? 'checked' : ''} 
              onchange="toggleTask('${task.id}', ${phaseIdx})"
              class="mt-0.5 rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-0 focus:outline-none"
            >
            <div class="flex-1 text-xs">
              <span class="${task.completed ? 'line-through text-gray-500' : 'text-gray-200'} font-medium block">
                ${task.title}
              </span>
            </div>
            <span class="text-[10px] font-mono text-purple-300 shrink-0 font-bold">+${task.xp} XP</span>
          </label>
        `).join('')}
      </div>
    `;

    container.appendChild(phaseCard);
  });

  // Update progress bar
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const bar = document.getElementById('roadmap-overall-bar');
  const text = document.getElementById('roadmap-overall-percent');
  if (bar) bar.style.width = `${percent}%`;
  if (text) text.innerText = `${percent}% Complete`;
}

function toggleTask(taskId, phaseIdx) {
  const phase = roadmapState.phases[phaseIdx];
  const task = phase.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    if (task.completed) {
      currentXp += task.xp;
    } else {
      currentXp = Math.max(0, currentXp - task.xp);
    }
    updateHeaderMetrics();
    renderRoadmap();
  }
}

function handleCheckIn() {
  currentStreak += 1;
  currentXp += 50;
  updateHeaderMetrics();

  const checkinBtn = document.getElementById('streak-checkin-btn');
  if (checkinBtn) {
    checkinBtn.innerText = '✓ Checked In Today! (+50 XP)';
    checkinBtn.disabled = true;
    checkinBtn.className = 'w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold text-xs cursor-default';
  }

  const alertBox = document.getElementById('streak-freeze-status');
  if (alertBox) {
    alertBox.innerText = 'Active: Point Decay Protected for next 72 Hours.';
    alertBox.className = 'text-xs text-emerald-400 font-medium';
  }
}

// ─────────────────────────────────────────────────────────────
// PEER BENCHMARKING (Idea #2) & SKILL DECAY ALERT (Idea #1)
// ─────────────────────────────────────────────────────────────
function renderPeerBenchmarking() {
  const benchData = JoblexAPI.peerBenchmarking;
  if (!benchData) return;

  const scoreDiffEl = document.getElementById('peer-score-diff');
  const peerMissingBox = document.getElementById('peer-missing-skills-list');

  if (scoreDiffEl) {
    scoreDiffEl.innerText = `You: ${benchData.userPercentile}% vs Placed Peers: ${benchData.placedPeerAverageScore}%`;
  }

  if (peerMissingBox && benchData.topMissingPeerSkills) {
    peerMissingBox.innerHTML = benchData.topMissingPeerSkills.map(s => `
      <div class="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-purple-500/20 text-xs">
        <span class="font-medium text-purple-200">• ${s.name}</span>
        <span class="text-[10px] text-gray-400 font-mono">${s.prevalence}</span>
      </div>
    `).join('');
  }
}

function syncPeerSkillsToRoadmap() {
  if (roadmapState && roadmapState.phases && roadmapState.phases[0]) {
    roadmapState.phases[0].tasks.push({
      id: `peer-gap-${Date.now()}`,
      title: 'HPTLC Fingerprinting (Peer Benchmarking Insight)',
      xp: 75,
      completed: false
    });
    renderRoadmap();
    showToast('Peer competency gaps synced directly into your Career Roadmap Phase 1!', 'Roadmap Synced', 'success');
  }
}

function dismissDecayAlert() {
  const alertEl = document.getElementById('skill-decay-alert-banner');
  if (alertEl) alertEl.classList.add('hidden');
}

function triggerQuickRefreshQuiz() {
  switchModule('Quiz');
  startQuiz();
}

// ─────────────────────────────────────────────────────────────
// AI RESUME ANALYZER LOGIC
// ─────────────────────────────────────────────────────────────
async function runResumeAnalysis() {
  const textarea = document.getElementById('resume-textarea');
  const roleSelect = document.getElementById('resume-role-select');
  const btn = document.getElementById('resume-analyze-btn');
  const resultsContainer = document.getElementById('resume-results-container');

  if (!textarea || !roleSelect || !btn) return;

  btn.disabled = true;
  btn.innerText = 'Analyzing with Google AI & Ayush Benchmarks...';

  const res = await JoblexAPI.analyzeResume(textarea.value, roleSelect.value);

  btn.disabled = false;
  btn.innerText = 'Run AI Gap Analysis';

  if (res && resultsContainer) {
    resultsContainer.classList.remove('hidden');

    document.getElementById('analysis-match-score').innerText = `${res.matchPercentage}%`;
    document.getElementById('analysis-benchmark-score').innerText = `Industry Benchmark: ${res.benchmark}%`;
    document.getElementById('analysis-verified-count').innerText = res.extractedSkills ? res.extractedSkills.length : 0;
    document.getElementById('analysis-missing-count').innerText = res.missingSkills ? res.missingSkills.length : 0;

    // Strengths
    const strengthsBox = document.getElementById('analysis-strengths-box');
    if (strengthsBox && res.extractedSkills) {
      strengthsBox.innerHTML = res.extractedSkills.map(s => `
        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">✓ ${s}</span>
      `).join('');
    }

    // Missing Gaps
    const gapsBox = document.getElementById('analysis-gaps-box');
    if (gapsBox && res.missingSkills) {
      gapsBox.innerHTML = res.missingSkills.map(g => `
        <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs font-semibold">+ ${g}</span>
      `).join('');
    }

    // Recommendations
    const recsList = document.getElementById('analysis-recs-list');
    if (recsList && res.recommendations) {
      recsList.innerHTML = res.recommendations.map((r, i) => `
        <li class="flex items-start gap-2.5 bg-black/40 p-3 rounded-xl border border-white/5 text-xs text-gray-200 leading-relaxed">
          <span class="text-purple-400 font-bold">${i + 1}.</span>
          <span>${r}</span>
        </li>
      `).join('');
    }

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

function syncGapsWithRoadmap() {
  const syncBtn = document.getElementById('sync-roadmap-btn');
  if (syncBtn) {
    syncBtn.innerText = '✓ Synced with Roadmap!';
    syncBtn.className = 'w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs transition cursor-default';
  }
  // Add new tasks to Phase 1
  if (roadmapState && roadmapState.phases && roadmapState.phases[0]) {
    roadmapState.phases[0].tasks.push({
      id: `synced-${Date.now()}`,
      title: 'HPTLC / HPLC Fingerprinting Certification (Synced from AI Analyzer)',
      xp: 75,
      completed: false
    });
    renderRoadmap();
  }
}

// ─────────────────────────────────────────────────────────────
// QUIZ ARENA LOGIC
// ─────────────────────────────────────────────────────────────
function startQuiz() {
  quizState = {
    started: true,
    currentIndex: 0,
    selectedAnswer: null,
    score: 0,
    finished: false
  };
  renderQuiz();
}

function renderQuiz() {
  const intro = document.getElementById('quiz-intro-card');
  const active = document.getElementById('quiz-active-card');
  const result = document.getElementById('quiz-result-card');

  if (!quizState.started) {
    intro.classList.remove('hidden');
    active.classList.add('hidden');
    result.classList.add('hidden');
    return;
  }

  if (quizState.finished) {
    intro.classList.add('hidden');
    active.classList.add('hidden');
    result.classList.remove('hidden');

    document.getElementById('quiz-final-score').innerText = `${quizState.score}/${QUIZ_DATA.length}`;
    document.getElementById('quiz-earned-xp').innerText = `Earned ${quizState.score * 50} XP`;

    currentXp += (quizState.score * 50);
    updateHeaderMetrics();
    return;
  }

  intro.classList.add('hidden');
  active.classList.remove('hidden');
  result.classList.add('hidden');

  const q = QUIZ_DATA[quizState.currentIndex];
  document.getElementById('quiz-question-counter').innerText = `QUESTION ${quizState.currentIndex + 1}/${QUIZ_DATA.length}`;
  document.getElementById('quiz-score-counter').innerText = `Score: ${quizState.score}`;
  document.getElementById('quiz-question-text').innerText = q.question;

  const optsContainer = document.getElementById('quiz-options-container');
  optsContainer.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = quizState.selectedAnswer === idx;
    btn.className = `p-3.5 rounded-xl text-left transition-all border text-xs sm:text-sm font-medium ${
      isSelected 
        ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white' 
        : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 text-gray-300'
    }`;
    btn.innerHTML = `<span class="inline-block w-6 font-mono text-purple-400 opacity-70">${['A','B','C','D'][idx]}.</span> ${opt}`;
    btn.onclick = () => {
      quizState.selectedAnswer = idx;
      renderQuiz();
    };
    optsContainer.appendChild(btn);
  });

  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.disabled = quizState.selectedAnswer === null;
  nextBtn.innerText = quizState.currentIndex === QUIZ_DATA.length - 1 ? 'Submit' : 'Next Question ➔';
}

function handleQuizNext() {
  if (quizState.selectedAnswer === null) return;

  if (quizState.selectedAnswer === QUIZ_DATA[quizState.currentIndex].correct) {
    quizState.score += 1;
  }

  if (quizState.currentIndex < QUIZ_DATA.length - 1) {
    quizState.currentIndex += 1;
    quizState.selectedAnswer = null;
    renderQuiz();
  } else {
    quizState.finished = true;
    renderQuiz();
  }
}

// ─────────────────────────────────────────────────────────────
// OPPORTUNITIES & MICRO-GIGS (Idea #4)
// ─────────────────────────────────────────────────────────────
function renderOpportunities(filter) {
  const container = document.getElementById('opps-cards-grid');
  if (!container) return;

  document.querySelectorAll('.opp-filter-pill').forEach(btn => {
    if (btn.getAttribute('data-filter') === filter) {
      btn.className = 'opp-filter-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-700 text-white shadow-sm transition';
    } else {
      btn.className = 'opp-filter-pill px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition';
    }
  });

  container.innerHTML = `<div class="text-center py-12 text-xs text-slate-400">No opportunities are available from the database.</div>`;
  return;

  /* Legacy renderer retained only for compatibility with old markup. */
  const filtered = [];
  container.innerHTML = filtered.map(opp => {
    let badgeClass = 'bg-gray-800 text-gray-300 border-gray-600';
    if (opp.type === 'Internship') badgeClass = 'bg-green-900/50 text-green-400 border-green-500/50';
    if (opp.type === 'Job') badgeClass = 'bg-blue-900/50 text-blue-400 border-blue-500/50';
    if (opp.type === 'Hackathon') badgeClass = 'bg-purple-900/50 text-purple-400 border-purple-500/50';
    if (opp.type === 'Micro-Gig') badgeClass = 'bg-amber-900/50 text-amber-300 border-amber-500/50';

    return `
      <div class="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between backdrop-blur-sm group hover:-translate-y-0.5 shadow-md">
        <div>
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">${opp.title}</h3>
              <p class="text-xs text-gray-400 font-medium mt-0.5">${opp.company}</p>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}">
              ${opp.type}
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5 mb-4">
            ${opp.skills.map(s => `
              <span class="px-2 py-0.5 bg-gray-800 rounded-md border border-gray-700 text-[11px] text-gray-300">${s}</span>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4 pt-3 border-t border-gray-800">
            <div><span class="material-symbols-outlined text-xs mr-1 opacity-60 align-middle">location_on</span> ${opp.location}</div>
            <div><span class="material-symbols-outlined text-xs mr-1 opacity-60 align-middle">payments</span> ${opp.stipend}</div>
            <div class="col-span-2"><span class="mr-1 opacity-60">⏳</span> Deadline: ${opp.deadline}</div>
          </div>
          <button 
            onclick="showToast('Application submitted for ${opp.title}! Profile verified via institutional credentials.', 'Application Transmitted', 'success')" 
            class="w-full py-2 bg-gray-800 hover:bg-cyan-900/40 border border-gray-700 hover:border-cyan-500 text-white rounded-xl transition text-xs font-semibold"
          >
            Apply Now
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// ZULU CHAT LOGIC
// ─────────────────────────────────────────────────────────────
async function handleZuluSend(e) {
  e.preventDefault();
  const input = document.getElementById('zulu-input');
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  const messagesBox = document.getElementById('zulu-messages-box');

  const userDiv = document.createElement('div');
  userDiv.className = 'flex justify-end';
  userDiv.innerHTML = `
    <div class="max-w-[85%] p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none text-xs sm:text-sm leading-relaxed shadow-md">
      ${text}
    </div>
  `;
  messagesBox.appendChild(userDiv);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  const typingDiv = document.createElement('div');
  typingDiv.id = 'zulu-typing-indicator';
  typingDiv.className = 'flex justify-start';
  typingDiv.innerHTML = `
    <div class="bg-gray-900/90 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5">
      <span class="text-xs text-purple-300 mr-1.5">Zulu is synthesizing...</span>
      <div class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
      <div class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
      <div class="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
    </div>
  `;
  messagesBox.appendChild(typingDiv);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  const res = await JoblexAPI.askZulu(text);

  const ind = document.getElementById('zulu-typing-indicator');
  if (ind) ind.remove();

  const zuluDiv = document.createElement('div');
  zuluDiv.className = 'flex justify-start';
  zuluDiv.innerHTML = `
    <div class="max-w-[85%] p-3.5 rounded-2xl bg-gray-900/90 border border-purple-500/30 text-gray-100 rounded-bl-none text-xs sm:text-sm leading-relaxed shadow-sm">
      ${res.reply}
    </div>
  `;
  messagesBox.appendChild(zuluDiv);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('zulu-input');
  if (input) {
    input.value = promptText;
    document.getElementById('zulu-chat-form').dispatchEvent(new Event('submit'));
  }
}

// ─────────────────────────────────────────────────────────────
// 2D SKILL CONSTELLATION MAP
// ─────────────────────────────────────────────────────────────
function initSkillTree() {
  window.addEventListener('resize', drawSkillTree);
}

function drawSkillTree() {
  const canvas = document.getElementById('skill-tree-canvas');
  if (!canvas) return;

  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight || 450;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const skills = [
    { name: 'Core Foundations', x: 0.5, y: 0.85, level: 5 },
    { name: 'Python', x: 0.3, y: 0.65, level: 4 },
    { name: 'Ayurvedic Pharmacognosy', x: 0.7, y: 0.65, level: 4 },
    { name: 'Data Analysis', x: 0.2, y: 0.45, level: 3 },
    { name: 'Machine Learning', x: 0.4, y: 0.45, level: 2 },
    { name: 'Herbal Formulation', x: 0.6, y: 0.45, level: 3 },
    { name: 'Clinical Research', x: 0.8, y: 0.45, level: 2 },
    { name: 'NLP in Ayurveda', x: 0.35, y: 0.25, level: 1 },
    { name: 'HPTLC Standardization', x: 0.65, y: 0.25, level: 2 }
  ];

  const connections = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 7], [5, 8]
  ];

  connections.forEach(([fromIdx, toIdx]) => {
    const from = skills[fromIdx];
    const to = skills[toIdx];

    ctx.beginPath();
    ctx.moveTo(from.x * w, from.y * h);
    ctx.lineTo(to.x * w, to.y * h);

    const grad = ctx.createLinearGradient(from.x * w, from.y * h, to.x * w, to.y * h);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.4)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  skills.forEach(skill => {
    const px = skill.x * w;
    const py = skill.y * h;

    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = skill.level >= 3 ? '#a855f7' : '#38bdf8';
    ctx.fill();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.fillText(skill.name, px, py - 16);
  });
}
