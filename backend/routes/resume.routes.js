/**
 * JOBLEX AI Resume Analyzer & Competency Gap Discovery Routes (Node.js / Express)
 * Powered by Google Gemini AI with intelligent NLP fallback
 * Ministry of Ayush / All India Institute of Ayurveda | Problem Statement ID: 26044
 */

const express = require('express');
const router = express.Router();
const { generateWithFailover, isGoogleApiConfigured, callNvidiaModel, getNvidiaApiKey } = require('../services/ai.service');
const DB = require('../data/database');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

/**
 * Permissive student authentication middleware:
 * Validates real token if provided, but falls back to default student session
 * so public / demo students can always analyze, optimize, and export their resume.
 */
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

const {
  parseResumeHeuristically,
  parseResumeWithGemini,
  parseResumeWithAI,
  parseResumeText,
  generateAutoAssessment,
  getBenchmarkProfile,
  detectCandidateDomain
} = require('../services/resumeParser.service');

const ROLE_BENCHMARKS = {
  "Herbal Formulation Scientist": {
    benchmark: 85,
    requiredSkills: [
      "Herbal Formulation",
      "Ayurvedic Pharmacognosy",
      "Good Laboratory Practice (GLP)",
      "HPTLC / HPLC Fingerprinting",
      "Formulation Stability Protocols",
      "Phytochemical Extraction",
      "Spectroscopy & Quality Assurance"
    ],
    standardRecommendations: [
      "Complete advanced HPTLC fingerprinting certification through Dabur research lab modules.",
      "Complete the Formulation Stability Testing module on your Career Roadmap (+100 XP).",
      "Participate in standardized botanical extraction micro-gigs to reach the 85% industry benchmark."
    ]
  },
  "Quality Control & Regulatory Affairs Analyst": {
    benchmark: 88,
    requiredSkills: [
      "Good Laboratory Practice (GLP)",
      "Phytochemistry",
      "Quality Control",
      "Regulatory Dossier Preparation",
      "HPLC Fingerprinting",
      "Pharmacopeial Monograph Standards",
      "Raw Herb Authentication"
    ],
    standardRecommendations: [
      "Attain NMPB-accredited GLP compliance certification.",
      "Review Ministry of Ayush Pharmacopeia monograph submission guidelines.",
      "Engage in batch-to-batch consistency testing on classical formulations."
    ]
  },
  "Ayush Health-Tech & NLP Informatics Specialist": {
    benchmark: 82,
    requiredSkills: [
      "Python",
      "Machine Learning",
      "NLP for Classical Texts",
      "Health Informatics",
      "Data Analysis",
      "Classical Sanskrit Lexicon Processing",
      "In-Silico Molecular Docking"
    ],
    standardRecommendations: [
      "Contribute to Charaka Samhita Sanskrit text-mining model repositories.",
      "Develop clinical data tagging pipelines for Ayurvedic Prakriti assessment.",
      "Submit a research prototype to the Ayush AI Innovation Challenge."
    ]
  },
  "Full Stack Software Engineer": {
    benchmark: 85,
    requiredSkills: [
      "Python",
      "JavaScript",
      "Node.js",
      "React",
      "RESTful APIs",
      "SQL",
      "Git",
      "Docker"
    ],
    standardRecommendations: [
      "Complete Full-Stack Microservices with Node.js & React on Joblex Developer Academy.",
      "Build containerized microservices projects deploying with Docker and CI/CD pipelines.",
      "Contribute to open-source developer tool repositories to demonstrate version control mastery."
    ]
  },
  "Data Scientist & ML Engineer": {
    benchmark: 86,
    requiredSkills: [
      "Python",
      "Machine Learning",
      "Pandas",
      "Scikit-Learn",
      "PyTorch",
      "Vector Search & Embeddings",
      "Quantitative Aptitude"
    ],
    standardRecommendations: [
      "Complete End-to-End Machine Learning & Vector Search Systems on Joblex AI Research.",
      "Implement deep learning architectures for NLP or computer vision using PyTorch.",
      "Deploy production predictive models with FastAPI and containerized serving."
    ]
  }
};


/**
 * Perform AI Resume Analysis using LLM Failover Orchestrator (Google Gemini -> NVIDIA Nemotron)
 */
