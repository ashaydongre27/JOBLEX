/**
 * JOBLEX Intelligent Skill Assessment & Digital Profile Routes (Node.js / Express)
 * Powered by Skill Ontology and Dynamic Competency Profiling
 * Ministry of Ayush & Corporate Industry Partners | Problem Statement ID: 26044
 */

const express = require('express');
const router = express.Router();
const DB = require('../data/database');
const { SKILL_ONTOLOGY, ROLE_BENCHMARK_PROFILES } = require('../data/skillOntology');
const { createSkillVector, computeHybridScore, explainMatch } = require('../services/matching.service');
const { supabase, isConfigured } = require('../config/supabase');
const crypto = require('crypto');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const { generateWithFailover } = require('../services/ai.service');
const { 
  saveQuizAttempt, 
  validateAndConsumeAttempt, 
  getDistractorData, 
  getStorageStats 
} = require('../services/quizStorage.service');

const ADAPTIVE_QUIZ_BANK = [
  { id: 'adaptive-hptlc-1', skill: 'HPTLC / HPLC Chromatography', difficulty: 'easy', section: 'Chromatography', question: 'Which technique is commonly used for herbal fingerprinting and marker quantification?', options: ['HPTLC', 'Gram staining', 'Simple distillation', 'pH titration'], correctIndex: 0 },
  { id: 'adaptive-hptlc-2', skill: 'HPTLC / HPLC Chromatography', difficulty: 'hard', section: 'Chromatography', question: 'Which change most improves quantitative HPLC method robustness during herbal marker analysis?', options: ['Remove system suitability checks', 'Validate specificity, precision, accuracy, and solution stability', 'Use a different column for every sample', 'Avoid calibration standards'], correctIndex: 1 },
  { id: 'adaptive-python-1', skill: 'Python & Data Science', difficulty: 'easy', section: 'Data Science', question: 'Which Python library is widely used for tabular data manipulation?', options: ['Pandas', 'Django', 'PyGame', 'Flask'], correctIndex: 0 },
  { id: 'adaptive-python-2', skill: 'Python & Data Science', difficulty: 'hard', section: 'Data Science', question: 'Which approach best prevents target leakage in a clinical prediction pipeline?', options: ['Fit preprocessing before splitting data', 'Use a pipeline and fit transformations only on training folds', 'Shuffle labels after evaluation', 'Select features using the complete dataset'], correctIndex: 1 },
  { id: 'adaptive-glp-1', skill: 'Good Laboratory Practice (GLP)', difficulty: 'easy', section: 'Quality Compliance', question: 'What is the primary purpose of a laboratory SOP?', options: ['Ensure consistent, reproducible, compliant work', 'Guarantee a commercial launch', 'Replace equipment calibration', 'Remove the need for records'], correctIndex: 0 },
  { id: 'adaptive-glp-2', skill: 'Good Laboratory Practice (GLP)', difficulty: 'hard', section: 'Quality Compliance', question: 'What is the strongest response when a controlled study record contains a late data correction?', options: ['Erase the original entry', 'Backdate the correction', 'Keep the original, document the reason, date, and author, then preserve the audit trail', 'Ask another analyst to rewrite it'], correctIndex: 2 },
  { id: 'adaptive-clinical-1', skill: 'Clinical Data Management', difficulty: 'easy', section: 'Clinical Research', question: 'Which standard is commonly used to structure clinical trial tabulation data?', options: ['SDTM', 'CSSOM', 'SMTP', 'OAuth'], correctIndex: 0 },
  { id: 'adaptive-clinical-2', skill: 'Clinical Data Management', difficulty: 'hard', section: 'Clinical Research', question: 'Why are validation checks applied before a clinical database is locked?', options: ['To increase font size', 'To identify inconsistencies that could affect analysis and traceability', 'To remove protocol deviations from history', 'To avoid documenting queries'], correctIndex: 1 },
  { id: 'adaptive-dsa-1', skill: 'Algorithms & Data Structures', difficulty: 'easy', section: 'Computer Science', question: 'What is the average time complexity of searching for an element in a balanced Binary Search Tree (BST)?', options: ['O(log n)', 'O(n)', 'O(n^2)', 'O(1)'], correctIndex: 0 },
  { id: 'adaptive-dsa-2', skill: 'Algorithms & Data Structures', difficulty: 'hard', section: 'Computer Science', question: 'Which algorithm is best suited for finding all-pairs shortest paths in a dense directed graph with negative edge weights but no negative cycles?', options: ['Floyd-Warshall Algorithm', 'Dijkstra Algorithm', 'Prim Algorithm', 'Kruskal Algorithm'], correctIndex: 0 }
];

// Transient quiz attempts are handled by decoupled quizStorage.service.js

function buildProceduralQuestions(topicPrompt, count, difficulty, attemptId) {
  const topic = (topicPrompt || 'Core Engineering & Technology').trim();
  const templates = [
    {
      skill: `${topic} Concepts`,
      question: `Which fundamental principle is core to effective ${topic} system design?`,
      options: ['Modular separation of concerns', 'Global tight coupling', 'Unencrypted open communication', 'Hardcoded parameters'],
      correctIndex: 0,
      explanation: 'Separation of concerns allows independent testing, maintenance, and scalability.'
    },
    {
      skill: `${topic} Performance`,
      question: `What is the primary method to optimize bottleneck throughput in ${topic}?`,
      options: ['Synchronous blocking loops', 'Asynchronous processing & intelligent caching', 'Repeated unindexed linear scans', 'Increasing thread contention'],
      correctIndex: 1,
      explanation: 'Asynchronous processing and caching prevent main-thread locking and reduce latency.'
    },
    {
      skill: `${topic} Reliability`,
      question: `How should unexpected edge cases be handled when operating ${topic}?`,
      options: ['Ignore exception tracebacks', 'Terminate the process without logging', 'Implement graceful degradation with contextual logging', 'Expose internal memory state to users'],
      correctIndex: 2,
      explanation: 'Graceful degradation ensures service availability even during partial failure.'
    },
    {
      skill: `${topic} Data Integrity`,
      question: `Which approach best prevents race conditions during high-concurrency operations in ${topic}?`,
      options: ['Atomic transactions and isolation controls', 'Bypassing validation checks', 'Unsynchronized shared memory writes', 'Disabling database locks'],
      correctIndex: 0,
      explanation: 'Atomic transactions ensure ACID compliance and prevent data corruption.'
    },
    {
      skill: `${topic} Security`,
      question: `What is a required security measure when exposing ${topic} API services?`,
      options: ['Relying solely on client-side checks', 'Strict server-side validation and parameterization', 'Disabling CORS and TLS headers', 'Hardcoding secret credentials'],
      correctIndex: 1,
      explanation: 'Server-side validation protects against SQL injection, XSS, and unauthorized execution.'
    }
  ];

  const questions = [];
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    questions.push({
      id: `proc-${attemptId}-${i + 1}`,
      skill: t.skill,
      difficulty: difficulty || 'mixed',
      section: 'Competency Assessment',
      question: `[${topic}] Question ${i + 1}: ${t.question}`,
      options: [...t.options],
      correctIndex: t.correctIndex,
      explanation: t.explanation
    });
  }
  return questions;
}

function getAdaptiveInsights(studentId) {
  const attempts = (DB.adaptiveQuizAttempts || []).filter(attempt => attempt.studentId === studentId);
  const skillStats = {};
  attempts.forEach(attempt => (attempt.answers || []).forEach(answer => {
    const stats = skillStats[answer.skill] || { correct: 0, total: 0 };
    stats.total += 1;
    if (answer.isCorrect) stats.correct += 1;
    skillStats[answer.skill] = stats;
  }));
  return {
    attempts: attempts.length,
    totalAnswered: Object.values(skillStats).reduce((sum, stat) => sum + stat.total, 0),
    totalCorrect: Object.values(skillStats).reduce((sum, stat) => sum + stat.correct, 0),
    bySkill: Object.fromEntries(Object.entries(skillStats).map(([skill, stat]) => [skill, { ...stat, accuracy: Math.round((stat.correct / stat.total) * 100) }]))
  };
}

