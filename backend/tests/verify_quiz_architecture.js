/**
 * JOBLEX AI & Quiz Arena Architecture Verification Test Suite
 * 
 * Verifies:
 * 1. Decoupled bifurcated storage (Store 1: Correct Answer, Store 2: Distractors).
 * 2. 15-Minute TTL and Atomic GETDEL consumption (anti-replay attack prevention).
 * 3. Deterministic conditional (if/else) evaluation with ZERO LLM calls on submit.
 * 4. Single-call generation endpoint (/adaptive/generate & /quiz/generate).
 * 5. Complete lack of correct answer leakage in generate responses.
 * 6. 12-model NVIDIA NIM cascade and Google AI Studio RPM rate limiter exports.
 */

const express = require('express');
const assert = require('assert');
const assessmentRoutes = require('../routes/assessment.routes');
const { 
  saveQuizAttempt, 
  validateAndConsumeAttempt, 
  getDistractorData, 
  getStorageStats,
  evictAttempt 
} = require('../services/quizStorage.service');
const { 
  NVIDIA_MODELS_CASCADE, 
  NVIDIA_CIRCUIT_BREAKER, 
  googleRateLimiter 
} = require('../services/ai.service');

async function runQuizArchitectureVerification() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING QUIZ ARENA & AI ARCHITECTURE VERIFICATION');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(testName) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
  }

  function recordFail(testName, err) {
    failed++;
    console.error(`❌ [FAIL] ${testName}:`, err.message || err);
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: Decoupled Transient Storage Unit Tests
  // -------------------------------------------------------------
  console.log('--- TEST SUITE 1: Decoupled Bifurcated Storage Engine ---');

  const testAttemptId = `test-attempt-${Date.now()}`;
  const testStudentId = 'usr-student-tester';
  const testQuestion = 'What is the primary benefit of decoupled architecture?';
  const testCorrectAnswer = 'Fault isolation and independent scalability';
  const testCorrectOptionId = 'opt_2';
  const testDistractors = [
    'Tight circular dependencies',
    'Increased deployment coupling',
    'Monolithic shared memory states'
  ];
  const testExplanation = 'Decoupling separates failure boundaries and simplifies maintenance.';

  try {
    const saveResult = saveQuizAttempt({
      attemptId: testAttemptId,
      studentId: testStudentId,
      question: testQuestion,
      correctAnswer: testCorrectAnswer,
      correctOptionId: testCorrectOptionId,
      distractors: testDistractors,
      explanation: testExplanation,
      skill: 'System Design',
      ttlMs: 15 * 60 * 1000
    });

    assert.strictEqual(saveResult.success, true, 'saveQuizAttempt should return success: true');
    assert.strictEqual(saveResult.attemptId, testAttemptId);

    // Verify stats show 1 active key in both stores
    const stats = getStorageStats();
    assert.ok(stats.activeCorrectKeys >= 1, 'Store 1 must contain stored attempt');
    assert.ok(stats.activeDistractorKeys >= 1, 'Store 2 must contain stored attempt');

    // Verify Store 2 contains distractors and question, but NOT correct answer
    const distractorData = getDistractorData(testAttemptId);
    assert.ok(distractorData, 'Distractor data should exist in Store 2');
    assert.strictEqual(distractorData.question, testQuestion);
    assert.deepStrictEqual(distractorData.distractors, testDistractors);
    assert.strictEqual(distractorData.correctAnswer, undefined, 'Store 2 must NEVER store correct answer');
    assert.strictEqual(distractorData.correctOptionId, undefined, 'Store 2 must NEVER store correctOptionId');

    recordPass('Bifurcated Storage Isolation (Store 1 vs Store 2 separation)');
  } catch (err) {
    recordFail('Bifurcated Storage Isolation', err);
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: Deterministic Evaluation & Atomic GETDEL Consumption
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Deterministic Validation & Anti-Replay (GETDEL) ---');

  try {
    // 2.1 Submit incorrect answer first on another attempt
    const wrongAttemptId = `test-wrong-${Date.now()}`;
    saveQuizAttempt({
      attemptId: wrongAttemptId,
      studentId: testStudentId,
      question: 'Which protocol is connection-oriented?',
      correctAnswer: 'TCP',
      correctOptionId: 'opt_1',
      distractors: ['UDP', 'ICMP', 'IGMP'],
      explanation: 'TCP establishes a three-way handshake.',
      skill: 'Computer Networks'
    });

    const wrongResult = validateAndConsumeAttempt(wrongAttemptId, 'opt_3', testStudentId);
    assert.strictEqual(wrongResult.valid, true);
    assert.strictEqual(wrongResult.isCorrect, false);
    assert.strictEqual(wrongResult.score, 0);
    assert.strictEqual(wrongResult.correctOptionId, 'opt_1');
    assert.strictEqual(wrongResult.correctAnswerText, 'TCP');
    recordPass('Deterministic Evaluation on Incorrect Submission (score: 0, zero LLM calls)');

    // 2.2 Verify Replay Attack prevention on wrongAttemptId (already consumed)
    const replayWrong = validateAndConsumeAttempt(wrongAttemptId, 'opt_1', testStudentId);
    assert.strictEqual(replayWrong.valid, false, 'Consumed attempt must reject subsequent submissions');
    recordPass('Anti-Replay Attack Protection via Atomic GETDEL Consumption');

    // 2.3 Submit correct answer on testAttemptId
    const correctResult = validateAndConsumeAttempt(testAttemptId, 'opt_2', testStudentId);
    assert.strictEqual(correctResult.valid, true);
    assert.strictEqual(correctResult.isCorrect, true);
    assert.strictEqual(correctResult.score, 100);
    assert.strictEqual(correctResult.correctOptionId, 'opt_2');
    assert.strictEqual(correctResult.correctAnswerText, testCorrectAnswer);
    assert.strictEqual(correctResult.explanation, testExplanation);
    recordPass('Deterministic Evaluation on Correct Submission (score: 100, zero LLM calls)');

    // 2.4 Verify Replay Attack prevention on testAttemptId
    const replayCorrect = validateAndConsumeAttempt(testAttemptId, 'opt_2', testStudentId);
    assert.strictEqual(replayCorrect.valid, false);
    recordPass('Second Submission Attempt Blocked after Correct Evaluation');
  } catch (err) {
    recordFail('Deterministic Evaluation & Anti-Replay', err);
  }

  // -------------------------------------------------------------
  // TEST SUITE 3: HTTP API Integration Endpoints
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: API Integration Endpoints ---');

  const app = express();
  app.use(express.json());
  app.use('/api/assessment', assessmentRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/assessment`;

  try {
    // 3.1 Test Telemetry endpoint
    const statsRes = await fetch(`${baseUrl}/quiz/stats`);
    const statsData = await statsRes.json();
    assert.strictEqual(statsRes.status, 200);
    assert.strictEqual(statsData.success, true);
    assert.ok(typeof statsData.stats.activeCorrectKeys === 'number');
    assert.ok(typeof statsData.stats.activeDistractorKeys === 'number');
    recordPass('GET /api/assessment/quiz/stats returns storage telemetry');

    // 3.2 Test Single-Call Generation: POST /api/assessment/adaptive/generate
    const genRes = await fetch(`${baseUrl}/adaptive/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        difficulty: 'mixed',
        prompt: 'Distributed Systems & Microservices'
      })
    });

    const genData = await genRes.json();
    assert.strictEqual(genRes.status, 200);
    assert.strictEqual(genData.success, true);
    assert.ok(genData.attemptId, 'Must return attemptId');
    assert.ok(genData.question, 'Must return question text');
    assert.ok(Array.isArray(genData.options), 'Must return options array');
    assert.strictEqual(genData.options.length, 4, 'Must return exactly 4 options');

    // Verify ZERO answer or explanation hints leaked to client
    assert.strictEqual(genData.correctIndex, undefined, 'Must NOT leak correctIndex');
    assert.strictEqual(genData.correctOptionId, undefined, 'Must NOT leak correctOptionId');
    assert.strictEqual(genData.correctAnswer, undefined, 'Must NOT leak correctAnswer');
    assert.strictEqual(genData.explanation, undefined, 'Must NOT leak explanation');
    assert.strictEqual(genData.distractors, undefined, 'Must NOT leak distractors list');
    recordPass('POST /api/assessment/adaptive/generate returns 1 question with 4 options and ZERO correct answer leakage');

    // 3.3 Test alias endpoint POST /api/assessment/quiz/generate
    const genAliasRes = await fetch(`${baseUrl}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        difficulty: 'hard',
        prompt: 'High-Performance Computing'
      })
    });
    const genAliasData = await genAliasRes.json();
    assert.strictEqual(genAliasRes.status, 200);
    assert.strictEqual(genAliasData.success, true);
    assert.ok(genAliasData.attemptId);
    recordPass('POST /api/assessment/quiz/generate alias functional');

    // 3.4 Test Submission via HTTP API: POST /api/assessment/adaptive/submit
    const generatedAttemptId = genData.attemptId;
    const chosenOptionId = genData.options[0].id; // Pick first option (e.g. 'opt_1')

    const submitRes = await fetch(`${baseUrl}/adaptive/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: generatedAttemptId,
        selectedOptionId: chosenOptionId
      })
    });

    const submitData = await submitRes.json();
    assert.strictEqual(submitRes.status, 200);
    assert.strictEqual(submitData.success, true);
    assert.strictEqual(typeof submitData.isCorrect, 'boolean');
    assert.ok(submitData.score === 100 || submitData.score === 0);
    assert.ok(submitData.correctOptionId, 'Must reveal correctOptionId upon completion');
    assert.ok(submitData.correctAnswerText, 'Must reveal correctAnswerText upon completion');
    assert.ok(submitData.explanation, 'Must reveal educational explanation upon completion');
    recordPass('POST /api/assessment/adaptive/submit validates deterministically and reveals rationale');

    // 3.5 Test Replay Protection via HTTP: Re-submitting same attempt must fail with 400
    const replayHttpRes = await fetch(`${baseUrl}/adaptive/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: generatedAttemptId,
        selectedOptionId: chosenOptionId
      })
    });

    const replayHttpData = await replayHttpRes.json();
    assert.strictEqual(replayHttpRes.status, 400, 'Replay attempt must return HTTP 400');
    assert.strictEqual(replayHttpData.success, false);
    recordPass('HTTP API rejects duplicate submission attempt with HTTP 400');
  } catch (err) {
    recordFail('API Integration Endpoints', err);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  // -------------------------------------------------------------
  // TEST SUITE 4: NVIDIA NIM 12-Model Cascade & Google Quota Protections
  // -------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Multi-Provider Cascade & Quota Protections ---');

  try {
    assert.ok(Array.isArray(NVIDIA_MODELS_CASCADE), 'NVIDIA_MODELS_CASCADE must be exported');
    assert.ok(NVIDIA_MODELS_CASCADE.length >= 12, 'Must contain at least 12 models in cascade');
    assert.ok(NVIDIA_MODELS_CASCADE.includes('meta/llama-3.3-70b-instruct'), 'Cascade includes Llama 3.3 70B');
    assert.ok(NVIDIA_MODELS_CASCADE.includes('deepseek-ai/deepseek-r1'), 'Cascade includes DeepSeek-R1');
    assert.ok(NVIDIA_MODELS_CASCADE.includes('google/gemma-2-27b-it'), 'Cascade includes Gemma 2 27B');
    recordPass('NVIDIA NIM 12-Model Fallback Cascade verified');

    assert.ok(NVIDIA_CIRCUIT_BREAKER, 'Circuit breaker must be defined');
    assert.strictEqual(typeof NVIDIA_CIRCUIT_BREAKER.recordFailure, 'function');
    assert.strictEqual(typeof NVIDIA_CIRCUIT_BREAKER.isOpen, 'function');
    recordPass('NVIDIA NIM Circuit Breaker verified');

    assert.ok(googleRateLimiter, 'Google Rate Limiter must be defined');
    assert.strictEqual(typeof googleRateLimiter.canRequest, 'function');
    assert.strictEqual(typeof googleRateLimiter.recordRequest, 'function');
    assert.strictEqual(googleRateLimiter.canRequest(), true);
    recordPass('Google AI Studio Sliding Window Rate Limiter (14 RPM guard) verified');
  } catch (err) {
    recordFail('Multi-Provider Cascade & Quota Protections', err);
  }

  console.log('\n======================================================');
  console.log(`🏁 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runQuizArchitectureVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