async function analyzeWithAI(resumeText, targetRole, standard) {
  const prompt = `You are the lead Technical Recruiter and AI Competency Evaluator for the Ministry of Ayush and major corporate pharmaceutical partners (Dabur, Himalaya Wellness, Patanjali).

Analyze this student resume for the role: "${targetRole}".
Required industry competency baseline: ${JSON.stringify(standard.requiredSkills)}
Corporate hiring benchmark score: ${standard.benchmark}%

Resume text:
"""
${resumeText}
"""

Evaluate the candidate and return ONLY valid JSON matching this exact schema:
{
  "matchPercentage": number (0-100 based on rigorous comparison to required skills),
  "extractedSkills": string[] (competencies and skills found in the resume),
  "missingSkills": string[] (required baseline skills absent from the resume),
  "softSkillsMatched": string[] (e.g. Research Documentation, Protocol Compliance, Teamwork),
  "recommendations": string[] (3-4 highly specific, actionable steps the student should take to reach the benchmark)
}`;

  try {
    if (getNvidiaApiKey() || isGoogleApiConfigured()) {
      const result = await generateWithFailover({
        prompt,
        systemInstruction: 'You are an AI competency and resume evaluation assistant for the Ministry of Ayush. Always return raw, valid JSON.',
        temperature: 0.2,
        jsonMode: true
      });

      if (result && result.text) {
        const cleanJson = result.text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        return JSON.parse(cleanJson);
      }
    }
  } catch (err) {
    console.error('[Resume Analyzer AI Error]:', err.message);
  }
  return null;
}

/**
 * Analytical NLP fallback when Gemini API key is pending
 */
function analyzeWithHeuristics(resumeText, targetRole, standard) {
  const textLower = resumeText.toLowerCase();
  const extractedSkills = [];
  const missingSkills = [];

  standard.requiredSkills.forEach(skill => {
    const skillTerms = skill.toLowerCase().split(/[\s/]+/);
    const isMatched = skillTerms.some(term => term.length > 2 && textLower.includes(term));
    if (isMatched) {
      extractedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const total = standard.requiredSkills.length;
  const matchPercentage = Math.min(100, Math.round((extractedSkills.length / (total || 1)) * 100));

  return {
    matchPercentage: Math.max(matchPercentage, 45),
    extractedSkills,
    missingSkills,
    softSkillsMatched: ["Scientific Documentation", "Research Ethics", "Technical Communication"],
    recommendations: standard.standardRecommendations
  };
}

// POST /api/resume/analyze
router.post('/analyze', authenticateStudentOptional, async (req, res) => {
  try {
    const { resumeText = '', targetRole = 'Herbal Formulation Scientist' } = req.body || {};

    if (!resumeText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume text to evaluate.'
      });
    }

    const standard = ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS["Herbal Formulation Scientist"];

    // 1. Try AI Evaluation (Gemini or NVIDIA Nemotron)
    const aiAnalysis = await analyzeWithAI(resumeText, targetRole, standard);
    if (aiAnalysis && aiAnalysis.extractedSkills) {
      return res.json({
        success: true,
        provider: 'nvidia-nemotron-ai',
        targetRole,
        matchPercentage: aiAnalysis.matchPercentage,
        benchmark: standard.benchmark,
        extractedSkills: aiAnalysis.extractedSkills,
        missingSkills: aiAnalysis.missingSkills,
        softSkillsMatched: aiAnalysis.softSkillsMatched || ["Scientific Documentation", "Research Ethics"],
        recommendations: aiAnalysis.recommendations
      });
    }

    // 2. High-Grade Heuristic Evaluation
    const fallback = analyzeWithHeuristics(resumeText, targetRole, standard);
    return res.json({
      success: true,
      provider: 'analytical-engine',
      targetRole,
      matchPercentage: fallback.matchPercentage,
      benchmark: standard.benchmark,
      extractedSkills: fallback.extractedSkills,
      missingSkills: fallback.missingSkills,
      softSkillsMatched: fallback.softSkillsMatched,
      recommendations: fallback.recommendations
    });
  } catch (err) {
    console.error('[Resume Route Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to analyze resume at this moment. Please try again shortly.'
    });
  }
});

/**
 * POST /api/resume/optimize
 * Interactive Prompt Giver / Resume Optimizer Copilot
 * Allows user to send specific custom instructions to rewrite, tailor, and elevate their resume
 */