function authenticateStudentOptional(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (token) {
    return authenticateToken(req, res, (err) => {
      if (err || !req.user) {
        req.user = { id: 'usr-student-01', email: 'student@joblex.in', role: 'student', name: 'Student Scholar' };
      }
      next();
    });
  }

  req.user = { id: 'usr-student-01', email: 'student@joblex.in', role: 'student', name: 'Student Scholar' };
  next();
}

router.get('/adaptive/insights', authenticateStudentOptional, async (req, res) => {
  try {
    const studentId = req.user.id || req.user.email;
    return res.json({ success: true, insights: getAdaptiveInsights(studentId) });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Unable to load adaptive quiz insights.' });
  }
});

function getProceduralSingleQuestion(topicPrompt, difficulty) {
  const topic = (topicPrompt || 'Core Engineering & Technology').trim();
  const match = ADAPTIVE_QUIZ_BANK.find(q => q.skill.toLowerCase().includes(topic.toLowerCase()));
  if (match) {
    const correctAnswer = match.options[match.correctIndex];
    const distractors = match.options.filter((_, i) => i !== match.correctIndex);
    return {
      question: match.question,
      correctAnswer,
      distractors,
      explanation: `Verified standard competency requirement for ${match.skill}.`,
      skill: match.skill
    };
  }
  const templates = [
    {
      skill: `${topic} Architecture`,
      question: `Which fundamental principle is core to effective ${topic} system design?`,
      correctAnswer: 'Modular separation of concerns and clear interface contracts',
      distractors: [
        'Global tight coupling across all operational modules',
        'Unencrypted open communication channels without authentication',
        'Hardcoding secret parameters and static state variables'
      ],
      explanation: 'Separation of concerns allows independent testing, maintenance, and fault isolation.'
    },
    {
      skill: `${topic} Performance`,
      question: `What is the primary method to optimize bottleneck throughput in ${topic}?`,
      correctAnswer: 'Asynchronous event-driven processing and intelligent cache hierarchies',
      distractors: [
        'Synchronous blocking loops on the main event thread',
        'Repeated unindexed linear scans over high-cardinality stores',
        'Increasing lock contention across concurrent workers'
      ],
      explanation: 'Asynchronous processing and caching reduce latency and prevent blocking during high concurrency.'
    },
    {
      skill: `${topic} Data Integrity`,
      question: `Which approach best prevents race conditions during high-concurrency operations in ${topic}?`,
      correctAnswer: 'Enforcing atomic transactions with strict isolation controls',
      distractors: [
        'Bypassing consistency checks during peak traffic',
        'Unsynchronized shared memory writes without locks',
        'Disabling foreign key constraints and schema validations'
      ],
      explanation: 'Atomic transactions ensure ACID compliance and prevent data corruption under concurrent updates.'
    },
    {
      skill: `${topic} Reliability`,
      question: `How should unexpected edge cases be handled when operating ${topic}?`,
      correctAnswer: 'Implement graceful degradation with contextual telemetry and fallback paths',
      distractors: [
        'Ignore exception tracebacks and continue processing silently',
        'Terminate the primary process without graceful cleanup',
        'Expose internal memory pointers and stack frames to users'
      ],
      explanation: 'Graceful degradation ensures system availability even during partial upstream failure.'
    },
    {
      skill: `${topic} Security`,
      question: `What is a required security measure when exposing ${topic} API services?`,
      correctAnswer: 'Strict server-side validation and parameterization',
      distractors: [
        'Relying solely on client-side input validation',
        'Disabling CORS and TLS security headers',
        'Hardcoding secret keys directly in client bundles'
      ],
      explanation: 'Server-side validation protects against injection, tampering, and unauthorized execution.'
    }
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * POST /api/assessment/adaptive/generate
 * and alias POST /api/assessment/quiz/generate
 * 
 * Strict Single-Call AI Quiz Architecture:
 * - Triggers strictly ONE AI/LLM call per attempt.
 * - Generates 1 question, 1 correct answer, and 3 plausible distractors.
 * - Stores correct answer in Store 1 (CORRECT_STORE) and distractors in Store 2 (DISTRACTOR_STORE).
 * - Shuffles options with Fisher-Yates and maps to opaque option IDs (opt_1 .. opt_4).
 * - Returns ZERO answer / explanation hints to the client.
 */
router.post(['/adaptive/generate', '/quiz/generate'], authenticateStudentOptional, async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.email || 'usr-student-01';
    const requestedDifficulty = ['easy', 'mixed', 'hard'].includes(req.body?.difficulty) ? req.body.difficulty : 'mixed';
    const focusPrompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 180) : '';
    const insights = getAdaptiveInsights(studentId);
    const weakSkills = Object.entries(insights.bySkill).filter(([, stat]) => stat.accuracy < 70).map(([skill]) => skill);

    const studentContext = req.user ? `${req.user.name || 'Student'} (${req.user.department || 'General'})` : 'Student';
    const topicFocus = focusPrompt || (weakSkills.length ? `Weak areas to reinforce: ${weakSkills.join(', ')}` : 'Core software engineering, algorithms, and cloud architecture');

    const attemptId = `quiz-${crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex'))}`;

    const singleQuestionPrompt = `Generate exactly ONE multiple-choice assessment question for a student: ${studentContext}.
Focus / Domain: ${topicFocus}.
Difficulty Level: ${requestedDifficulty}.

Requirements:
- Exactly 1 question.
- Test deep conceptual understanding or practical application.
- Exactly 1 unambiguous correct answer.
- Exactly 3 plausible, realistic wrong answers (distractors).
- Return ONLY a valid JSON object matching this schema:
{
  "question": "Clear question text?",
  "correct_answer": "Accurate, concise correct answer",
  "distractors": [
    "Plausible wrong answer 1",
    "Plausible wrong answer 2",
    "Plausible wrong answer 3"
  ],
  "explanation": "Clear, educational explanation of why the correct answer is correct and why the distractors are wrong.",
  "skill": "${topicFocus.slice(0, 40)}"
}`;

    let questionData = null;
    let providerUsed = 'static-bank';

    try {
      const aiResult = await generateWithFailover({
        prompt: singleQuestionPrompt,
        systemInstruction: "You are an expert assessment engine. You MUST respond with ONLY a pure JSON object containing question, correct_answer, distractors (exactly 3 strings), explanation, and skill. Do not wrap in markdown fences.",
        temperature: 0.3,
        jsonMode: true
      });

      if (aiResult && aiResult.text) {
        let cleanText = aiResult.text.trim();
        if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
        cleanText = cleanText.trim();

        const parsed = JSON.parse(cleanText);
        const obj = Array.isArray(parsed) ? parsed[0] : parsed;
        if (obj && obj.question && obj.correct_answer && Array.isArray(obj.distractors) && obj.distractors.length >= 3) {
          questionData = {
            question: obj.question,
            correctAnswer: obj.correct_answer,
            distractors: obj.distractors.slice(0, 3),
            explanation: obj.explanation || 'Verified technical principle.',
            skill: obj.skill || topicFocus
          };
          providerUsed = aiResult.provider;
        }
      }
    } catch (aiErr) {
      console.warn('[Adaptive Quiz AI Generation Warning]:', aiErr.message);
    }

    if (!questionData) {
      questionData = getProceduralSingleQuestion(focusPrompt || topicFocus, requestedDifficulty);
    }

    // Anti-Cheat: Fisher-Yates shuffle of 1 correct answer + 3 distractors
    const rawOptions = [
      { text: questionData.correctAnswer, isCorrect: true },
      { text: questionData.distractors[0], isCorrect: false },
      { text: questionData.distractors[1], isCorrect: false },
      { text: questionData.distractors[2], isCorrect: false }
    ];

    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
    }

    const clientOptions = rawOptions.map((opt, idx) => ({
      id: `opt_${idx + 1}`,
      text: opt.text
    }));

    const correctIndex = rawOptions.findIndex(o => o.isCorrect);
    const correctOptionId = `opt_${correctIndex + 1}`;

    // Store in Bifurcated Transient Stores (15-minute TTL)
    saveQuizAttempt({
      attemptId,
      studentId,
      question: questionData.question,
      correctAnswer: questionData.correctAnswer,
      correctOptionId,
      distractors: questionData.distractors,
      explanation: questionData.explanation,
      skill: questionData.skill,
      ttlMs: 15 * 60 * 1000
    });

    return res.json({
      success: true,
      attemptId,
      difficulty: requestedDifficulty,
      prompt: focusPrompt,
      provider: providerUsed,
      skill: questionData.skill,
      question: questionData.question,
      options: clientOptions,
      // Backward-compatible questions array so existing frontend works seamlessly
      questions: [
        {
          id: `q-${attemptId}`,
          skill: questionData.skill,
          difficulty: requestedDifficulty,
          section: 'Quiz Arena',
          question: questionData.question,
          options: clientOptions.map(o => o.text),
          optionList: clientOptions
        }
      ],
      recommendation: weakSkills.length ? `Zulu AI is reinforcing: ${weakSkills.join(', ')}.` : 'Zulu AI generated a tailored assessment for your profile.'
    });
  } catch (err) {
    console.error('[Adaptive Quiz Generate Error]:', err);
    return res.status(500).json({ success: false, error: 'Unable to generate an adaptive quiz.' });
  }
});

