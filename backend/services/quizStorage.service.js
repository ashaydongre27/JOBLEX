/**
 * JOBLEX Decoupled Transient Storage Service for Quiz Arena
 * Enforces strict physical isolation between Correct Answers (Store 1) and Distractors (Store 2)
 * Features 15-minute automatic TTL eviction and atomic GETDEL consumption to prevent replay attacks.
 * Ministry of Ayush & Corporate Industry Partners | Problem Statement ID: 26044
 */

const crypto = require('crypto');

// In-Memory Storage Engines with Separate Namespaces
// Store 1: Strictly stores correct answer mapping, nonces, and explanation. Never exposed across the wire before submission.
const CORRECT_STORE = new Map();

// Store 2: Strictly stores distractors and telemetry metadata.
const DISTRACTOR_STORE = new Map();

// Default TTL: 900 seconds (15 minutes)
const DEFAULT_TTL_MS = 15 * 60 * 1000;

/**
 * Periodically purge expired records (runs every 60 seconds)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of CORRECT_STORE.entries()) {
    if (now > record.expiresAt) {
      CORRECT_STORE.delete(key);
    }
  }
  for (const [key, record] of DISTRACTOR_STORE.entries()) {
    if (now > record.expiresAt) {
      DISTRACTOR_STORE.delete(key);
    }
  }
}, 60000).unref();

/**
 * Save a newly generated quiz attempt into bifurcated storage
 * @param {Object} params
 * @param {string} params.attemptId - Unique UUIDv4 attempt identifier
 * @param {string} params.studentId - Authenticated student ID
 * @param {string} params.question - Question text
 * @param {string} params.correctAnswer - Correct answer text
 * @param {string} params.correctOptionId - Opaque randomized option ID (e.g., 'opt_3')
 * @param {string[]} params.distractors - Array of exactly 3 wrong answers
 * @param {string} params.explanation - Educational rationale for the correct answer
 * @param {string} [params.skill] - Skill or domain topic tested
 * @param {number} [params.ttlMs] - Custom TTL in milliseconds (defaults to 15 minutes)
 */
function saveQuizAttempt({
  attemptId,
  studentId,
  question,
  correctAnswer,
  correctOptionId,
  distractors,
  explanation = '',
  skill = 'Core Competency',
  ttlMs = DEFAULT_TTL_MS
}) {
  if (!attemptId || !correctOptionId) {
    throw new Error('attemptId and correctOptionId are required for quiz storage');
  }

  const now = Date.now();
  const expiresAt = now + (ttlMs || DEFAULT_TTL_MS);

  // 1. Store in Store 1 (Correct Store)
  CORRECT_STORE.set(attemptId, {
    attemptId,
    studentId: studentId || 'anonymous',
    correctOptionId,
    correctAnswerText: correctAnswer,
    explanation: explanation || '',
    skill,
    createdAt: now,
    expiresAt
  });

  // 2. Store in Store 2 (Distractor Store)
  DISTRACTOR_STORE.set(attemptId, {
    attemptId,
    studentId: studentId || 'anonymous',
    question,
    distractors: Array.isArray(distractors) ? distractors.slice(0, 3) : [],
    skill,
    createdAt: now,
    expiresAt
  });

  return {
    success: true,
    attemptId,
    expiresAt
  };
}

/**
 * Atomically validate and consume an attempt using simple conditional (if/else) logic.
 * Emulates Redis GETDEL: Retrieves the correct answer and immediately deletes it to thwart replay attacks.
 * Zero API/LLM calls are made here.
 * 
 * @param {string} attemptId - The attempt identifier
 * @param {string} selectedOptionId - The option ID submitted by the student (e.g., 'opt_3')
 * @param {string} [studentId] - Optional student ID to enforce ownership
 * @returns {Object} { valid, isCorrect, score, explanation, correctAnswerText, error }
 */
function validateAndConsumeAttempt(attemptId, selectedOptionId, studentId = null) {
  if (!attemptId) {
    return { valid: false, error: 'Missing attempt ID' };
  }

  const record = CORRECT_STORE.get(attemptId);

  // If record is not found or expired
  if (!record) {
    return {
      valid: false,
      error: 'Quiz attempt not found or has expired. Each attempt may only be submitted once.'
    };
  }

  // Check TTL expiration
  if (Date.now() > record.expiresAt) {
    CORRECT_STORE.delete(attemptId);
    DISTRACTOR_STORE.delete(attemptId);
    return {
      valid: false,
      error: 'Quiz attempt expired. Time limit of 15 minutes exceeded.'
    };
  }

  // Optional: verify student ownership if authenticated
  if (studentId && record.studentId !== 'anonymous' && record.studentId !== studentId) {
    return {
      valid: false,
      error: 'Access denied: Attempt does not belong to the current authenticated student.'
    };
  }

  // ATOMIC CONSUMPTION (GETDEL): Delete from Store 1 immediately
  CORRECT_STORE.delete(attemptId);

  // Pure deterministic conditional (if/else) validation - NO API CALLS
  let isCorrect = false;
  let score = 0;

  if (selectedOptionId && selectedOptionId === record.correctOptionId) {
    isCorrect = true;
    score = 100;
  } else {
    isCorrect = false;
    score = 0;
  }

  // Clean up Store 2 after submission
  const distractorData = DISTRACTOR_STORE.get(attemptId);
  DISTRACTOR_STORE.delete(attemptId);

  return {
    valid: true,
    isCorrect,
    score,
    selectedOptionId,
    correctOptionId: record.correctOptionId,
    correctAnswerText: record.correctAnswerText,
    explanation: record.explanation,
    skill: record.skill,
    distractors: distractorData?.distractors || []
  };
}

/**
 * Retrieve distractor metadata without exposing correct answers
 */
function getDistractorData(attemptId) {
  return DISTRACTOR_STORE.get(attemptId) || null;
}

/**
 * Explicitly evict an attempt from both stores
 */
function evictAttempt(attemptId) {
  CORRECT_STORE.delete(attemptId);
  DISTRACTOR_STORE.delete(attemptId);
}

/**
 * Get internal storage metrics for telemetry/health check
 */
function getStorageStats() {
  return {
    activeCorrectKeys: CORRECT_STORE.size,
    activeDistractorKeys: DISTRACTOR_STORE.size
  };
}

module.exports = {
  saveQuizAttempt,
  validateAndConsumeAttempt,
  getDistractorData,
  evictAttempt,
  getStorageStats
};