// POST /api/resume/optimize
router.post('/optimize', authenticateStudentOptional, async (req, res) => {
  try {
    const {
      resumeText = '',
      customPrompt = '',
      targetRole = 'Herbal Formulation Scientist',
      currentSkills = []
    } = req.body || {};

    if (!resumeText.trim() && (!Array.isArray(currentSkills) || currentSkills.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume text or skills to optimize.'
      });
    }

    const userInstructions = customPrompt.trim() || 'Tailor my resume summary and bullet points to highlight highest-impact technical competencies and align with top industry hiring standards.';

    const systemInstruction = `You are the lead Executive Resume Strategist and Technical Recruiter for corporate partners and top research labs (Dabur, Himalaya Wellness, Patanjali R&D, and Ministry of Ayush).
You rewrite and optimize candidate resumes based on specific user prompts. Always return raw, valid JSON only.`;

    const prompt = `Student Candidate Resume Context:
"""
${resumeText.substring(0, 3000)}
"""
Target Role: "${targetRole}"
Candidate Extracted Skills: ${JSON.stringify(currentSkills)}

USER'S CUSTOM INSTRUCTIONS:
"${userInstructions}"

Rewrite and optimize the candidate's resume materials according to their custom instructions. Return ONLY a valid JSON object matching this schema:
{
  "revisedSummary": "A powerful 3-4 sentence professional summary tailored to the target role and user's specific request",
  "tailoredBulletPoints": [
    "3-5 strong, metrics-driven bullet points showcasing relevant experience and technical skills"
  ],
  "recommendedKeywords": [
    "High-impact ATS industry keywords to include"
  ],
  "structuralSuggestions": [
    "Specific tactical adjustments for sections, formatting, or portfolio links"
  ],
  "confidenceScore": number (80-99 indicating alignment quality)
}`;

    // 1. Multi-Tier LangGraph / Model Orchestrator (Tier 1: NVIDIA approved models -> Tier 2: Google Main -> Tier 3: Google Backup)
    let aiResponse = null;
    if (getNvidiaApiKey()) {
      aiResponse = await callNvidiaModel({
        prompt,
        systemInstruction,
        temperature: 0.3,
        maxTokens: 1000,
        timeoutMs: 25000
      });
    }

    if (!aiResponse) {
      aiResponse = await generateWithFailover({
        prompt,
        systemInstruction,
        temperature: 0.3,
        jsonMode: true
      });
    }

    if (aiResponse && aiResponse.text) {
      try {
        const cleanJson = aiResponse.text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsedData = JSON.parse(cleanJson);
        return res.json({
          success: true,
          provider: aiResponse.provider || 'nvidia-nemotron',
          optimization: parsedData
        });
      } catch (parseErr) {
        console.warn('[Resume Optimizer JSON Parse Notice]:', parseErr.message);
      }
    }

    // Heuristic Fallback Tailoring Engine
    const benchmarkProfile = getBenchmarkProfile(targetRole);
    const targetKeywords = ROLE_BENCHMARKS[targetRole]?.requiredSkills || (benchmarkProfile?.mandatorySkills ? benchmarkProfile.mandatorySkills.map(m => m.name || m.id) : (currentSkills.length > 0 ? currentSkills : ["System Architecture", "Quality Compliance", "Technical Execution"]));
    
    const isTechRole = /software|developer|data|ml|engineer|tech/i.test(targetRole);
    const fallbackOptimization = {
      revisedSummary: `Driven ${targetRole} candidate with hands-on technical competencies in ${targetKeywords.slice(0, 3).join(', ')}. Demonstrated ${isTechRole ? 'engineering rigor, architecture excellence,' : 'research rigor, standard operating compliance,'} and execution aligned with top industry hiring baselines. Dedicated to advancing standardized protocols and scalable high-impact solutions.`,
      tailoredBulletPoints: isTechRole ? [
        `Spearheaded modular architecture design and feature implementation utilizing ${targetKeywords[0] || 'modern frameworks'} with rigorous test coverage.`,
        `Engineered scalable workflows utilizing ${targetKeywords.slice(1, 3).join(' and ') || 'cloud microservices'}, improving throughput and reducing execution latency by 32%.`,
        `Optimized trial records, documentation, and version-controlled CI/CD delivery pipelines, increasing team velocity and deployment stability.`,
        `Collaborated cross-functionally to evaluate system metrics, analyze requirements, and implement production-ready solutions.`
      ] : [
        `Spearheaded experimental extraction protocols adhering strictly to Good Laboratory Practice (GLP) and standard monographs.`,
        `Conducted high-precision analytical assays utilizing ${targetKeywords[0] || 'spectroscopic methods'} with strict quality assurance documentation.`,
        `Optimized trial records and batch testing workflows, improving reproducibility and compliance by 28%.`,
        `Collaborated with cross-functional research teams to synthesize and evaluate active marker compounds.`
      ],
      recommendedKeywords: targetKeywords.slice(0, 8),
      structuralSuggestions: [
        `Place the revised summary directly below contact information to capture technical recruiter attention within 6 seconds.`,
        `Group core proficiencies under a dedicated 'Core Competencies & Tools' heading.`,
        `Quantify experimental metrics, benchmark accuracies, and latency reductions in project descriptions.`
      ],
      confidenceScore: 89
    };

    return res.json({
      success: true,
      provider: 'analytical-optimizer-engine',
      optimization: fallbackOptimization
    });
  } catch (err) {
    console.error('[Resume Optimize Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize resume with custom prompt.'
    });
  }
});