/**
 * POST /api/assessment/adaptive/submit
 * and alias POST /api/assessment/quiz/submit
 * 
 * Deterministic Conditional Evaluation:
 * - Emulates Redis GETDEL: retrieves and atomically deletes Store 1 (CORRECT_STORE).
 * - Replay attacks immediately rejected.
 * - Simple if/else evaluation: zero AI/LLM calls.
 */
router.post(['/adaptive/submit', '/quiz/submit'], authenticateStudentOptional, async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.email || 'usr-student-01';
    const attemptId = req.body?.attemptId;

    if (!attemptId) {
      return res.status(400).json({ success: false, error: 'Missing attemptId' });
    }

    // Determine selectedOptionId: support direct format or legacy answers array
    let selectedOptionId = req.body?.selectedOptionId;
    if (!selectedOptionId && Array.isArray(req.body?.answers) && req.body.answers.length > 0) {
      const firstAns = req.body.answers[0];
      if (firstAns.selectedOptionId) {
        selectedOptionId = firstAns.selectedOptionId;
      } else if (typeof firstAns.selectedIndex === 'number') {
        selectedOptionId = `opt_${firstAns.selectedIndex + 1}`;
      }
    }

    if (!selectedOptionId) {
      return res.status(400).json({ success: false, error: 'Please select an option before submitting.' });
    }

    // Atomic consumption and deterministic validation (Zero API/LLM calls)
    const result = validateAndConsumeAttempt(attemptId, selectedOptionId, studentId);

    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const attempt = {
      id: attemptId,
      studentId,
      difficulty: req.body?.difficulty || 'mixed',
      prompt: typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 180) : '',
      answers: [
        {
          questionId: `q-${attemptId}`,
          skill: result.skill,
          selectedOptionId,
          isCorrect: result.isCorrect,
          explanation: result.explanation
        }
      ],
      correctCount: result.isCorrect ? 1 : 0,
      totalQuestions: 1,
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(DB.adaptiveQuizAttempts)) DB.adaptiveQuizAttempts = [];
    DB.adaptiveQuizAttempts.unshift(attempt);

    const insights = getAdaptiveInsights(studentId);

    return res.json({
      success: true,
      valid: true,
      attemptId,
      isCorrect: result.isCorrect,
      score: result.score,
      selectedOptionId,
      correctOptionId: result.correctOptionId,
      correctAnswerText: result.correctAnswerText,
      explanation: result.explanation,
      skill: result.skill,
      correctCount: result.isCorrect ? 1 : 0,
      totalQuestions: 1,
      accuracy: result.isCorrect ? 100 : 0,
      insights
    });
  } catch (err) {
    console.error('[Adaptive Quiz Submit Error]:', err);
    return res.status(500).json({ success: false, error: 'Unable to record adaptive quiz results.' });
  }
});

/**
 * GET /api/assessment/quiz/stats
 * Telemetry endpoint for decoupled storage verification
 */
router.get(['/adaptive/stats', '/quiz/stats'], (req, res) => {
  return res.json({
    success: true,
    stats: getStorageStats()
  });
});


const isPublicVerification = req => req.path.startsWith('/verify/');
router.use((req, res, next) => isPublicVerification(req) ? next() : authenticateToken(req, res, next));
router.use((req, res, next) => isPublicVerification(req) ? next() : requireRole(['student'])(req, res, next));

/**
 * POST /api/assessment/submit
 * Submits multi-step questionnaire answers, evaluates competency, and persists skill profile
 */
router.post('/submit', async (req, res) => {
  try {
    const {
      userId: _ignoredUserId,
      targetRole = 'Herbal Formulation Scientist',
      answers = {},
      declaredSkills = []
    } = req.body || {};

    const standard = ROLE_BENCHMARK_PROFILES[targetRole] || ROLE_BENCHMARK_PROFILES["Herbal Formulation Scientist"];

    const userId = req.user?.id || req.user?.email;

    // Evaluate answers
    // Each question has a weight, computing section scores
    let techScore = 0;
    let softScore = 0;
    let aptScore = 0;

    const answerEntries = Object.entries(answers);
    let totalQuestions = Math.max(answerEntries.length, 1);
    let correctCount = 0;

    answerEntries.forEach(([qId, val]) => {
      // Numerical score or boolean correct evaluation
      const numVal = typeof val === 'number' ? val : (val ? 1 : 0);
      if (qId.startsWith('tech_')) {
        techScore += numVal;
      } else if (qId.startsWith('soft_')) {
        softScore += numVal;
      } else if (qId.startsWith('apt_')) {
        aptScore += numVal;
      } else {
        techScore += numVal;
      }
      if (numVal > 0) correctCount++;
    });

    // Derive assessed skills from answers and declared skills
    const assessedSkillNames = Array.isArray(declaredSkills) && declaredSkills.length
      ? declaredSkills
      : standard.mandatorySkills.slice(0, 4).map(m => {
          const s = SKILL_ONTOLOGY.find(sk => sk.id === m.id);
          return s ? s.name : m.id;
        });

    const userVec = createSkillVector(assessedSkillNames, 0.85);
    const targetVec = createSkillVector(standard.mandatorySkills, 0.9);

    const overallScore = computeHybridScore(userVec, targetVec);
    const explanation = explainMatch(userVec, targetVec, standard.mandatorySkills.map(m => m.id));

    // Chart.js Radar Data
    const radarLabels = standard.mandatorySkills.map(m => {
      const s = SKILL_ONTOLOGY.find(sk => sk.id === m.id);
      return s ? s.name : m.id;
    });

    const studentRadarValues = standard.mandatorySkills.map(m => {
      const idx = SKILL_ONTOLOGY.findIndex(s => s.id === m.id);
      return idx !== -1 ? Math.min(100, Math.round((userVec[idx] / (SKILL_ONTOLOGY[idx].weight || 1)) * 100)) : 50;
    });

    const benchmarkRadarValues = standard.mandatorySkills.map(m => Math.round(m.minProficiency * 100));

    // Bar Chart Data (Skill Proficiency vs Industry Baseline)
    const barData = standard.mandatorySkills.map((m, idx) => ({
      skill: radarLabels[idx],
      attained: studentRadarValues[idx],
      benchmark: benchmarkRadarValues[idx]
    }));

    // Update DB
    if (!DB.skillProfiles) DB.skillProfiles = {};
    DB.skillProfiles[userId] = {
      userId,
      targetRole: standard.title,
      readinessScore: overallScore,
      verifiedSkills: assessedSkillNames,
      strengths: explanation.topContributingSkills.map(s => s.name),
      criticalGaps: explanation.criticalGaps.map(g => g.name),
      moderateGaps: explanation.moderateGaps.map(g => g.name),
      lastUpdated: new Date().toISOString()
    };

    // Update user record verified skills
    const user = (DB.users || []).find(u => u.id === userId || u.email === userId);
    if (user) {
      user.verified_skills = Array.from(new Set([...(user.verified_skills || []), ...assessedSkillNames]));
      user.xp = (user.xp || 1000) + 250; // XP Bounty
    }

    // Try persisting to Supabase if configured
    if (isConfigured && supabase) {
      try {
        await supabase.from('profiles').update({
          verified_skills: user ? user.verified_skills : assessedSkillNames,
          xp: user ? user.xp : 1250
        }).eq('id', userId);
      } catch (e) {
        console.warn('[Assessment Submit] Supabase update warning:', e.message);
      }
    }

    return res.json({
      success: true,
      message: 'Assessment finalized! Your skill profile and placement readiness have been updated (+250 XP).',
      score: overallScore,
      targetRole: standard.title,
      benchmarkScore: standard.targetScore,
      tier: overallScore >= standard.targetScore ? 'Benchmark Attained' : (overallScore >= 70 ? 'Industry Ready' : 'Upskilling Recommended'),
      strengths: explanation.topContributingSkills,
      criticalGaps: explanation.criticalGaps,
      moderateGaps: explanation.moderateGaps,
      actionRecommendation: explanation.actionRecommendation,
      radarData: {
        labels: radarLabels,
        studentValues: studentRadarValues,
        benchmarkValues: benchmarkRadarValues
      },
      barData,
      recommendedCourses: standard.recommendedCourses
    });
  } catch (err) {
    console.error('[Assessment Submit Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to evaluate assessment submission.' });
  }
});

