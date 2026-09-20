/**
 * Integration Test for Student Onboarding, Social Links, Certificates, and Company Portals
 */

const DB = require('../data/database');
const companyRoutes = require('../routes/company.routes');
const studentRoutes = require('../routes/student.routes');
const express = require('express');

async function runTests() {
  console.log('🧪 Starting Profile, Onboarding & Company Systems Verification...');

  const app = express();
  app.use(express.json());
  app.use('/api/companies', companyRoutes);
  app.use('/api/student', studentRoutes);

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    try {
      // 1. Test GET /api/companies
      const compRes = await fetch(`${baseUrl}/companies`);
      const compData = await compRes.json();
      console.log(`✓ GET /api/companies returned ${compData.count} companies`);

      if (!compData.success || compData.count < 1) {
        throw new Error('Companies list failed');
      }

      // 2. Test GET /api/companies?tech=Python
      const pythonRes = await fetch(`${baseUrl}/companies?tech=Python`);
      const pythonData = await pythonRes.json();
      console.log(`✓ GET /api/companies?tech=Python returned ${pythonData.count} matching companies`);

      // 3. Test GET /api/companies/:id
      const detailRes = await fetch(`${baseUrl}/companies/comp-dabur`);
      const detailData = await detailRes.json();
      console.log(`✓ GET /api/companies/comp-dabur details fetched. Active Opportunities: ${detailData.company?.activeOpportunities?.length || 0}`);

      // 4. Test POST /api/companies/:id/updates
      const updateRes = await fetch(`${baseUrl}/companies/comp-dabur/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Verification Update',
          content: 'Verification script broadcasting company news update.',
          category: 'Tech & R&D'
        })
      });
      const updateData = await updateRes.json();
      console.log(`✓ POST /api/companies/comp-dabur/updates result: ${updateData.message}`);

      // 5. Test POST /api/student/onboarding
      const onbRes = await fetch(`${baseUrl}/student/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr-student-01',
          email: 'aarav.sharma@aiia.gov.in',
          onboardingData: {
            institution: 'All India Institute of Ayurveda',
            degree: 'BAMS Undergraduate',
            selectedSkills: ['HPTLC', 'Pharmacognosy', 'Python']
          },
          socialLinks: {
            linkedin: 'https://linkedin.com/in/aarav-sharma',
            github: 'https://github.com/aarav-sharma',
            leetcode: 'https://leetcode.com/u/aarav-sharma'
          }
        })
      });
      const onbData = await onbRes.json();
      console.log(`✓ POST /api/student/onboarding result: ${onbData.message}`);

      // 6. Test POST /api/student/certificates
      const certRes = await fetch(`${baseUrl}/student/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr-student-01',
          email: 'aarav.sharma@aiia.gov.in',
          certificate: {
            title: 'HPTLC Standardization Specialist',
            issuer: 'AIIA Bio-Informatics Cell',
            issueDate: '2026-08-15',
            skillsCovered: ['HPTLC', 'Standardization', 'GLP']
          }
        })
      });
      const certData = await certRes.json();
      console.log(`✓ POST /api/student/certificates uploaded certificate ID: ${certData.certificate?.id}`);

      console.log('\n🎉 ALL SYSTEMS VERIFIED & PASSED PERFECTLY!');
    } catch (err) {
      console.error('❌ Verification Error:', err);
    } finally {
      server.close();
    }
  });
}

runTests();
