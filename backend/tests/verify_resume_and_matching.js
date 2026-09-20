const assert = require('assert');
const matchingService = require('../services/matching.service');
const resumeParserService = require('../services/resumeParser.service');
const { SKILL_ONTOLOGY, ROLE_BENCHMARK_PROFILES } = require('../data/skillOntology');

async function runVerification() {
  console.log('====================================================');
  console.log('RUNNING E2E VERIFICATION: RESUME PARSER & MATCHING ENGINE');
  console.log('====================================================\n');

  // Test 1: Skill Ontology Integrity
  console.log('Test 1: Skill Ontology & Role Benchmark Verification');
  const ontologyCount = SKILL_ONTOLOGY.length;
  assert(ontologyCount >= 85, `Expected >= 85 skills in ontology, got ${ontologyCount}`);
  console.log(`✓ Canonical Skill Ontology contains ${ontologyCount} skills across 5 categories.`);

  const benchmarkRoles = Object.keys(ROLE_BENCHMARK_PROFILES);
  assert(benchmarkRoles.length >= 5, `Expected >= 5 benchmark roles, got ${benchmarkRoles.length}`);
  console.log(`✓ Role Benchmark Profiles contains ${benchmarkRoles.length} target roles: ${benchmarkRoles.join(', ')}.`);

  // Test 2: Vector Math & Similarity Algorithms
  console.log('\nTest 2: Hybrid Cosine-Jaccard Vector Math');
  const userVec = {
    'Herbal Formulation': 5,
    'Ayurvedic Pharmacognosy': 4,
    'Good Laboratory Practice (GLP)': 4,
    'HPTLC / HPLC Chromatography': 2,
    'Python & Data Science': 3
  };
  const oppVec = {
    'Herbal Formulation': 5,
    'Ayurvedic Pharmacognosy': 5,
    'Good Laboratory Practice (GLP)': 4,
    'Phytochemical Extraction': 4,
    'Quality Control & Standardization': 4
  };

  const cosineSim = matchingService.calculateCosineSimilarity(userVec, oppVec);
  const jaccardSim = matchingService.calculateWeightedJaccard(userVec, oppVec);
  const hybridScore = matchingService.calculateHybridMatch(userVec, oppVec);

  assert(cosineSim > 0.5 && cosineSim <= 1.0, `Cosine similarity out of range: ${cosineSim}`);
  assert(jaccardSim > 0.2 && jaccardSim <= 1.0, `Jaccard similarity out of range: ${jaccardSim}`);
  assert(hybridScore > 0.4 && hybridScore <= 1.0, `Hybrid score out of range: ${hybridScore}`);
  console.log(`✓ Cosine Similarity: ${(cosineSim * 100).toFixed(1)}%`);
  console.log(`✓ Weighted Jaccard: ${(jaccardSim * 100).toFixed(1)}%`);
  console.log(`✓ Hybrid Score: ${(hybridScore * 100).toFixed(1)}% (Match Tier: ${matchingService.getMatchTier(hybridScore * 100).tier})`);

  // Test 3: Explainable Match Diagnostics
  console.log('\nTest 3: Explainable Match Diagnostics');
  const diagnostics = matchingService.generateDiagnostics(userVec, oppVec);
  assert(diagnostics.topContributingSkills.length > 0, 'Expected contributing skills');
  assert(diagnostics.criticalGaps.length > 0 || diagnostics.moderateGaps.length > 0, 'Expected gaps detected');
  assert(diagnostics.actionRecommendations.length > 0, 'Expected recommendations');
  console.log(`✓ Top Strengths: ${diagnostics.topContributingSkills.map(s => s.skill).join(', ')}`);
  console.log(`✓ Gaps Identified: ${[...diagnostics.criticalGaps, ...diagnostics.moderateGaps].map(g => g.skill).join(', ')}`);
  console.log(`✓ Action Prescribed: ${diagnostics.actionRecommendations[0]}`);

  // Test 4: Resume Parsing & NLP Entity Extraction
  console.log('\nTest 4: NLP Resume Parser & Ontology Mapping');
  const sampleResume = `
    Ashay Verma
    Email: ashay.v@aiia.gov.in
    Phone: +91 98765 43210
    BAMS 3rd Year · All India Institute of Ayurveda, New Delhi
    Summary: Herbal pharmacology student researcher with experience in classical rasashastra and modern chromatography.
    Skills: Herbal Formulation, Ayurvedic Pharmacognosy, Good Laboratory Practice (GLP), Phytochemical Extraction, HPTLC Standardization, Python, Sanskrit Diagnostics.
    Projects: Standardization of classical Ashwagandha Kwatha (HPTLC marker profiling); Phytochemical screening of Withania somnifera.
    Certifications: GLP Certificate - NMPB 2025; GCP Certificate - ICMR.
  `;

  const parsed = await resumeParserService.parseResumeText(sampleResume);
  assert(parsed.name.includes('Ashay'), `Expected parsed name to contain Ashay, got ${parsed.name}`);
  assert(parsed.email === 'ashay.v@aiia.gov.in', `Expected email ashay.v@aiia.gov.in, got ${parsed.email}`);
  assert(parsed.extractedSkills.length >= 4, `Expected >= 4 extracted skills, got ${parsed.extractedSkills.length}`);
  console.log(`✓ Parsed Name: ${parsed.name}`);
  console.log(`✓ Parsed Email: ${parsed.email}`);
  console.log(`✓ Extracted Skills (${parsed.extractedSkills.length}): ${parsed.extractedSkills.join(', ')}`);

  // Test 5: Auto-Assessment against Industry Benchmark
  console.log('\nTest 5: Auto-Assessment Generation');
  const autoAssess = await resumeParserService.generateAutoAssessment(parsed, 'Herbal Formulation Scientist');
  assert(autoAssess.matchPercentage >= 50, `Expected match percentage >= 50, got ${autoAssess.matchPercentage}`);
  assert(autoAssess.sideBySideComparison.length > 0, 'Expected side-by-side comparison');
  assert(autoAssess.radarComparison.labels.length >= 4, 'Expected radar chart dimensions');
  console.log(`✓ Target Role Match: ${autoAssess.matchPercentage}% (${autoAssess.matchTier})`);
  console.log(`✓ Side-by-Side Items Count: ${autoAssess.sideBySideComparison.length}`);
  console.log(`✓ Radar Dimensions: ${autoAssess.radarComparison.labels.join(', ')}`);

  // Test 6: Opportunity Recommendation Matching
  console.log('\nTest 6: Opportunity Recommendations for Candidate Profile');
  const recs = matchingService.getStudentRecommendations(userVec, { limit: 5 });
  assert(recs.length > 0, 'Expected at least 1 recommendation');
  console.log(`✓ Generated ${recs.length} matched recommendations:`);
  recs.forEach((r, i) => {
    console.log(`   ${i + 1}. [${r.matchTier}] ${r.title} @ ${r.company} (${r.matchPercentage}% Fit)`);
  });

  // Test 7: Institution Skill Gap Analysis
  console.log('\nTest 7: Institution Skill Gap Analysis');
  const institutionGap = matchingService.getInstitutionSkillGapAnalysis('All India Institute of Ayurveda (AIIA)');
  assert(institutionGap.departmentGaps.length > 0, 'Expected department gaps');
  assert(institutionGap.overallCurriculumAlignment > 50, 'Expected valid curriculum alignment');
  console.log(`✓ Overall Curriculum Alignment: ${institutionGap.overallCurriculumAlignment}%`);
  console.log(`✓ Department Gaps Analyzed: ${institutionGap.departmentGaps.length} departments.`);

  console.log('\n====================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (7/7 E2E Suites)');
  console.log('====================================================');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