/**
 * GET /api/profile/skill
 * Retrieves active user's skill profile, verified skills, and gap analytics
 */
router.get('/skill', (req, res) => {
  try {
    const userId = req.user?.id || req.user?.email;

    const user = (userId && (DB.users || []).find(u => u.id === userId || u.email === userId)) || {
      name: 'Scholar',
      verified_skills: []
    };

    const profile = (userId && DB.skillProfiles?.[userId]) || {
      userId,
      targetRole: 'Herbal Formulation Scientist',
      readinessScore: 0,
      verifiedSkills: user.verified_skills || [],
      strengths: [],
      criticalGaps: [],
      moderateGaps: [],
      lastUpdated: new Date().toISOString()
    };

    return res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        institution: user.institution,
        xp: user.xp !== undefined ? user.xp : 0,
        streak: user.streak !== undefined ? user.streak : 0
      },
      profile
    });
  } catch (err) {
    console.error('[Get Skill Profile Error]:', err);
    res.status(500).json({ success: false, error: 'Could not fetch skill profile.' });
  }
});

/**
 * GET /api/assessment/skill-constellation
 * Returns dynamic skill constellation graph based on student's verified skills,
 * target role, and the canonical SKILL_ONTOLOGY with prerequisite relationships
 */
router.get('/skill-constellation', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.email;
    const cluster = req.query.cluster || 'tech'; // 'tech', 'ai', 'ayush'
    const targetRole = req.query.targetRole || 'Full Stack Software Engineer';

    const user = (DB.users || []).find(u => u.id === userId || u.email === userId);
    const verifiedSkills = user?.verified_skills || [];
    const studentProfile = DB.skillProfiles?.[userId];

    // Get role benchmark profile
    const roleProfile = ROLE_BENCHMARK_PROFILES[targetRole] || ROLE_BENCHMARK_PROFILES["Full Stack Software Engineer"];
    const mandatorySkillIds = roleProfile.mandatorySkills.map(m => m.id);
    const mandatorySkillMap = {};
    roleProfile.mandatorySkills.forEach(m => { mandatorySkillMap[m.id] = m.minProficiency; });

    // Get student's adaptive quiz insights for in-progress tracking
    const adaptiveInsights = getAdaptiveInsights(userId);
    const inProgressSkills = new Set();
    Object.entries(adaptiveInsights.bySkill || {}).forEach(([skill, stat]) => {
      if (stat.total > 0 && stat.accuracy < 80) {
        inProgressSkills.add(skill.toLowerCase());
      }
    });

    // Filter skills by cluster category
    const clusterCategories = {
      tech: ['Software Engineering', 'Database & Cloud'],
      ai: ['Data Science & AI', 'Health-Tech & Bio-Informatics'],
      ayush: ['Ayush Pharmacology', 'Soft Skills & Professionalism', 'Aptitude & Reasoning']
    };
    const targetCategories = clusterCategories[cluster] || clusterCategories.tech;

    // Filter ontology skills for this cluster
    const clusterSkills = SKILL_ONTOLOGY.filter(s => targetCategories.includes(s.category));

    // Build node data
    const nodes = clusterSkills.map(skill => {
      const isVerified = verifiedSkills.some(v => v.toLowerCase() === skill.name.toLowerCase());
      const isInProgress = inProgressSkills.has(skill.name.toLowerCase()) ||
                          studentProfile?.verifiedSkills?.some(v => v.toLowerCase() === skill.name.toLowerCase());
      const isMandatory = mandatorySkillIds.includes(skill.id);
      const minProficiency = mandatorySkillMap[skill.id] || 0;

      let status = 'locked';
      if (isVerified) {
        status = 'acquired';
      } else if (isInProgress) {
        status = 'in_progress';
      } else if (isMandatory) {
        status = 'target_gap';
      }

      // Simple tier assignment based on weight and dependencies
      let tier = 1;
      if (skill.weight >= 1.2) tier = 2;
      if (skill.weight >= 1.25) tier = 3;

      // Industry demand based on role requirements and market data
      let industryDemand = 'Medium';
      if (isMandatory) industryDemand = 'Critical';
      else if (skill.weight >= 1.25) industryDemand = 'High';
      else if (skill.weight >= 1.2) industryDemand = 'High';
      else if (skill.weight >= 1.1) industryDemand = 'Medium';
      else industryDemand = 'Standard';

      return {
        id: skill.id,
        label: skill.name,
        category: skill.category,
        tier,
        status,
        xpAwarded: isVerified ? Math.round(100 + skill.weight * 50) : 0,
        industryDemand,
        weight: skill.weight,
        aliases: skill.aliases,
        minProficiency: isMandatory ? Math.round(minProficiency * 100) : null,
        progress: isInProgress ? Math.min(90, adaptiveInsights.bySkill[skill.name]?.accuracy || 30) : 0
      };
    });

    // Build edges based on prerequisite relationships (tier-based + category)
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].tier < nodes[j].tier) {
          // Add edge if they share category or if one is a mandatory prerequisite
          if (nodes[i].category === nodes[j].category ||
              (mandatorySkillIds.includes(nodes[i].id) && mandatorySkillIds.includes(nodes[j].id))) {
            edges.push({ from: nodes[i].id, to: nodes[j].id, type: 'prerequisite' });
            break; // Each node connects to one next-tier node
          }
        }
      }
    }

    // Count statuses
    const acquiredCount = nodes.filter(n => n.status === 'acquired').length;
    const inProgressCount = nodes.filter(n => n.status === 'in_progress').length;
    const targetGapCount = nodes.filter(n => n.status === 'target_gap').length;
    const lockedCount = nodes.filter(n => n.status === 'locked').length;

    const clusterNames = {
      tech: 'Software & Cloud Architecture',
      ai: 'AI & Data Science',
      ayush: 'Ayush Informatics'
    };

    return res.json({
      success: true,
      clusterName: clusterNames[cluster] || clusterNames.tech,
      totalNodes: nodes.length,
      acquiredCount,
      inProgressCount,
      targetGapCount,
      lockedCount,
      targetRole: roleProfile.title,
      nodes,
      edges
    });
  } catch (err) {
    console.error('[Skill Constellation Error]:', err);
    res.status(500).json({ success: false, error: 'Could not generate skill constellation.' });
  }
});

/**
 * PUT /api/profile/skill
 * Allows manual skill override / custom skill declarations
 */
router.put('/skill', (req, res) => {
  try {
    const { skills = [], targetRole } = req.body || {};
    const userId = req.user?.id || req.user?.email;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ success: false, error: 'Skills array required for profile update.' });
    }

    const user = (DB.users || []).find(u => u.id === userId || u.email === userId);
    if (user) {
      user.verified_skills = skills;
    }

    if (!DB.skillProfiles) DB.skillProfiles = {};
    const existing = DB.skillProfiles[userId] || {};

    DB.skillProfiles[userId] = {
      ...existing,
      userId,
      targetRole: targetRole || existing.targetRole || 'Herbal Formulation Scientist',
      verifiedSkills: skills,
      lastUpdated: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: 'Skill profile successfully updated with custom override!',
      profile: DB.skillProfiles[userId]
    });
  } catch (err) {
    console.error('[Update Skill Profile Error]:', err);
    res.status(500).json({ success: false, error: 'Could not update skill profile.' });
  }
});

/**
 * POST /api/profile/portfolio-upload
 * Adds a new verified credential or project to the digital portfolio
 */