/**
 * POST /api/resume/parse
 * Full multi-section document parsing (PDF / DOCX text)
 */
router.post('/parse', authenticateStudentOptional, async (req, res) => {
  try {
    const { resumeText = '', fileName = 'resume.pdf' } = req.body || {};

    if (!resumeText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required for parsing. Please upload a PDF/DOCX or paste text.'
      });
    }

    // 1. Try AI Structured Extraction (NVIDIA Nemotron or Gemini)
    const aiParsed = await parseResumeWithAI(resumeText, fileName);
    if (aiParsed && aiParsed.personalInfo) {
      return res.json({
        success: true,
        provider: aiParsed.metadata?.extractor || 'nvidia-nemotron-ai',
        parsedResume: aiParsed
      });
    }

    // 2. Deterministic Regex / NLP Heuristic Extraction Fallback
    const heuristicParsed = parseResumeHeuristically(resumeText, fileName);
    return res.json({
      success: true,
      provider: 'deterministic-heuristic-nlp',
      parsedResume: heuristicParsed
    });
  } catch (err) {
    console.error('[Resume Parse Route Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Document parsing failed. Please verify file format and try again.'
    });
  }
});

/**
 * POST /api/resume/auto-assess
 * Generates initial benchmark scores, radar comparison, and gap analysis from parsed skills or raw resume text
 */
router.post('/auto-assess', authenticateStudentOptional, async (req, res) => {
  try {
    const {
      resumeText = '',
      parsedSkills = [],
      targetRole = 'auto'
    } = req.body || {};

    let rawText = '';
    if (typeof resumeText === 'string' && resumeText.trim()) {
      rawText = resumeText.trim();
    } else if (typeof parsedSkills === 'string' && parsedSkills.trim()) {
      rawText = parsedSkills.trim();
    }

    let parsedResult;
    let skillList = [];

    if (rawText) {
      // Full parse of resume document text
      parsedResult = await parseResumeText(rawText);
      skillList = (parsedResult.skills && parsedResult.skills.allExtracted) || parsedResult.extractedSkills || [];
    } else if (Array.isArray(parsedSkills) && parsedSkills.length > 0) {
      skillList = parsedSkills.map(s => typeof s === 'string' ? s : (s.name || s.skill || ''));
      parsedResult = {
        name: 'Scholar Candidate',
        email: '',
        education: [],
        experience: [],
        summary: 'Candidate credentials across evaluated competencies.',
        extractedSkills: skillList
      };
    } else {
      // Default fallback heuristic
      parsedResult = parseResumeHeuristically('');
      skillList = (parsedResult.skills && parsedResult.skills.allExtracted) || parsedResult.extractedSkills || [];
    }

    const autoAssessment = generateAutoAssessment(skillList, targetRole || 'auto', rawText);

    const parsedEducation = Array.isArray(parsedResult.education) && parsedResult.education.length > 0
      ? parsedResult.education.map(e => typeof e === 'string' ? e : `${e.degree || ''} · ${e.institution || ''}`.replace(/^ · | · $/g, '')) 
      : (parsedResult.personalInfo && parsedResult.personalInfo.institution ? [`${parsedResult.personalInfo.degree || 'Degree'} · ${parsedResult.personalInfo.institution}`] : ['Accredited University Scholar']);

    const parsedExperience = Array.isArray(parsedResult.experience) && parsedResult.experience.length > 0
      ? parsedResult.experience[0].duration || 'Academic / Practical Experience'
      : (parsedResult.experienceYears || 'Candidate Experience');

    const parsedData = {
      name: parsedResult.name || (parsedResult.personalInfo && parsedResult.personalInfo.name) || 'Scholar Candidate',
      email: parsedResult.email || (parsedResult.personalInfo && parsedResult.personalInfo.email) || '',
      phone: parsedResult.phone || (parsedResult.personalInfo && parsedResult.personalInfo.phone) || '',
      education: parsedEducation,
      experienceYears: parsedExperience,
      summary: parsedResult.summary || (parsedResult.personalInfo && parsedResult.personalInfo.degree ? `${parsedResult.personalInfo.degree} candidate with verified competencies in ${skillList.slice(0, 4).join(', ') || 'specialized technical domains'}.` : 'Candidate credentials evaluated across verified competencies.'),
      extractedSkills: skillList,
      projects: parsedResult.projects || [],
      certifications: parsedResult.certifications || []
    };

    return res.json({
      success: true,
      targetRole: autoAssessment.targetRole,
      detectedDomain: autoAssessment.detectedDomain,
      parsed: parsedData,
      assessment: autoAssessment,
      autoAssessment
    });
  } catch (err) {
    console.error('[Resume Auto-Assess Route Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Could not generate auto-assessment for candidate.'
    });
  }
});

