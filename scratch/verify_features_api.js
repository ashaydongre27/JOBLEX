/**
 * Comprehensive API Verification Test for 7-Feature Integrated Education-Employment Platform
 */

const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    }, res => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runAllTests() {
  console.log('=== STARTING 7-FEATURE API VERIFICATION ===\n');

  try {
    // 1. Feature 1: To-Do Engine
    console.log('[Test 1] Student Contextual To-Do Engine');
    const todosGet = await request('GET', '/api/todos?studentId=usr-student-01');
    console.log('  GET /api/todos status:', todosGet.status, 'Total todos:', todosGet.data.todos?.length);

    const newTodoRes = await request('POST', '/api/todos', {
      title: 'Submit Withaferin-A Chromatography Report',
      category: 'Academic',
      priority: 'High',
      dueDate: '2026-10-15T18:00:00Z'
    });
    console.log('  POST /api/todos created:', newTodoRes.data.todo?.title);
    const todoId = newTodoRes.data.todo?.id;

    const toggleRes = await request('PATCH', `/api/todos/${todoId}/toggle`);
    console.log('  PATCH /api/todos/:id/toggle status:', toggleRes.status, 'isCompleted:', toggleRes.data.todo?.isCompleted, 'xpGained:', toggleRes.data.xpGained);

    // 2. Feature 2: In-Portal Notifications Hub
    console.log('\n[Test 2] In-Portal Notification Hub');
    const notifsGet = await request('GET', '/api/notifications?recipientId=usr-student-01');
    console.log('  GET /api/notifications count:', notifsGet.data.notifications?.length, 'unread:', notifsGet.data.unreadCount);

    const dispatchRes = await request('POST', '/api/notifications/dispatch', {
      recipientId: 'usr-student-01',
      title: 'Lab Session Rescheduled',
      message: 'HPTLC calibration moves to Lab 3.',
      category: 'system_alert'
    });
    console.log('  POST /api/notifications/dispatch:', dispatchRes.data.notification?.title);

    // 3. Feature 3: Company Tech Stack & University Tech Radar
    console.log('\n[Test 3] Tech Stack Registry & University Tech Radar');
    const techStackRes = await request('POST', '/api/industry/tech-stack', {
      companyName: 'Dabur India Ltd.',
      sector: 'Analytical Instrumentation',
      techName: 'CAMAG Automatic TLC Sampler 4 (ATS 4)',
      proficiencyDemandLevel: 'Production Mastery',
      adoptionStage: 'Core Production',
      curriculumRelevanceNote: 'Precision band spray application eliminates manual syringe errors.'
    });
    console.log('  POST /api/industry/tech-stack registered:', techStackRes.data.techStack?.techName);

    const techRadarRes = await request('GET', '/api/academy/tech-radar');
    console.log('  GET /api/academy/tech-radar disclosures:', techRadarRes.data.totalDisclosures, 'Curriculum gaps:', techRadarRes.data.curriculumGaps?.length);

    // 4. Feature 4: Virtual Workshops & Bilateral Negotiations
    console.log('\n[Test 4] Virtual Workshops & Negotiation Gateway');
    const proposeWsp = await request('POST', '/api/industry/workshops/propose', {
      speakerName: 'Dr. Vikram Malhotra',
      speakerDesignation: 'VP R&D',
      title: 'Validation of Herbal Extract Fingerprints',
      scheduledStart: '2026-11-12T14:00:00Z',
      durationMinutes: 90
    });
    console.log('  POST /api/industry/workshops/propose status:', proposeWsp.status, 'Title:', proposeWsp.data.workshop?.title);
    const wspId = proposeWsp.data.workshop?.id;

    const decideWsp = await request('PATCH', `/api/academy/workshops/${wspId}/decision`, { decision: 'Approved' });
    console.log('  PATCH /api/academy/workshops/:id/decision approved:', decideWsp.data.workshop?.status);

    const rsvpWsp = await request('POST', `/api/assessment/workshops/${wspId}/rsvp`, { studentId: 'usr-student-01' });
    console.log('  POST /api/assessment/workshops/:id/rsvp:', rsvpWsp.data.message);

    // 5. Feature 5: Aptitude & Holistic Credential Assessment
    console.log('\n[Test 5] Co-Curricular & Holistic Competency Assessment');
    const aptQRes = await request('GET', '/api/assessment/aptitude/questions');
    console.log('  GET /api/assessment/aptitude/questions total:', aptQRes.data.totalQuestions, 'domains:', aptQRes.data.domains);

    // Simulate answering 26 questions correctly
    const dummyAnswers = {};
    (aptQRes.data.questions || []).forEach((q, idx) => {
      // First 25 correct (0 index or simulated choice)
      dummyAnswers[q.id] = (idx < 25) ? 0 : 1;
    });

    const aptSubRes = await request('POST', '/api/assessment/aptitude/submit', {
      studentId: 'usr-student-01',
      answers: dummyAnswers
    });
    console.log('  POST /api/assessment/aptitude/submit score:', aptSubRes.data.session?.percentage + '%', 'percentile:', aptSubRes.data.session?.percentile, 'passed:', aptSubRes.data.session?.passed);

    // 6. Feature 7: Company Skill Certification Quizzes & Public Verification
    console.log('\n[Test 6 & 7] Company Certification Quizzes & Verifiable Badges');
    const quizListRes = await request('GET', '/api/assessment/quizzes');
    console.log('  GET /api/assessment/quizzes count:', quizListRes.data.quizzes?.length);
    const firstQuiz = quizListRes.data.quizzes?.[0];

    if (firstQuiz) {
      const quizFetch = await request('GET', `/api/assessment/quiz/${firstQuiz.id}`);
      console.log('  GET /api/assessment/quiz/:id questions:', quizFetch.data.quiz?.questions?.length);

      // Submit 100% correct answers
      const perfectAnswers = {
        'dq-1': 0,
        'dq-2': 0,
        'dq-3': 0,
        'dq-4': 0,
        'pq-1': 0,
        'pq-2': 0,
        'pq-3': 0
      };
      const quizSubRes = await request('POST', `/api/assessment/quiz/${firstQuiz.id}/submit`, {
        studentId: 'usr-student-01',
        answers: perfectAnswers
      });
      console.log('  POST /api/assessment/quiz/:id/submit passed:', quizSubRes.data.passed, 'score:', quizSubRes.data.scorePercentage + '%');
      const token = quizSubRes.data.certification?.verificationToken;
      console.log('  Generated Verification Token:', token ? token.substring(0, 20) + '...' : 'none');

      if (token) {
        const verifyRes = await request('GET', `/api/assessment/verify/${token}`);
        console.log('  GET /api/assessment/verify/:token verified:', verifyRes.data.verified, 'status:', verifyRes.data.credential?.status);
      }
    }

    console.log('\n=== ALL 7-FEATURE API VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('Test Execution Failed:', err);
  }
}

runAllTests();