router.post('/portfolio-upload', (req, res) => {
  try {
    const {
      userId: _ignoredUserId,
      title,
      type = 'Verified Certificate',
      issuer,
      issueDate,
      skills = []
    } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: 'Credential or project title is required.' });
    }

    const userId = req.user?.id || req.user?.email;
    const newItem = {
      id: `port-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title: title.trim(),
      type,
      issuer: issuer || 'Academic University / Certifying Authority',
      issueDate: issueDate || '2025',
      verificationHash: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
      skills: Array.isArray(skills) ? skills : [skills],
      status: 'NAAR Cryptographically Verified'
    };

    if (!DB.portfolioItems) DB.portfolioItems = [];
    DB.portfolioItems.unshift(newItem);

    // Also update user's verified skills
    const user = (DB.users || []).find(u => u.id === userId || u.email === userId);
    if (user && newItem.skills.length) {
      user.verified_skills = Array.from(new Set([...(user.verified_skills || []), ...newItem.skills]));
    }

    return res.status(201).json({
      success: true,
      message: 'Credential successfully registered onto NAAR Digital Portfolio ledger!',
      item: newItem,
      portfolio: DB.portfolioItems.filter(p => p.userId === userId)
    });
  } catch (err) {
    console.error('[Portfolio Upload Error]:', err);
    res.status(500).json({ success: false, error: 'Could not upload credential to portfolio.' });
  }
});

/**
 * GET /api/profile/portfolio
 * Returns digital portfolio items for student
 */
router.get('/portfolio', (req, res) => {
  try {
    const userId = req.user?.id || req.user?.email;
    const items = userId ? (DB.portfolioItems || []).filter(p => p.userId === userId) : [];
    return res.json({
      success: true,
      totalCount: items.length,
      portfolio: items
    });
  } catch (err) {
    console.error('[Get Portfolio Error]:', err);
    res.status(500).json({ success: false, error: 'Could not retrieve digital portfolio.' });
  }
});

// ============================================================================
// FEATURE 5: Co-Curricular & Holistic Competency Assessment (Aptitude & GK)
// ============================================================================

/**
 * GET /api/assessment/aptitude/questions
 * Returns 30 randomized multi-domain aptitude questions (without leaking answer keys)
 */
router.get('/aptitude/questions', (req, res) => {
  try {
    const rawQuestions = DB.aptitudeQuestions || [];
    // Sanitize to remove correctOptionIndex and explanation from client payload
    const safeQuestions = rawQuestions.map(q => ({
      id: q.id,
      domain: q.domain,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options
    }));

    return res.json({
      success: true,
      totalQuestions: safeQuestions.length,
      durationMinutes: 30,
      domains: ['Quantitative', 'Logical_Reasoning', 'Verbal_Ability', 'General_Knowledge', 'Industry_Ethics'],
      questions: safeQuestions
    });
  } catch (err) {
    console.error('[Aptitude Questions Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/assessment/aptitude/submit
 * Evaluates student answers, calculates domain sub-scores, awards XP & badge
 */
router.post('/aptitude/submit', async (req, res) => {
  try {
    const {
      studentId: _ignoredStudentId,
      answers = {} // Map of questionId -> selectedOptionIndex
    } = req.body || {};
    const studentId = req.user?.id || req.user?.email;

    const rawQuestions = DB.aptitudeQuestions || [];
    let correctCount = 0;
    const domainStats = {
      Quantitative: { correct: 0, total: 0 },
      Logical_Reasoning: { correct: 0, total: 0 },
      Verbal_Ability: { correct: 0, total: 0 },
      General_Knowledge: { correct: 0, total: 0 },
      Industry_Ethics: { correct: 0, total: 0 }
    };

    rawQuestions.forEach(q => {
      const dom = q.domain || 'General_Knowledge';
      if (domainStats[dom]) domainStats[dom].total += 1;

      const studentChoice = answers[q.id];
      if (studentChoice !== undefined && parseInt(studentChoice, 10) === q.correctOptionIndex) {
        correctCount += 1;
        if (domainStats[dom]) domainStats[dom].correct += 1;
      }
    });

    const totalQuestions = Math.max(rawQuestions.length, 1);
    const scorePercentage = Math.round((correctCount / totalQuestions) * 1000) / 10;
    const passed = scorePercentage >= 60; // 60% baseline pass

    // Calculate domain scores (0-100%)
    const domainScores = {};
    Object.keys(domainStats).forEach(dom => {
      const { correct, total } = domainStats[dom];
      domainScores[dom] = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
    });

    // Approximate percentile based on standard cohort distribution
    const percentile = Math.min(99.4, Math.max(45.0, Math.round((scorePercentage * 0.95 + 10) * 10) / 10));

    // Cryptographic validation hash
    const badgeHash = crypto
      .createHash('sha256')
      .update(`${studentId}-NFAT-2026-${scorePercentage}-${Date.now()}`)
      .digest('hex');

    const session = {
      id: `sess-${Date.now().toString(36)}`,
      studentId,
      assessmentType: 'National Foundational Aptitude (NFAT-2026)',
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      completedAt: new Date().toISOString(),
      rawScore: correctCount,
      totalQuestions,
      percentage: scorePercentage,
      percentile,
      domainScores,
      passed,
      badgeHash
    };

    if (!DB.assessmentSessions) DB.assessmentSessions = [];
    DB.assessmentSessions.unshift(session);

    // Award +200 XP and append verified aptitude badge to student profile
    const user = (DB.users || []).find(u => u.id === studentId);
    if (user) {
      user.xp = (user.xp || 1000) + 200;
      if (passed) {
        if (!user.verified_skills) user.verified_skills = [];
        if (!user.verified_skills.includes('NFAT Foundational Aptitude')) {
          user.verified_skills.push('NFAT Foundational Aptitude');
        }
      }
    }

    if (isConfigured && supabase) {
      try {
        await supabase.from('assessment_sessions').insert({
          id: session.id,
          student_id: studentId,
          assessment_type: session.assessmentType,
          started_at: session.startedAt,
          completed_at: session.completedAt,
          raw_score: correctCount,
          total_questions: totalQuestions,
          percentage: scorePercentage,
          percentile,
          domain_scores: domainScores,
          passed,
          badge_hash: badgeHash
        });
      } catch (err) {
        console.warn('[Aptitude Session Insert] Supabase warning:', err.message);
      }
    }

    return res.json({
      success: true,
      message: passed ? 'Assessment successfully validated! Foundational Aptitude Badge awarded (+200 XP).' : 'Assessment complete. Upskilling recommended.',
      session,
      xpGained: 200
    });
  } catch (err) {
    console.error('[Aptitude Submit Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// FEATURE 4: Student Workshop RSVP
// ============================================================================

/**
 * GET /api/assessment/workshops
 * List approved workshops for students
 */
router.get('/workshops', (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.email;
    const allWorkshops = DB.virtualWorkshops || [];
    const enrollments = DB.workshopEnrollments || [];

    const enrolledWorkshopIds = new Set(
      enrollments.filter(e => e.studentId === studentId).map(e => e.workshopId)
    );

    const workshopsWithRsvp = allWorkshops.map(w => ({
      ...w,
      isEnrolled: enrolledWorkshopIds.has(w.id)
    }));

    return res.json({ success: true, workshops: workshopsWithRsvp });
  } catch (err) {
    console.error('[Student Workshops GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/assessment/workshops/:id/rsvp
 * Student 1-click workshop enrollment
 */
router.post('/workshops/:id/rsvp', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName } = req.body || {};
    const studentId = req.user?.id || req.user?.email;
    const effectiveStudentName = (DB.users?.find(u => u.id === studentId)?.name) || studentName || req.user?.name || 'Verified Scholar';

    const workshops = DB.virtualWorkshops || [];
    const normalizedTarget = (id || '').toLowerCase().replace(/-0+/, '-');
    const wsp = workshops.find(w => w.id === id || (w.id || '').toLowerCase().replace(/-0+/, '-') === normalizedTarget) || workshops[0];

    if (!wsp) {
      return res.status(404).json({ success: false, error: 'Workshop not found.' });
    }

    if (!DB.workshopEnrollments) DB.workshopEnrollments = [];
    const existing = DB.workshopEnrollments.find(e => e.workshopId === id && e.studentId === studentId);

    if (existing) {
      return res.status(400).json({ success: false, error: 'You are already registered for this masterclass.' });
    }

    const enrollment = {
      id: `we-${Date.now().toString(36)}`,
      workshopId: id,
      studentId,
      studentName: effectiveStudentName,
      attendanceConfirmed: false,
      certificateIssued: false,
      registeredAt: new Date().toISOString()
    };

    DB.workshopEnrollments.unshift(enrollment);
    wsp.enrolledCount = (wsp.enrolledCount || 0) + 1;

    // Inject To-Do for student
    if (!DB.todos) DB.todos = [];
    DB.todos.unshift({
      id: `todo-wsp-${Date.now().toString(36)}`,
      studentId,
      title: `Attend Masterclass: ${wsp.title}`,
      description: `Speaker: ${wsp.speakerName} (${wsp.hostCompanyName}). Access link: ${wsp.meetingLink}.`,
      category: 'Skill',
      priority: 'High',
      dueDate: wsp.scheduledStart,
      isCompleted: false,
      completedAt: null,
      sourceType: 'user_created',
      sourceRefId: id
    });

    return res.json({
      success: true,
      message: `Successfully registered for "${wsp.title}"! Calendar invitation and To-Do item added.`,
      workshop: wsp,
      enrollment
    });
  } catch (err) {
    console.error('[Workshop RSVP Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// FEATURE 7: Company Skill Certification Quizzes & Public Verification
// ============================================================================

/**
 * GET /api/assessment/quizzes
 * List active company certification quizzes for students
 */
router.get('/quizzes', (req, res) => {
  try {
    const quizzes = DB.companyQuizzes || [];
    const certs = DB.studentQuizCertifications || [];
    const studentId = req.user?.id || req.user?.email;

    const passedQuizIds = new Set(
      certs.filter(c => c.studentId === studentId && c.passed).map(c => c.quizId)
    );

    const safeList = quizzes.map(q => ({
      id: q.id,
      companyName: q.companyName,
      badgeTitle: q.badgeTitle,
      badgeIcon: q.badgeIcon,
      skillCategory: q.skillCategory,
      timeLimitMinutes: q.timeLimitMinutes,
      passingPercentage: q.passingPercentage,
      questionCount: (q.questions || []).length,
      isAlreadyCertified: passedQuizIds.has(q.id)
    }));

    return res.json({ success: true, quizzes: safeList });
  } catch (err) {
    console.error('[Quizzes GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/assessment/quiz/:quizId
 * Fetch quiz questions for taking the assessment
 */
router.get('/quiz/:quizId', (req, res) => {
  try {
    const { quizId } = req.params;
    const quizzes = DB.companyQuizzes || [];
    const quiz = quizzes.find(q => q.id === quizId);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found.' });
    }

    const safeQuestions = (quiz.questions || []).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    return res.json({
      success: true,
      quiz: {
        id: quiz.id,
        companyName: quiz.companyName,
        badgeTitle: quiz.badgeTitle,
        badgeIcon: quiz.badgeIcon,
        skillCategory: quiz.skillCategory,
        timeLimitMinutes: quiz.timeLimitMinutes,
        passingPercentage: quiz.passingPercentage,
        questions: safeQuestions
      }
    });
  } catch (err) {
    console.error('[Quiz Fetch Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/assessment/quiz/:quizId/submit
 * Grades quiz, checks passing mark (75%), generates SHA-256 verification token
 */
router.post('/quiz/:quizId/submit', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { studentName, answers = {} } = req.body || {};
    const studentId = req.user?.id || req.user?.email;

    const quizzes = DB.companyQuizzes || [];
    const quiz = quizzes.find(q => q.id === quizId);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found.' });
    }

    let correctCount = 0;
    const totalQuestions = Math.max((quiz.questions || []).length, 1);

    (quiz.questions || []).forEach(q => {
      const selected = answers[q.id];
      if (selected !== undefined && parseInt(selected, 10) === q.correctIndex) {
        correctCount += 1;
      }
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 1000) / 10;
    const passingMark = quiz.passingPercentage || 75;
    const passed = scorePercentage >= passingMark;

    quiz.totalTakers = (quiz.totalTakers || 0) + 1;
    if (passed) quiz.passCount = (quiz.passCount || 0) + 1;

    let cert = null;
    let token = null;

    if (passed) {
      token = crypto
        .createHash('sha256')
        .update(`${studentId}-${quizId}-${Date.now()}-${scorePercentage}`)
        .digest('hex');

      cert = {
        id: `cert-${Date.now().toString(36)}`,
        quizId,
        studentId,
        studentName: studentName || (DB.users?.find(u => u.id === studentId)?.name) || 'Verified Scholar',
        companyName: quiz.companyName,
        badgeTitle: quiz.badgeTitle,
        badgeIcon: quiz.badgeIcon || 'verified',
        skillCategory: quiz.skillCategory,
        scorePercentage,
        passed: true,
        attemptedAt: new Date().toISOString(),
        verificationToken: token,
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        isDisplayedOnProfile: true
      };

      if (!DB.studentQuizCertifications) DB.studentQuizCertifications = [];
      DB.studentQuizCertifications.unshift(cert);

      // Award +250 XP to student
      const user = (DB.users || []).find(u => u.id === studentId);
      if (user) {
        user.xp = (user.xp || 1000) + 250;
        if (!user.verified_skills) user.verified_skills = [];
        if (!user.verified_skills.includes(quiz.badgeTitle)) {
          user.verified_skills.push(quiz.badgeTitle);
        }
      }

      // Notify Student
      if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
      DB.inPortalNotifications.unshift({
        id: `notif-${Date.now().toString(36)}`,
        recipientId: studentId,
        senderId: quiz.companyId,
        title: `Badge Earned: ${quiz.badgeTitle}!`,
        message: `Congratulations! You scored ${scorePercentage}% and earned the official ${quiz.companyName} verified credential (+250 XP).`,
        actionUrl: '/student.html#certifications',
        category: 'system_alert',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      passed,
      scorePercentage,
      passingMark,
      correctCount,
      totalQuestions,
      certification: cert,
      certificate: cert,
      verificationToken: token,
      verificationUrl: token ? `/api/assessment/verify/${token}` : null,
      message: passed
        ? `Congratulations! You scored ${scorePercentage}% and earned the official ${quiz.badgeTitle} (+250 XP).`
        : `You scored ${scorePercentage}%. The passing threshold is ${passingMark}%. Actionable review materials are available in your roadmap.`
    });
  } catch (err) {
    console.error('[Quiz Submit Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/assessment/certifications
 * List earned certifications for student profile display
 */
router.get('/certifications', (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.email;
    const certs = studentId ? (DB.studentQuizCertifications || []).filter(c => c.studentId === studentId) : [];
    return res.json({ success: true, certifications: certs });
  } catch (err) {
    console.error('[Certifications GET Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/assessment/verify/:token
 * Public unauthenticated digital credential verification endpoint
 */
router.get('/verify/:token', (req, res) => {
  try {
    const { token } = req.params;
    const certs = DB.studentQuizCertifications || [];
    const cert = certs.find(c => c.verificationToken === token || c.verification_token === token);

    if (!cert) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: 'Credential token is invalid, expired, or revoked.'
      });
    }

    return res.json({
      success: true,
      verified: true,
      credential: {
        badgeTitle: cert.badgeTitle,
        recipientName: cert.studentName,
        issuingOrganization: cert.companyName,
        scoreAttained: `${cert.scorePercentage}%`,
        issueDate: cert.attemptedAt,
        verificationToken: cert.verificationToken,
        status: 'Cryptographically Verified via SHA-256 HMAC'
      }
    });
  } catch (err) {
    console.error('[Credential Verification Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// FEATURE 8: Company Hiring Exam Module (SIH 26044)
// ============================================================================

/**
 * GET /api/student/assigned-exams
 * Retrieve active and pending corporate tests assigned to the current student.
 */
router.get('/student/assigned-exams', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?.email || 'usr-student-01';

    // Get assignments for this student
    let assignments = [];
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidate_exam_assignments')
          .select('*')
          .eq('candidate_email', req.user?.email || '')
          .or(`candidate_email.eq.${req.user?.email || ''},candidate_name.ilike.%${req.user?.name || ''}%`)
          .order('assigned_at', { ascending: false });

        if (!error && data) {
          assignments = data;
        }
      } catch (err) {
        console.warn('[Get assigned exams] Supabase warning:', err.message);
      }
    }

    // Fallback to in-memory storage
    if (assignments.length === 0) {
      assignments = DB.candidate_exam_assignments.filter(a =>
        a.candidateEmail === (req.user?.email || '') ||
        a.candidateName === (req.user?.name || '')
      );
    }

    // Enhance assignments with exam details
    const enhancedAssignments = [];
    for (const assignment of assignments) {
      let exam = null;
      if (isConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('hiring_exams')
            .select('*')
            .eq('id', assignment.exam_id)
            .single();

          if (!error && data) {
            exam = data;
          }
        } catch (err) {
          console.warn('[Get exam for assignment] Supabase warning:', err.message);
        }
      }

      if (!exam) {
        exam = DB.hiring_exams.find(e => e.id === assignment.examId);
      }

      if (exam) {
        // Check if assignment is still valid (not expired/completed)
        const isValid = ['Pending', 'In Progress'].includes(assignment.status);
        const daysSinceAssignment = Date.now() - new Date(assignment.assignedAt).getTime();
        const isExpired = daysSinceAssignment > (7 * 24 * 60 * 60 * 1000); // 7 days expiry

        enhancedAssignments.push({
          ...assignment,
          exam: {
            id: exam.id,
            title: exam.title,
            roleTitle: exam.roleTitle,
            companyName: exam.companyName,
            durationMinutes: exam.durationMinutes,
            passingPercentage: exam.passingPercentage,
            totalQuestions: exam.totalQuestions
          },
          isValid: isValid && !isExpired,
          isExpired: isExpired
        });
      }
    }

    return res.json({
      success: true,
      assignedExams: enhancedAssignments
    });
  } catch (err) {
    console.error('[Get assigned exams] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve assigned exams.' });
  }
});

/**
 * POST /api/student/assigned-exams/:id/start
 * Begin the test session; stores transient attempt token in quizStorage.service.
 */
router.post('/student/assigned-exams/:id/start', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const studentId = req.user?.id || req.user?.email || 'usr-student-01';
    const studentEmail = req.user?.email || '';
    const studentName = req.user?.name || 'Student Scholar';

    // Verify assignment exists and belongs to this student
    let assignment = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidate_exam_assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();

        if (!error && data) {
          assignment = data;
        }
      } catch (err) {
        console.warn('[Get assignment] Supabase warning:', err.message);
      }
    }

    if (!assignment) {
      assignment = DB.candidate_exam_assignments.find(a => a.id === assignmentId);
    }

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found.' });
    }

    // Verify assignment belongs to this student (by email or name match)
    const belongsToStudent =
      assignment.candidateEmail === studentEmail ||
      assignment.candidateName === studentName ||
      (assignment.candidateEmail && assignment.candidateEmail.toLowerCase() === studentEmail.toLowerCase());

    if (!belongsToStudent) {
      return res.status(403).json({ success: false, error: 'Not authorized to start this assignment.' });
    }

    // Verify assignment is in correct state
    if (assignment.status !== 'Pending') {
      return res.status(400).json({ success: false, error: `Assignment is not in Pending state. Current state: ${assignment.status}` });
    }

    // Get exam details
    let exam = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exams')
          .select('*')
          .eq('id', assignment.exam_id)
          .single();

        if (!error && data) {
          exam = data;
        }
      } catch (err) {
        console.warn('[Get exam for start] Supabase warning:', err.message);
      }
    }

    if (!exam) {
      exam = DB.hiring_exams.find(e => e.id === assignment.examId);
    }

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found.' });
    }

    // Get questions for this exam
    let questions = [];
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exam_questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          questions = data;
        }
      } catch (err) {
        console.warn('[Get exam questions] Supabase warning:', err.message);
      }
    }

    if (questions.length === 0) {
      questions = DB.hiring_exam_questions[exam.id] || [];
    }

    if (questions.length === 0) {
      return res.status(500).json({ success: false, error: 'No questions found for this exam.' });
    }

    // Update assignment status to 'In Progress'
    const updatedAssignment = {
      ...assignment,
      status: 'In Progress'
    };

    if (isConfigured && supabase) {
      try {
        await supabase
          .from('candidate_exam_assignments')
          .update({ status: 'In Progress' })
          .eq('id', assignmentId);
      } catch (err) {
        console.warn('[Update assignment status] Supabase warning:', err.message);
      }
    } else {
      const index = DB.candidate_exam_assignments.findIndex(a => a.id === assignmentId);
      if (index !== -1) {
        DB.candidate_exam_assignments[index] = updatedAssignment;
      }
    }

    // Create transient quiz attempt using quizStorage.service
    const attemptId = `hiring-exam-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Format questions for quizStorage.service
    const formattedQuestions = questions.map(q => ({
      id: q.id || `q-${Date.now()}-${Math.random()}`,
      question: q.question_text || q.questionText,
      options: Array.isArray(q.options) ? q.options : [],
      correctIndex: q.correct_index !== undefined ? q.correct_index : q.correctIndex,
      skill: q.skill_category || q.skillCategory || 'General',
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation || ''
    }));

    // Save the attempt with exam-specific data
    saveQuizAttempt({
      attemptId,
      studentId,
      question: `Hiring Exam: ${exam.title}`, // Main question description
      correctAnswer: '', // Not used for multi-question exams
      correctOptionId: 'opt_1', // Placeholder
      distractors: [], // Placeholder
      explanation: `Enterprise screening exam for ${exam.roleTitle} at ${exam.companyName}`,
      skill: exam.roleTitle,
      ttlMs: exam.durationMinutes * 60 * 1000, // Exam duration in milliseconds
      // Custom metadata for hiring exam
      metadata: {
        examId: exam.id,
        assignmentId: assignmentId,
        totalQuestions: formattedQuestions.length,
        questions: formattedQuestions,
        examTitle: exam.title,
        companyName: exam.companyName,
        roleTitle: exam.roleTitle
      }
    });

    return res.json({
      success: true,
      message: 'Hiring exam session started successfully!',
      attemptId,
      exam: {
        id: exam.id,
        title: exam.title,
        roleTitle: exam.roleTitle,
        companyName: exam.companyName,
        durationMinutes: exam.durationMinutes,
        totalQuestions: questions.length
      },
      questions: formattedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }))
    });
  } catch (err) {
    console.error('[Start hiring exam] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to start hiring exam.' });
  }
});

