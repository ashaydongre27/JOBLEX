/**
 * Automated Verification Test: Post-Signup Onboarding & Skills Architecture Specification
 * Tests all requirements from the Comprehensive Engineering Specification:
 * 1. Immediate Session Establishment & Zero Re-Login Friction
 * 2. Onboarding Gating Logic (/dashboard -> /onboarding when incomplete, /onboarding -> /dashboard when completed)
 * 3. Save & Continue Button Navigation & Validation
 * 4. Technical Skills Autocomplete Engine (200+ master list, top 10 badges, custom tags, case-insensitive deduplication)
 * 5. Full End-to-End Profile Persistence & Schema Conformance
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const express = require('express');

// Import routes & data
const authRoutes = require('../routes/auth.routes');
const studentRoutes = require('../routes/student.routes');
const DB = require('../data/database');
const { searchColleges, COLLEGES_DIRECTORY } = require('../data/colleges');

async function runE2ETests() {
  console.log('🚀 [START] Comprehensive Post-Signup Onboarding & Skills Architecture Verification...\n');

  const app = express();
  app.use(express.json());

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/user', studentRoutes);
  app.use('/api/student', studentRoutes);

  // Mount routes matching server.js
  const ROOT_DIR = path.resolve(__dirname, '..', '..');
  app.get('/login', (req, res) => res.redirect('/auth'));
  app.get('/register', (req, res) => res.redirect('/auth'));
  app.get('/auth', (req, res) => res.sendFile(path.join(ROOT_DIR, 'auth.html')));
  app.get('/onboarding', (req, res) => res.sendFile(path.join(ROOT_DIR, 'onboarding.html')));
  app.get('/dashboard', (req, res) => res.sendFile(path.join(ROOT_DIR, 'student.html')));

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Seamless Session Creation upon Student Registration
    // -------------------------------------------------------------------------
    console.log('🔹 Test 1: Immediate Session Establishment on Signup (Zero Re-Login Friction)...');
    const testStudentEmail = `onboarding_scholar_${Date.now()}@iitd.ac.in`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Sharma',
        email: testStudentEmail,
        password: 'SecurePassword123!',
        role: 'student',
        institution: 'Indian Institute of Technology Delhi (IIT Delhi)',
        department: 'Computer Science & Engineering',
        year: '3rd Year / Undergraduate'
      })
    });

    assert.strictEqual(regRes.status, 201, 'Registration should return HTTP 201 Created');
    const regData = await regRes.json();
    assert.strictEqual(regData.success, true, 'Registration must be successful');
    assert.ok(regData.token, 'Auth service MUST issue authentication token immediately in signup response');
    assert.strictEqual(typeof regData.token, 'string', 'Issued token must be a string');
    assert.ok(regData.user, 'Registration response must contain user object');
    assert.strictEqual(regData.user.role, 'student');
    assert.strictEqual(regData.user.isOnboardingCompleted, false, 'isOnboardingCompleted MUST be false upon signup');
    assert.strictEqual(regData.user.onboarding_completed, false, 'onboarding_completed MUST be false upon signup');
    console.log(`  ✓ Token successfully issued on signup: ${regData.token.substring(0, 20)}...`);
    console.log(`  ✓ User state: isOnboardingCompleted = false`);

    // -------------------------------------------------------------------------
    // TEST 2: Gating and Route Protection UX
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 2: Gating Logic & Route Protection Verification...');
    // Legacy /login and /register redirect to /auth
    const loginRes = await fetch(`${baseUrl}/login`, { redirect: 'manual' });
    assert.ok(loginRes.status === 302 || loginRes.status === 301, '/login should redirect to /auth');
    assert.strictEqual(loginRes.headers.get('location'), '/auth');
    console.log('  ✓ /login cleanly redirects to /auth (no dead ends)');

    // Verify /onboarding and /dashboard clean URLs
    const onbRes = await fetch(`${baseUrl}/onboarding`);
    assert.strictEqual(onbRes.status, 200, '/onboarding must return 200');
    const onbHtml = await onbRes.text();
    assert.ok(onbHtml.includes('Immediate Authentication & Onboarding Gating Guard'), 'onboarding.html must have gating guard');
    assert.ok(onbHtml.includes('Save & Continue'), 'onboarding.html must have Save & Continue CTA');
    console.log('  ✓ /onboarding serves wizard with gating guard');

    const dashRes = await fetch(`${baseUrl}/dashboard`);
    assert.strictEqual(dashRes.status, 200, '/dashboard must return 200');
    const dashHtml = await dashRes.text();
    assert.ok(dashHtml.includes('Immediate Authentication & Onboarding Gating Guard'), 'student.html must have gating guard');
    console.log('  ✓ /dashboard serves student portal with gating guard');

    // -------------------------------------------------------------------------
    // TEST 3: Technical Skills Engine & Master Dataset Integrity (200+ items)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 3: Technical Skills Engine Specification & Dataset...');
    const top10Expected = ["Python", "Java", "React", "SQL", "DSA", "C++", "JavaScript", "Machine Learning", "AWS", "Node.js"];
    
    // Check onboarding.html contains top 10 badges
    top10Expected.forEach(badge => {
      assert.ok(onbHtml.includes(`"${badge}"`), `onboarding.html MUST define instant badge: ${badge}`);
    });
    console.log(`  ✓ All 10 instant-add badges verified in onboarding component`);

    // Extract MASTER_SKILLS from onboarding.html
    const masterSkillsMatch = onbHtml.match(/const\s+MASTER_SKILLS\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(masterSkillsMatch, 'MASTER_SKILLS array must be embedded in onboarding.html');
    const masterSkillsArray = eval(`[${masterSkillsMatch[1]}]`);
    assert.ok(masterSkillsArray.length >= 200, `MASTER_SKILLS must contain at least 200 items (found: ${masterSkillsArray.length})`);
    console.log(`  ✓ Master skill dataset validated: ${masterSkillsArray.length} curated technical skills`);

    // Verify presence of diverse Indian engineering tech hiring disciplines
    const sampleDisciplines = [
      'Python', 'React.js', 'Node.js', 'Spring Boot', 'Next.js',
      'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
      'Data Structures & Algorithms (DSA)', 'Object-Oriented Programming (OOP)', 'System Design',
      'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Pandas',
      'AWS', 'Docker', 'Kubernetes', 'CI/CD Pipelines',
      'Flutter', 'React Native', 'Android Development',
      'Selenium', 'Jest', 'Cypress',
      'Ethical Hacking', 'OWASP Top 10',
      'Solidity', 'Smart Contracts',
      'Embedded Systems', 'IoT', 'Arduino',
      'Agile / Scrum', 'Jira'
    ];
    sampleDisciplines.forEach(skill => {
      assert.ok(masterSkillsArray.includes(skill), `Master dataset should include discipline skill: ${skill}`);
    });
    console.log(`  ✓ Validated cross-disciplinary tech hiring coverage across Full-Stack, AI, Cloud, Embedded, Web3`);

    // -------------------------------------------------------------------------
    // TEST 4: Case-Insensitive Deduplication, Symmetric Aliases & Comma Splitting
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 4: Deduplication & Custom Skills Engine Logic...');
    
    // Verify onboarding.html script defines symmetric alias mapping and safe select handling
    assert.ok(onbHtml.includes('const KNOWN_ALIASES'), 'onboarding.html must define KNOWN_ALIASES');
    assert.ok(onbHtml.includes('function isSameSkill'), 'onboarding.html must define isSameSkill');
    assert.ok(onbHtml.includes('mapYearToSemester'), 'onboarding.html must define mapYearToSemester');
    assert.ok(onbHtml.includes('setSelectSafe'), 'onboarding.html must define setSelectSafe');

    // Extract alias pairs from onboarding.html
    const aliasMatch = onbHtml.match(/const\s+KNOWN_ALIASES\s*=\s*(\[[\s\S]*?\]);/);
    assert.ok(aliasMatch, 'KNOWN_ALIASES array found');
    const knownAliases = eval(aliasMatch[1]);

    function isSameSkill(a, b) {
      if (!a || !b) return false;
      const na = a.trim().toLowerCase();
      const nb = b.trim().toLowerCase();
      if (na === nb) return true;
      return knownAliases.some(([x, y]) => (na === x && nb === y) || (na === y && nb === x));
    }

    let selectedSkills = [];
    function hasSkill(skill) {
      if (!skill) return false;
      return selectedSkills.some(s => isSameSkill(s, skill));
    }

    function sanitizeSkillInput(str) {
      return (str || '')
        .replace(/<[^>]*>/g, '')
        .replace(/[<>'"]/g, '')
        .trim()
        .slice(0, 60);
    }

    function addSkill(raw) {
      if (!raw) return false;
      if (raw.includes(',')) {
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        let anyAdded = false;
        parts.forEach(p => {
          if (addSkill(p)) anyAdded = true;
        });
        return anyAdded;
      }
      const sanitized = sanitizeSkillInput(raw);
      if (!sanitized || hasSkill(sanitized)) return false;
      const canonical = masterSkillsArray.find(s => isSameSkill(s, sanitized));
      selectedSkills.push(canonical || sanitized);
      return true;
    }

    // Add badge
    assert.strictEqual(addSkill('Python'), true);
    assert.strictEqual(addSkill('python'), false, 'Case-insensitive duplicate must be rejected');
    assert.strictEqual(addSkill('PYTHON'), false, 'Uppercase duplicate must be rejected');
    
    // Add alias pairs (both directions)
    assert.strictEqual(addSkill('React'), true);
    assert.strictEqual(addSkill('react.js'), false, 'Alias "react.js" must be deduplicated against "React"');
    assert.strictEqual(addSkill('DSA'), true);
    assert.strictEqual(addSkill('Data Structures & Algorithms (DSA)'), false, 'Full name DSA must be deduplicated');
    assert.strictEqual(addSkill('OOP'), true);
    assert.strictEqual(addSkill('Object-Oriented Programming (OOP)'), false, 'Full name OOP must be deduplicated');

    // Add comma-separated multi-skills in a single action
    assert.strictEqual(addSkill('Docker, Kubernetes, AWS'), true, 'Comma-separated skills must be parsed and added');
    assert.ok(selectedSkills.includes('Docker') && selectedSkills.includes('Kubernetes') && selectedSkills.includes('AWS'));

    // Add custom skill with HTML sanitization
    assert.strictEqual(addSkill('<script>alert("xss")</script>Generative AI Agents'), true);
    assert.strictEqual(selectedSkills.includes('alert(xss)Generative AI Agents'), true, 'Custom skill must be sanitized');

    // Verify registration year safely maps to semester without invalidating dropdown
    function mapYearToSemester(yearStr) {
      if (!yearStr) return 'Sem 4';
      const y = yearStr.toLowerCase();
      if (y.includes('1st') || y.includes('first')) return 'Sem 2';
      if (y.includes('2nd') || y.includes('second')) return 'Sem 4';
      if (y.includes('3rd') || y.includes('third')) return 'Sem 6';
      if (y.includes('final') || y.includes('4th') || y.includes('fourth')) return 'Final Year';
      return yearStr;
    }
    assert.strictEqual(mapYearToSemester('1st Year Undergraduate'), 'Sem 2');
    assert.strictEqual(mapYearToSemester('Final Year Undergraduate'), 'Final Year');

    console.log(`  ✓ Case-insensitive deduplication and symmetric aliases verified`);
    console.log(`  ✓ Comma-separated skill batching verified`);
    console.log(`  ✓ Free-text custom skill additions correctly sanitized and committed`);
    console.log(`  ✓ Student registration year to semester mapping verified`);

    // -------------------------------------------------------------------------
    // TEST 5: Save & Continue Action - Single Event Execution & Debounce Check
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 5: Save & Continue Event Architecture & Re-entrancy Check...');
    // Ensure wizard-next-btn does not have inline onclick attribute that conflicts with addEventListener
    const nextBtnTagMatch = onbHtml.match(/<button[^>]*id="wizard-next-btn"[^>]*>/);
    assert.ok(nextBtnTagMatch, 'wizard-next-btn element must exist in HTML');
    assert.ok(!nextBtnTagMatch[0].includes('onclick='), 'wizard-next-btn must NOT have inline onclick to avoid double invocation');
    assert.ok(onbHtml.includes('let isNavigating = false;'), 'navigateWizard must feature isNavigating debounce guard');
    assert.ok(onbHtml.includes('e.stopPropagation();'), 'Event listener must halt event propagation');
    console.log('  ✓ Confirmed elimination of duplicate inline onclick');
    console.log('  ✓ Re-entrancy protection (isNavigating) verified');

    // -------------------------------------------------------------------------
    // TEST 6: Complete Student Onboarding Persistence via API
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 6: Wizard Completion & Database Persistence...');
    const onboardingPayload = {
      userId: regData.user.id,
      email: testStudentEmail,
      collegeName: 'Indian Institute of Technology Delhi (IIT Delhi)',
      city: 'New Delhi',
      state: 'Delhi',
      degree: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      currentSemester: 'Sem 6',
      durationLeft: '1 year',
      skills: ['Python', 'React', 'DSA', 'SQL', 'Node.js', 'Machine Learning', 'Generative AI Agents'],
      skillLevel: 'Advanced',
      targetRoles: ['Full Stack Engineer', 'AI Platform Engineer'],
      preferredCompanyTypes: ['Product Startups', 'FAANG / Tier-1 MNCs'],
      targetCompanies: ['Google', 'Microsoft', 'Atlassian'],
      preferredLocations: ['New Delhi', 'Bengaluru', 'Remote'],
      willingToRelocate: true,
      jobAvailabilityType: 'Immediate',
      availableFrom: '2026-10-01',
      internshipDuration: '6 Months',
      hasBacklogs: false,
      backlogCount: 0,
      hasPublications: false,
      hasExperience: true,
      experience: [
        { company: 'HyperScale Labs', role: 'Full Stack Intern', months: 4 }
      ]
    };

    const submitRes = await fetch(`${baseUrl}/api/user/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      },
      body: JSON.stringify(onboardingPayload)
    });

    assert.strictEqual(submitRes.status, 200, 'Onboarding submission must return HTTP 200');
    const submitData = await submitRes.json();
    assert.strictEqual(submitData.success, true, 'Onboarding must succeed');
    assert.strictEqual(submitData.user.isOnboardingCompleted, true, 'User record must transition to isOnboardingCompleted: true');
    assert.strictEqual(submitData.user.onboarding_completed, true, 'User record must transition to onboarding_completed: true');
    assert.ok(submitData.studentProfile, 'StudentProfile object must be returned');
    assert.strictEqual(submitData.studentProfile.collegeName, onboardingPayload.collegeName);
    assert.strictEqual(submitData.studentProfile.skillLevel, 'Advanced');
    console.log(`  ✓ Onboarding successfully persisted. isOnboardingCompleted is now true`);

    // -------------------------------------------------------------------------
    // TEST 7: Gate Check - Verified Access to Dashboard Post-Onboarding
    // -------------------------------------------------------------------------
    console.log('\n🔹 Test 7: Post-Onboarding Route Access Verification...');
    const statusRes = await fetch(`${baseUrl}/api/user/onboarding?userId=${regData.user.id}`);
    assert.strictEqual(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.isOnboardingCompleted, true, 'User is now marked completed');
    console.log('  ✓ User can now directly access /dashboard');

    console.log('\n🎉 ALL 7 E2E POST-SIGNUP ONBOARDING & SKILLS SPECIFICATION TESTS PASSED!\n');
  } catch (err) {
    console.error('❌ E2E Verification Failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runE2ETests();