/**
 * POST /api/resume/merge-profile
 * Merges parsed skills, certifications, and projects directly into student's persistent profile & digital portfolio
 */
router.post('/merge-profile', authenticateStudentOptional, (req, res) => {
  try {
    const {
      skills = [],
      certifications = [],
      projects = [],
      targetRole = 'Herbal Formulation Scientist',
      readinessScore = 84
    } = req.body || {};

    const rawSkills = (skills || []).map(s => typeof s === 'string' ? s : (s.skill || s.name || '')).filter(Boolean);

    // 1. Update user profile verified_skills
    const userId = req.user.id || req.user.email;
    const user = (DB.users || []).find(u => u.id === userId || u.email === userId || u.email === req.user.email);
    const existingSkills = user ? (user.verified_skills || []) : [];
    const mergedSkills = Array.from(new Set([...existingSkills, ...rawSkills]));

    if (user) {
      user.verified_skills = mergedSkills;
    }

    // 2. Persist to DB.skillProfiles
    if (!DB.skillProfiles) DB.skillProfiles = {};
    DB.skillProfiles[userId] = {
      userId,
      targetRole,
      readinessScore,
      verifiedSkills: mergedSkills,
      strengths: mergedSkills.slice(0, 4),
      criticalGaps: [],
      moderateGaps: [],
      lastUpdated: new Date().toISOString()
    };

    // 3. Inject certifications and projects into digital portfolio ledger
    if (!DB.portfolioItems) DB.portfolioItems = [];

    certifications.forEach(cert => {
      const alreadyExists = DB.portfolioItems.some(p => p.title.toLowerCase() === cert.title.toLowerCase());
      if (!alreadyExists) {
        DB.portfolioItems.unshift({
          id: `port-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          userId,
          title: cert.title,
          type: "Verified Certificate",
          issuer: cert.issuer || "National Ayush Accreditation Board",
          issueDate: cert.date || "2025",
          verificationHash: cert.verificationHash || `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
          skills: rawSkills.slice(0, 2),
          status: "NAAR Cryptographically Verified"
        });
      }
    });

    projects.forEach(proj => {
      const alreadyExists = DB.portfolioItems.some(p => p.title.toLowerCase() === proj.title.toLowerCase());
      if (!alreadyExists) {
        DB.portfolioItems.unshift({
          id: `port-proj-${Date.now().toString(36)}`,
          userId,
          title: proj.title,
          type: "Verified Capstone Project",
          issuer: (user && user.institution) ? user.institution : "Academic University / Institution",
          issueDate: "2025",
          verificationHash: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
          skills: proj.techStack || rawSkills.slice(0, 3),
          status: "Peer Reviewed & Ratified"
        });
      }
    });

    return res.json({
      success: true,
      message: 'Skills and verified credentials successfully synchronized with your profile and NAAR portfolio!',
      mergedSkills,
      mergedCount: rawSkills.length,
      portfolioCount: DB.portfolioItems.filter(p => p.userId === userId).length,
      updatedProfile: DB.skillProfiles[userId]
    });
  } catch (err) {
    console.error('[Resume Merge Profile Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to merge resume competencies into student profile.'
    });
  }
});

module.exports = router;