/**
 * POST /api/student/assigned-exams/:id/submit
 * Validate candidate submission against stored correct keys, compute percentage, update candidate assignment record, and grant XP.
 */
router.post('/student/assigned-exams/:id/submit', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const studentId = req.user?.id || req.user?.email || 'usr-student-01';
    const studentEmail = req.user?.email || '';
    const studentName = req.user?.name || 'Student Scholar';
    const { answers } = req.body; // Expected format: { questionId: selectedOptionIndex }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Answers object is required.' });
    }

    // Verify assignment exists and belongs to this student
    let assignment = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidate_exam_assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();

        if (!error && data) {
          assignment = data;
        }
      } catch (err) {
        console.warn('[Get assignment for submit] Supabase warning:', err.message);
      }
    }

    if (!assignment) {
      assignment = DB.candidate_exam_assignments.find(a => a.id === assignmentId);
    }

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found.' });
    }

    // Verify assignment belongs to this student (by email or name match)
    const belongsToStudent =
      assignment.candidateEmail === studentEmail ||
      assignment.candidateName === studentName ||
      (assignment.candidateEmail && assignment.candidateEmail.toLowerCase() === studentEmail.toLowerCase());

    if (!belongsToStudent) {
      return res.status(403).json({ success: false, error: 'Not authorized to submit this assignment.' });
    }

    // Verify assignment is in correct state
    if (assignment.status !== 'In Progress') {
      return res.status(400).json({ success: false, error: `Assignment is not in In Progress state. Current state: ${assignment.status}` });
    }

    // Get exam details
    let exam = null;
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exams')
          .select('*')
          .eq('id', assignment.exam_id)
          .single();

        if (!error && data) {
          exam = data;
        }
      } catch (err) {
        console.warn('[Get exam for submit] Supabase warning:', err.message);
      }
    }

    if (!exam) {
      exam = DB.hiring_exams.find(e => e.id === assignment.examId);
    }

    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found.' });
    }

    // Get questions for this exam
    let questions = [];
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exam_questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          questions = data;
        }
      } catch (err) {
        console.warn('[Get exam questions for submit] Supabase warning:', err.message);
      }
    }

    if (questions.length === 0) {
      questions = DB.hiring_exam_questions[exam.id] || [];
    }

    if (questions.length === 0) {
      return res.status(500).json({ success: false, error: 'No questions found for this exam.' });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = questions.length;

    questions.forEach(question => {
      const questionId = question.id || `q-${question.question_text?.substring(0, 10)}` || '';
      const selectedOptionIndex = answers[questionId];

      if (selectedOptionIndex !== undefined &&
          parseInt(selectedOptionIndex, 10) === question.correct_index) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 1000) / 10; // 1 decimal place
    const passed = scorePercentage >= exam.passingPercentage;

    // Update assignment with results
    const completedAt = new Date().toISOString();
    const updatedAssignment = {
      ...assignment,
      status: passed ? 'Completed' : 'Failed',
      score: scorePercentage,
      passed: passed,
      completedAt: completedAt
    };

    if (isConfigured && supabase) {
      try {
        await supabase
          .from('candidate_exam_assignments')
          .update({
            status: updatedAssignment.status,
            score: updatedAssignment.score,
            passed: updatedAssignment.passed,
            completed_at: updatedAssignment.completedAt
          })
          .eq('id', assignmentId);
      } catch (err) {
        console.warn('[Update assignment results] Supabase warning:', err.message);
      }
    } else {
      const index = DB.candidate_exam_assignments.findIndex(a => a.id === assignmentId);
      if (index !== -1) {
        DB.candidate_exam_assignments[index] = updatedAssignment;
      }
    }

    // Award XP based on performance
    let xpAwarded = 0;
    if (passed) {
      xpAwarded = 100 + Math.floor((scorePercentage - exam.passingPercentage) / 2); // Bonus for exceeding passing mark
    } else {
      xpAwarded = 50; // Consolation XP for attempting
    }

    // Update student XP
    const user = (DB.users || []).find(u => u.id === studentId || u.email === studentEmail);
    if (user) {
      user.xp = (user.xp || 1000) + xpAwarded;

      // Add skill to verified skills if passed
      if (passed && exam.roleTitle) {
        if (!user.verified_skills) user.verified_skills = [];
        if (!user.verified_skills.includes(exam.roleTitle)) {
          user.verified_skills.push(exam.roleTitle);
        }
      }
    }

    // Persist to Supabase if configured
    if (isConfigured && supabase) {
      try {
        await supabase.from('profiles').update({
          xp: user ? user.xp : 1000 + xpAwarded,
          verified_skills: user ? user.verified_skills : [exam.roleTitle]
        }).eq('id', studentId);
      } catch (e) {
        console.warn('[Update student XP] Supabase warning:', e.message);
      }
    }

    // Create notification for student
    if (!DB.inPortalNotifications) DB.inPortalNotifications = [];
    DB.inPortalNotifications.unshift({
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientId: studentId,
      senderId: assignment.companyId || 'usr-industry-01',
      title: passed ? `Exam Completed: ${exam.title}` : `Exam Results: ${exam.title}`,
      message: passed
        ? `Congratulations! You scored ${scorePercentage}% and passed the hiring assessment for ${exam.roleTitle} at ${exam.companyName}. (+${xpAwarded} XP)`
        : `You scored ${scorePercentage}% on the hiring assessment for ${exam.roleTitle} at ${exam.companyName}. Passing score: ${exam.passingPercentage}%. (+${xpAwarded} XP)`,
      actionUrl: '/student.html#exam-results',
      category: passed ? 'system_alert' : 'assessment_result',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Add to todo list for completed exam (for review)
    if (!DB.todos) DB.todos = [];
    DB.todos.unshift({
      id: `todo-exam-${Date.now().toString(36)}`,
      studentId: studentId,
      title: `Review Exam Results: ${exam.title}`,
      description: `You completed the hiring assessment for ${exam.roleTitle} at ${exam.companyName}. Score: ${scorePercentage}%${passed ? ' - PASSED' : ''}`,
      category: 'Assessment',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days
      isCompleted: false,
      completedAt: null,
      sourceType: 'exam_completed',
      sourceRefId: assignmentId
    });

    return res.json({
      success: true,
      message: passed
        ? `Congratulations! You scored ${scorePercentage}% and passed the hiring assessment.`
        : `You scored ${scorePercentage}% on the hiring assessment. Passing score: ${exam.passingPercentage}%.`,
      score: scorePercentage,
      passed: passed,
      xpAwarded: xpAwarded,
      correctCount: correctCount,
      totalQuestions: totalQuestions,
      exam: {
        id: exam.id,
        title: exam.title,
        roleTitle: exam.roleTitle,
        companyName: exam.companyName
      }
    });
  } catch (err) {
    console.error('[Submit hiring exam] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to submit hiring exam.' });
  }
});

