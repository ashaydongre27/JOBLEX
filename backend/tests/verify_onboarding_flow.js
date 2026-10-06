/**
 * End-to-End Automated Verification Test: Student Post-Signup Onboarding Flow
 * Problem Statement ID: 26044 / JOBLEX Nexus AI
 */

const assert = require('assert');
const path = require('path');
const express = require('express');

// Import routes
const authRoutes = require('../routes/auth.routes');
const studentRoutes = require('../routes/student.routes');
const DB = require('../data/database');
const { searchColleges } = require('../data/colleges');

async function runOnboardingTests() {
  console.log('🚀 [START] Comprehensive Student Post-Signup Onboarding Verification...\n');

  const app = express();
  app.use(express.json());

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/user', studentRoutes);
  app.use('/api/student', studentRoutes);

  // Mount static / clean url route simulator for /onboarding and /dashboard
  const ROOT_DIR = path.resolve(__dirname, '..', '..');
  app.get('/onboarding', (req, res) => res.sendFile(path.join(ROOT_DIR, 'onboarding.html')));
  app.get('/dashboard', (req, res) => res.sendFile(path.join(ROOT_DIR, 'student.html')));

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Colleges Autocomplete API
    // -------------------------------------------------------------------------
    console.log('🔹 Test 1: Asynchronous Colleges Combobox Autocomplete...');
    const collegeRes = await fetch(`${baseUrl}/api/user/colleges?q=IIT&limit=5`);
    assert.strictEqual(collegeRes.status, 200, 'Colleges search should return 200');
    const collegeData = await collegeRes.json();
    assert.strictEqual(collegeData.success, true, 'Colleges response should be successful');
    assert.ok(Array.isArray(collegeData.colleges), 'Colleges should be an array');
    assert.ok(collegeData.colleges.length > 0, 'Colleges array should not be empty');
    assert.ok(collegeData.colleges[0].name.includes('IIT'), 'First result should match query');
    assert.ok(collegeData.colleges[0].city && collegeData.colleges[0].state, 'College result should include city and state');
    console.log(`  ✓ Found ${collegeData.colleges.length} colleges for query "IIT" (e.g. ${collegeData.colleges[0].name}, ${collegeData.colleges[0].city})`);

    // -------------------------------------------------------------------------
    // TEST 2: Student Registration & Initial Onboarding Flag (Gate Check)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 2: Student Sign-Up & Initial Gate Evaluation...');
    const testEmail = `scholar_${Date.now()}@institute.edu`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ishaan Verma',
        email: testEmail,
        password: 'securepassword123',
        role: 'student',
        institution: 'Indian Institute of Technology Delhi (IIT Delhi)',
        department: 'Computer Science & Engineering'
      })
    });
    assert.strictEqual(regRes.status, 201, 'Student registration should return 201');
    const regData = await regRes.json();
    assert.strictEqual(regData.success, true, 'Registration should succeed');
    assert.strictEqual(regData.user.isOnboardingCompleted, false, 'isOnboardingCompleted MUST be false on student signup');
    assert.strictEqual(regData.user.onboarding_completed, false, 'onboarding_completed MUST be false on student signup');
    const registeredStudentId = regData.user.id;
    console.log(`  ✓ Student registered: ${regData.user.name} (id: ${registeredStudentId})`);
    console.log(`  ✓ Verified gate condition: isOnboardingCompleted = ${regData.user.isOnboardingCompleted} (Forces route to /onboarding)`);

    // -------------------------------------------------------------------------
    // TEST 3: Validation Guard on Incomplete Onboarding Submissions
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 3: Input Validation Guards on /api/user/onboarding...');
    // Missing required fields
    const invalidRes1 = await fetch(`${baseUrl}/api/user/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: registeredStudentId,
        email: testEmail,
        collegeName: '' // Missing
      })
    });
    assert.strictEqual(invalidRes1.status, 400, 'Empty required fields must return 400 Bad Request');
    const invalidData1 = await invalidRes1.json();
    assert.strictEqual(invalidData1.success, false);
    assert.ok(invalidData1.error.includes('Validation error'), 'Error message must specify validation failure');
    console.log(`  ✓ Correctly rejected missing fields: "${invalidData1.error}"`);

    // Missing skills
    const invalidRes2 = await fetch(`${baseUrl}/api/user/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: registeredStudentId,
        email: testEmail,
        collegeName: 'IIT Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        degree: 'B.Tech',
        specialization: 'Computer Science',
        currentSemester: 'Sem 5',
        durationLeft: '2 years',
        skills: [] // Empty skills
      })
    });
    assert.strictEqual(invalidRes2.status, 400, 'Empty skills must return 400 Bad Request');
    console.log('  ✓ Correctly rejected empty skills array');

    // -------------------------------------------------------------------------
    // TEST 4: Full Multi-Step Wizard Submission (Persistence to DB & Schema Match)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 4: Full Multi-Step Wizard Profile Persistence...');
    const fullOnboardingPayload = {
      userId: registeredStudentId,
      email: testEmail,

      // Step 1: Academic Profile & Education Background
      collegeName: 'Indian Institute of Technology Delhi (IIT Delhi)',
      city: 'New Delhi',
      state: 'Delhi',
      degree: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      currentSemester: 'Sem 6',
      durationLeft: '1 year',

      // Step 2: Technical Skills & Career Aspirations
      skills: ['Python', 'React', 'DSA', 'SQL', 'Node.js', 'Machine Learning'],
      skillLevel: 'Intermediate',
      targetRoles: ['SDE 1', 'Full Stack Engineer'],
      preferredCompanyTypes: ['Product Startups', 'FAANG / Tier-1 MNCs'],
      targetCompanies: ['Google', 'Atlassian', 'Stripe'],

      // Step 3: Work Preferences, Availability & Academic History
      preferredLocations: ['Remote', 'Bengaluru', 'Delhi-NCR'],
      willingToRelocate: true,
      availableFrom: '2026-10-01',
      internshipDuration: '6 Months',
      jobAvailabilityType: 'Immediate',

      hasBacklogs: false,
      backlogCount: 0,
      hasPublications: true,
      publications: [
        { title: 'Optimizing Latency in High-Throughput Microservice Meshes', url: 'https://doi.org/10.1145/example' }
      ],
      hasExperience: true,
      experience: [
        { company: 'Apex Cloud Innovations', role: 'Software Engineering Intern', months: 6 }
      ]
    };

    const submitRes = await fetch(`${baseUrl}/api/user/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullOnboardingPayload)
    });
    assert.strictEqual(submitRes.status, 200, 'Valid onboarding submission should return 200');
    const submitData = await submitRes.json();
    assert.strictEqual(submitData.success, true, 'Onboarding submission should succeed');
    assert.strictEqual(submitData.user.isOnboardingCompleted, true, 'User record must update to isOnboardingCompleted: true');
    assert.strictEqual(submitData.user.onboarding_completed, true, 'User record must update to onboarding_completed: true');
    assert.ok(submitData.studentProfile, 'Response must include canonical studentProfile object');
    assert.strictEqual(submitData.studentProfile.collegeName, fullOnboardingPayload.collegeName);
    assert.strictEqual(submitData.studentProfile.skillLevel, 'Intermediate');
    assert.strictEqual(submitData.studentProfile.willingToRelocate, true);
    assert.strictEqual(submitData.studentProfile.publications.length, 1);
    assert.strictEqual(submitData.studentProfile.experience.length, 1);
    console.log(`  ✓ Onboarding successfully persisted to database!`);
    console.log(`  ✓ User state updated: isOnboardingCompleted = ${submitData.user.isOnboardingCompleted}`);

    // -------------------------------------------------------------------------
    // TEST 5: Gate Check Post-Onboarding (Verification)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 5: Post-Onboarding Gate Check (User Can Now Access Dashboard)...');
    const statusRes = await fetch(`${baseUrl}/api/user/onboarding?userId=${registeredStudentId}&email=${testEmail}`);
    assert.strictEqual(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.isOnboardingCompleted, true, 'Status check confirms onboarding completed');
    console.log('  ✓ Verified gate allows direct routing to /dashboard');

    // -------------------------------------------------------------------------
    // TEST 6: Portal Route URLs (/onboarding and /dashboard)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 6: Clean URLs for /onboarding and /dashboard...');
    const onbHtmlRes = await fetch(`${baseUrl}/onboarding`);
    assert.strictEqual(onbHtmlRes.status, 200, '/onboarding must serve clean HTML');
    const onbHtml = await onbHtmlRes.text();
    assert.ok(onbHtml.includes('Complete Your Profile'), 'Onboarding HTML must render wizard interface');
    console.log('  ✓ Clean URL /onboarding serves onboarding wizard');

    const dashHtmlRes = await fetch(`${baseUrl}/dashboard`);
    assert.strictEqual(dashHtmlRes.status, 200, '/dashboard must serve clean dashboard HTML');
    console.log('  ✓ Clean URL /dashboard serves student dashboard');

    // -------------------------------------------------------------------------
    // TEST 7: Boolean String Parsing (Prevent "false" evaluated as true bug)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 7: String Boolean Parsing Guards...');
    const testEmail2 = `scholar_edge_${Date.now()}@institute.edu`;
    const regRes2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Deshmukh',
        email: testEmail2,
        password: 'securepassword123',
        role: 'student'
      })
    });
    const regData2 = await regRes2.json();
    const studentToken2 = regData2.token;

    const boolPayload = {
      userId: regData2.user.id,
      email: testEmail2,
      collegeName: 'BITS Pilani',
      city: 'Pilani',
      state: 'Rajasthan',
      degree: 'B.Tech',
      specialization: 'Computer Science',
      currentSemester: 'Sem 4',
      durationLeft: '2 years',
      skills: ['Python', 'SQL'],
      skillLevel: 'beginner', // lowercase test
      hasBacklogs: 'false',   // string "false"
      backlogCount: '0',
      hasPublications: 'false',
      hasExperience: 'false',
      willingToRelocate: 'true', // string "true"
      jobAvailabilityType: 'Custom Date',
      customAvailDate: '2026-11-15'
    };

    const boolRes = await fetch(`${baseUrl}/api/user/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boolPayload)
    });
    assert.strictEqual(boolRes.status, 200, 'Onboarding with string booleans and lowercase skillLevel should succeed');
    const boolData = await boolRes.json();
    assert.strictEqual(boolData.studentProfile.hasBacklogs, false, 'String "false" must parse to boolean false');
    assert.strictEqual(boolData.studentProfile.backlogCount, 0, 'backlogCount must be 0 when hasBacklogs is false');
    assert.strictEqual(boolData.studentProfile.hasPublications, false, 'String "false" must parse to boolean false');
    assert.strictEqual(boolData.studentProfile.hasExperience, false, 'String "false" must parse to boolean false');
    assert.strictEqual(boolData.studentProfile.willingToRelocate, true, 'String "true" must parse to boolean true');
    assert.strictEqual(boolData.studentProfile.skillLevel, 'Beginner', 'Lowercase "beginner" must normalize to "Beginner"');
    assert.strictEqual(boolData.studentProfile.jobAvailabilityType, 'Custom Date', 'jobAvailabilityType must remain Custom Date');
    assert.strictEqual(boolData.studentProfile.availableFrom, '2026-11-15', 'availableFrom must capture custom date');
    console.log('  ✓ String booleans safely parsed to real booleans');
    console.log('  ✓ Case-insensitive skill level normalized to "Beginner"');
    console.log('  ✓ Custom Date availability correctly structured');

    // -------------------------------------------------------------------------
    // TEST 8: Token-Only Authentication (Omitted userId and email in body)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 8: Bearer Token User Resolution (Body Omits userId/email)...');
    const tokenOnlyPayload = {
      collegeName: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
      city: 'Tiruchirappalli',
      state: 'Tamil Nadu',
      degree: 'B.Tech',
      specialization: 'Information Technology',
      currentSemester: 'Sem 6',
      durationLeft: '1 year',
      skills: ['React', 'JavaScript', 'Node.js'],
      skillLevel: 'ADVANCED',
      hasExperience: true,
      experience: [
        { company: 'TechLabs', role: 'Frontend Engineer', months: '5' }
      ]
    };

    const tokenRes = await fetch(`${baseUrl}/api/user/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken2}`
      },
      body: JSON.stringify(tokenOnlyPayload)
    });
    assert.strictEqual(tokenRes.status, 200, 'Should authenticate via Bearer token when userId omitted');
    const tokenData = await tokenRes.json();
    assert.strictEqual(tokenData.studentProfile.userId, regData2.user.id, 'Resolved userId must match token owner');
    assert.strictEqual(tokenData.studentProfile.skillLevel, 'Advanced', 'Uppercase "ADVANCED" must normalize to "Advanced"');
    assert.strictEqual(typeof tokenData.studentProfile.experience[0].months, 'number', 'Experience months must be integer');
    assert.strictEqual(tokenData.studentProfile.experience[0].months, 5);
    console.log('  ✓ Successfully resolved user from Bearer authorization header');
    console.log('  ✓ Experience months correctly coerced to integer');

    // -------------------------------------------------------------------------
    // TEST 9: Status Check via Bearer Token Header Only
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 9: Status Check via Bearer Token...');
    const headerStatusRes = await fetch(`${baseUrl}/api/user/onboarding`, {
      headers: { 'Authorization': `Bearer ${studentToken2}` }
    });
    assert.strictEqual(headerStatusRes.status, 200);
    const headerStatusData = await headerStatusRes.json();
    assert.strictEqual(headerStatusData.isOnboardingCompleted, true);
    console.log('  ✓ Status retrieved correctly using Bearer token without query params');

    console.log('\n🎉 ALL 9 COMPREHENSIVE ONBOARDING SPECIFICATION TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runOnboardingTests();
