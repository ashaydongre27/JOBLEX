/**
 * End-to-End Cross-Portal Connectivity & Workflow Verification Test
 * Tests live integration across Student, Academy, and Industry portals on http://localhost:5000
 */

const assert = require('assert');
const app = require('../server');

let BASE_URL = 'http://localhost:5000';
let server;

async function runTests() {
  // Try connecting or start local server instance
  try {
    await fetch(`${BASE_URL}/api/health`);
  } catch (e) {
    server = app.listen(0);
    const port = server.address().port;
    BASE_URL = `http://localhost:${port}`;
  }

  console.log('====================================================');
  console.log('STARTING CROSS-PORTAL CONNECTIVITY E2E TEST SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  // Test 0: Health & Root Endpoints
  console.log('--- Test 0: Portal Health & Root Endpoints ---');
  const healthRes = await fetch(`${BASE_URL}/api/opportunities`);
  assert.strictEqual(healthRes.status, 200, `Expected 200 from /api/opportunities, got ${healthRes.status}`);
  const oppsData = await healthRes.json();
  assert(Array.isArray(oppsData.opportunities), 'Expected opportunities array');
  console.log(`✓ Base API is alive. Found ${oppsData.opportunities.length} active opportunities.\n`);

  // Loop 1: Student Applies -> Industry Recruiter Notified -> Status Updated -> Student Notified + ToDo
  console.log('--- Loop 1: Student Application & Industry Recruiter Pipeline ---');
  const testStudentEmail = `ayush.scholar.${Date.now()}@aiia.gov.in`;
  const testStudentName = 'Vaidya Ananya Sharma';
  const testOppTitle = 'Phytochemical Research Intern';

  const applyRes = await fetch(`${BASE_URL}/api/opportunities/apply`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-usr-student-01'
    },
    body: JSON.stringify({
      opportunityId: 'opp-1',
      opportunityTitle: testOppTitle,
      company: 'Dabur India Ltd.',
      type: 'Internship',
      studentName: testStudentName,
      studentEmail: testStudentEmail,
      college: 'All India Institute of Ayurveda',
      skills: ['Herbal Formulation', 'GLP', 'HPTLC'],
      match: 94,
      coverNote: 'E2E automated integration application test.'
    })
  });
  assert.strictEqual(applyRes.status, 201, `Failed to submit application: ${applyRes.status}`);
  const applyData = await applyRes.json();
  assert(applyData.success, 'Apply should return success: true');
  const appId = applyData.application.id;
  console.log(`✓ Student successfully applied. Application ID: ${appId}`);

  // Check Recruiter Notification
  const recruiterNotifRes = await fetch(`${BASE_URL}/api/notifications?recipientId=usr-industry-01`);
  assert.strictEqual(recruiterNotifRes.status, 200);
  const recruiterNotifs = await recruiterNotifRes.json();
  const recruiterNotice = (recruiterNotifs.notifications || []).find(n => n.message && n.message.includes(testStudentName));
  assert(recruiterNotice, `Expected recruiter notification for ${testStudentName}`);
  console.log(`✓ Recruiter received real-time notification: "${recruiterNotice.title}"`);

  // Recruiter updates status to Interview Scheduled
  const interviewSlotTime = '2026-09-15 11:30 AM IST';
  const statusRes = await fetch(`${BASE_URL}/api/industry/applications/${appId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'Interview Scheduled',
      interviewSlot: interviewSlotTime
    })
  });
  assert.strictEqual(statusRes.status, 200);
  const statusData = await statusRes.json();
  assert(statusData.success, 'Status update failed');
  console.log(`✓ Recruiter scheduled interview for slot: ${interviewSlotTime}`);

  // Check Student Notification
  const studentNotifRes = await fetch(`${BASE_URL}/api/notifications?userId=${encodeURIComponent(testStudentEmail)}`);
  assert.strictEqual(studentNotifRes.status, 200);
  const studentNotifs = await studentNotifRes.json();
  const studentStatusNotice = (studentNotifs.notifications || []).find(n => n.title && n.title.includes('Interview Scheduled'));
  assert(studentStatusNotice, 'Student should receive Interview Scheduled notification');
  console.log(`✓ Student received notification: "${studentStatusNotice.title}"`);

  // Check Student Contextual To-Do Injected
  const todoRes = await fetch(`${BASE_URL}/api/todos?studentId=${encodeURIComponent(testStudentEmail)}`);
  assert.strictEqual(todoRes.status, 200);
  const todoData = await todoRes.json();
  const interviewTodo = (todoData.todos || []).find(t => t.sourceType === 'system_interview' && t.sourceRefId === appId);
  assert(interviewTodo, 'Student should have an auto-injected interview preparation To-Do task');
  console.log(`✓ Contextual To-Do auto-injected into student backlog: "${interviewTodo.title}" (Priority: ${interviewTodo.priority})\n`);

  // Loop 2: Reverse Talent Search / Inbound Direct Invite
  console.log('--- Loop 2: Reverse Talent Search & Direct Inbound Invite ---');
  const candidateId = `usr-cand-${Date.now()}`;
  const inviteRes = await fetch(`${BASE_URL}/api/industry/inbound-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidateId: candidateId,
      candidateName: 'Rohan Deshmukh',
      roleTitle: 'Ayurvedic Clinical Trial Coordinator',
      company: 'Himalaya Wellness',
      slotTime: '2026-09-20 02:00 PM'
    })
  });
  assert.strictEqual(inviteRes.status, 200);
  const inviteData = await inviteRes.json();
  assert(inviteData.success, 'Invite should return success');

  // Verify candidate notification
  const candNotifRes = await fetch(`${BASE_URL}/api/notifications?userId=${candidateId}`);
  const candNotifs = await candNotifRes.json();
  const inviteNotice = (candNotifs.notifications || []).find(n => n.category === 'interview_invite');
  assert(inviteNotice, 'Candidate should have interview_invite notification');
  console.log(`✓ Inbound invite received by candidate: "${inviteNotice.title}"`);

  // Verify candidate To-Do
  const candTodoRes = await fetch(`${BASE_URL}/api/todos?studentId=${candidateId}`);
  const candTodos = await candTodoRes.json();
  const inviteTodo = (candTodos.todos || []).find(t => t.sourceType === 'system_interview');
  assert(inviteTodo, 'Candidate should have auto-injected To-Do for inbound interview');
  console.log(`✓ Candidate To-Do injected: "${inviteTodo.title}"\n`);

  // Loop 3: Industry Posts Opportunity -> Student Feed Sync
  console.log('--- Loop 3: Industry Opportunity Publication & Feed Sync ---');
  const newOppRes = await fetch(`${BASE_URL}/api/industry/opportunities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Senior AYUSH Phytochemistry Analyst',
      company: 'Baidyanath Research Labs',
      type: 'Full-time Job',
      skills: ['HPTLC', 'Pharmacognosy', 'Standardization'],
      location: 'Kolkata, WB',
      stipend: '₹7.5 - 9.0 LPA',
      deadline: '2026-12-31',
      description: 'End-to-end QC and monograph publication role.'
    })
  });
  assert.strictEqual(newOppRes.status, 201);
  const newOppData = await newOppRes.json();
  assert(newOppData.success, 'Failed to create opportunity');
  const createdOppId = newOppData.opportunity.id;
  console.log(`✓ Opportunity posted by Industry: ID ${createdOppId}`);

  // Fetch opportunities from student viewpoint
  const allOppsRes = await fetch(`${BASE_URL}/api/opportunities`);
  const allOppsData = await allOppsRes.json();
  const syncedOpp = (allOppsData.opportunities || []).find(o => o.id === createdOppId || o.title === 'Senior AYUSH Phytochemistry Analyst');
  assert(syncedOpp, 'Posted opportunity must appear in public opportunities list');
  console.log(`✓ Opportunity synced and visible in student discovery feed: "${syncedOpp.title}" at ${syncedOpp.company}\n`);

  // Loop 4: Industry Tech Stack Disclosure -> Academy Tech Radar & Gap Analysis
  console.log('--- Loop 4: Industry Tech Stack Disclosure & Academy Tech Radar ---');
  const techStackRes = await fetch(`${BASE_URL}/api/industry/tech-stack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId: 'usr-industry-01',
      companyName: 'Dabur India Ltd.',
      sector: 'Ayurvedic Phytopharmaceuticals',
      techCategory: 'Computational Pharmacognosy',
      techName: 'In-Silico Target Fishing & Molecular Docking',
      proficiencyDemandLevel: 'Advanced',
      adoptionStage: 'Production',
      curriculumRelevanceNote: 'High demand for computational screening of bioactives'
    })
  });
  assert.strictEqual(techStackRes.status, 201);
  const techStackData = await techStackRes.json();
  assert(techStackData.success, 'Tech stack creation failed');
  console.log(`✓ Industry tech stack registered: "${techStackData.techStack.techName}"`);

  // Check University Dean notification
  const deanNotifRes = await fetch(`${BASE_URL}/api/notifications?userId=usr-academy-01`);
  const deanNotifs = await deanNotifRes.json();
  const techNotice = (deanNotifs.notifications || []).find(n => n.title.includes('Tech Stack Published'));
  assert(techNotice, 'University Dean should receive Tech Stack publication notification');
  console.log(`✓ Dean notified of industrial technology shift: "${techNotice.message}"`);

  // Check Academy Tech Radar Endpoint
  const radarRes = await fetch(`${BASE_URL}/api/academy/tech-radar`);
  assert.strictEqual(radarRes.status, 200);
  const radarData = await radarRes.json();
  assert(radarData.success && radarData.totalDisclosures > 0, 'Tech radar should reflect disclosures');
  console.log(`✓ Academy Tech Radar updated: ${radarData.totalDisclosures} disclosures across ${radarData.sectors.length} sectors with ${radarData.curriculumGaps.length} mapped curriculum gaps.\n`);

  // Loop 5: Industry Proposes Workshop -> Academy Dean Sanctions -> Student RSVPs + To-Do
  console.log('--- Loop 5: Virtual Masterclass Lifecycle (Propose -> Sanction -> RSVP) ---');
  const proposeRes = await fetch(`${BASE_URL}/api/industry/workshops/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hostCompanyId: 'usr-industry-01',
      hostCompanyName: 'Dabur India Ltd.',
      speakerName: 'Dr. C. K. Katiyar',
      speakerDesignation: 'Global Head of R&D',
      title: 'Modern Chromatographic Markers in Herbal Standardization',
      description: 'Hands-on live masterclass detailing HPTLC and HPLC validation protocols.',
      targetDepartments: ['Ayurvedic Sciences', 'Pharmacognosy'],
      scheduledStart: '2026-10-10T14:00:00Z',
      durationMinutes: 120,
      meetingLink: 'https://joblex.aiia.gov.in/masterclass/chromatography-2026',
      maxSeats: 150
    })
  });
  assert.strictEqual(proposeRes.status, 201);
  const proposeData = await proposeRes.json();
  assert(proposeData.success, 'Failed to propose workshop');
  const wspId = proposeData.workshop.id;
  console.log(`✓ Workshop proposed by Industry: ID ${wspId}`);

  // Dean approves proposal
  const sanctionRes = await fetch(`${BASE_URL}/api/academy/workshops/${wspId}/decision`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision: 'Approved',
      notes: 'Sanctioned under Continuing Ayush Medical Education initiative.'
    })
  });
  assert.strictEqual(sanctionRes.status, 200);
  const sanctionData = await sanctionRes.json();
  assert(sanctionData.success, 'Sanction failed');
  console.log(`✓ Academic Dean sanctioned workshop: status "${sanctionData.workshop.status}"`);

  // Student RSVPs
  const rsvpStudentId = `usr-student-${Date.now()}`;
  const rsvpRes = await fetch(`${BASE_URL}/api/assessment/workshops/${wspId}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: rsvpStudentId,
      studentName: 'Aarav Sharma'
    })
  });
  assert.strictEqual(rsvpRes.status, 200);
  const rsvpData = await rsvpRes.json();
  assert(rsvpData.success, 'RSVP failed');
  assert.strictEqual(rsvpData.workshop.enrolledCount, 1, 'Enrolled count should increment to 1');
  console.log(`✓ Student RSVP completed. Enrolled count: ${rsvpData.workshop.enrolledCount}`);

  // Verify attendance To-Do injected into student backlog
  const studentWspTodosRes = await fetch(`${BASE_URL}/api/todos?studentId=${rsvpStudentId}`);
  const studentWspTodos = await studentWspTodosRes.json();
  const wspTodo = (studentWspTodos.todos || []).find(t => t.sourceRefId === wspId);
  assert(wspTodo, 'Student should receive calendar attendance reminder To-Do');
  console.log(`✓ Calendar reminder To-Do injected into student To-Do list: "${wspTodo.title}"\n`);

  // Loop 6: Student Quiz Assessment -> SHA-256 HMAC Credential -> Public Verification
  console.log('--- Loop 6: Skill Certification & Cryptographic Credential Verification ---');
  // 1. Fetch available quizzes
  const quizzesRes = await fetch(`${BASE_URL}/api/assessment/quizzes?studentId=${rsvpStudentId}`);
  assert.strictEqual(quizzesRes.status, 200);
  const quizzesData = await quizzesRes.json();
  assert(quizzesData.quizzes && quizzesData.quizzes.length > 0, 'Should have company quizzes available');
  const targetQuiz = quizzesData.quizzes[0];
  console.log(`✓ Fetched active quizzes. Selected: "${targetQuiz.badgeTitle}" (${targetQuiz.companyName})`);

  // 2. Fetch full quiz details for taking
  const quizDetailRes = await fetch(`${BASE_URL}/api/assessment/quiz/${targetQuiz.id}`);
  assert.strictEqual(quizDetailRes.status, 200);
  const quizDetail = await quizDetailRes.json();
  assert(quizDetail.quiz && quizDetail.quiz.questions.length > 0, 'Quiz must have questions');

  // Submit passing answers (all questions in quiz-dabur-01 have correctIndex: 0)
  const passAnswers = {};
  quizDetail.quiz.questions.forEach(q => {
    passAnswers[q.id] = 0;
  });

  const submitQuizRes = await fetch(`${BASE_URL}/api/assessment/quiz/${targetQuiz.id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: rsvpStudentId,
      studentName: 'Aarav Sharma',
      answers: passAnswers
    })
  });
  assert.strictEqual(submitQuizRes.status, 200);
  const submitQuizData = await submitQuizRes.json();
  assert(submitQuizData.passed, `Expected quiz to pass, got: ${JSON.stringify(submitQuizData)}`);
  const certToken = submitQuizData.verificationToken || (submitQuizData.certificate ? submitQuizData.certificate.verificationToken : (submitQuizData.certification ? submitQuizData.certification.verificationToken : null));
  assert(certToken, 'Expected certificate verification token');
  console.log(`✓ Quiz passed with ${submitQuizData.scorePercentage}%! Earned Badge: "${(submitQuizData.certificate || submitQuizData.certification).badgeTitle}"`);
  console.log(`✓ Generated SHA-256 HMAC Token: ${certToken}`);

  // 3. Public Verification Endpoint
  const verifyRes = await fetch(`${BASE_URL}/api/assessment/verify/${certToken}`);
  assert.strictEqual(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert(verifyData.verified, 'Token should be verified');
  assert.strictEqual(verifyData.credential.badgeTitle, targetQuiz.badgeTitle);
  console.log(`✓ Public Verification Confirmed!`);
  console.log(`  Recipient: ${verifyData.credential.recipientName}`);
  console.log(`  Issuer:    ${verifyData.credential.issuingOrganization}`);
  console.log(`  Score:     ${verifyData.credential.scoreAttained}`);
  console.log(`  Status:    ${verifyData.credential.status}\n`);

  console.log('====================================================');
  console.log('ALL 6 CROSS-PORTAL CONNECTIVITY LOOPS PASSED 100%!');
  console.log('====================================================');
  if (server) server.close();
}

runTests().catch(err => {
  if (server) server.close();
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