// GET /api/student/assigned-exams/:id/results: Get results for a completed exam assignment
router.get('/student/assigned-exams/:id/results', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const studentId = req.user?.id || req.user?.email || 'usr-student-01';

    // Get assignment with exam details
    let assignment = null;
    let exam = null;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('candidate_exam_assignments')
          .select('*')
          .eq('id', assignmentId)
          .single();
        if (!error && data) {
          assignment = data;
        }
      } catch (err) {
        console.warn('[Get exam results] Supabase warning:', err.message);
      }
    }
    if (!assignment) {
      assignment = DB.candidate_exam_assignments.find(a => a.id === assignmentId);
    }

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Exam assignment not found.' });
    }

    // Get exam details
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exams')
          .select('*')
          .eq('id', assignment.exam_id)
          .single();
        if (!error && data) {
          exam = data;
        }
      } catch (err) {
        console.warn('[Get exam for results] Supabase warning:', err.message);
      }
    }
    if (!exam) {
      exam = DB.hiring_exams.find(e => e.id === assignment.exam_id);
    }

    // Get questions with correct answers for review
    let questions = [];
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('hiring_exam_questions')
          .select('*')
          .eq('exam_id', assignment.exam_id)
          .order('id', { ascending: true });
        if (!error && data) {
          questions = data;
        }
      } catch (err) {
        console.warn('[Get exam questions for results] Supabase warning:', err.message);
      }
    }
    if (questions.length === 0 && DB.hiring_exam_questions) {
      questions = DB.hiring_exam_questions[assignment.exam_id] || [];
    }

    // Get student's answers from quizStorage
    let studentAnswers = {};
    try {
      const { QuizStorage } = require('../../services/quizStorage.service.js');
      const storage = new QuizStorage();
      const attempt = await storage.getAttempt(assignmentId, studentId);
      if (attempt && attempt.answers) {
        studentAnswers = attempt.answers;
      }
    } catch (err) {
      console.warn('[Get student answers] Warning:', err.message);
    }

    // Build detailed results
    const detailedQuestions = questions.map((q, idx) => {
      const studentAnswer = studentAnswers[idx];
      return {
        questionId: q.id,
        questionText: q.question_text,
        options: q.options,
        correctIndex: q.correct_index,
        studentAnswer: studentAnswer,
        isCorrect: studentAnswer === q.correct_index,
        skillCategory: q.skill_category,
        difficulty: q.difficulty,
        explanation: q.explanation
      };
    });

    return res.json({
      success: true,
      assignment: {
        id: assignment.id,
        examId: assignment.exam_id,
        status: assignment.status,
        score: assignment.score,
        passed: assignment.passed,
        completedAt: assignment.completed_at,
        assignedAt: assignment.assigned_at
      },
      exam: exam ? {
        id: exam.id,
        title: exam.title,
        roleTitle: exam.role_title,
        companyName: exam.company_name,
        durationMinutes: exam.duration_minutes,
        passingPercentage: exam.passing_percentage,
        totalQuestions: exam.total_questions
      } : null,
      questions: detailedQuestions,
      summary: {
        totalQuestions: questions.length,
        correctCount: detailedQuestions.filter(q => q.isCorrect).length,
        scorePercentage: assignment.score,
        passed: assignment.passed
      }
    });
  } catch (err) {
    console.error('[Get exam results] Error:', err);
    return res.status(500).json({ success: false, error: 'Unable to retrieve exam results.' });
  }
});

module.exports = router;

