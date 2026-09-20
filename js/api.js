/**
 * JOBLEX API Client with Built-in Fallbacks for Offline & Vercel Deployments
 * Includes datasets for SIH 26044 Innovation Features:
 * - Peer Benchmarking
 * - Skill Decay & Refresh
 * - Micro-Internships / Paid Gigs
 * - Failure-Aware Learning Feedback
 * - Talent Pipeline Forecasting
 * - Institutional QR Verification
 * - Bilingual Hindi/English Support
 */

const API_BASE = window.JOBLEX_API_URL || '/api';

const JoblexAPI = {
  // Session / User Storage

  // Peer Benchmarking Data (Idea #2)
  peerBenchmarking: {
    userPercentile: 78,
    branchAverageScore: 72,
    placedPeerAverageScore: 86,
    targetCompanies: ["Dabur India", "Himalaya Wellness", "Patanjali Research"],
    topMissingPeerSkills: [
      { name: "HPTLC Fingerprinting", prevalence: "88% of placed peers" },
      { name: "In-Silico AutoDock Molecular Docking", prevalence: "74% of placed peers" },
      { name: "GCP Clinical Trial Protocols", prevalence: "69% of placed peers" }
    ]
  },

  // Micro-Internships / Task-Based Gigs (Idea #4)
  microGigs: [
    {
      id: "gig-2",
      title: "Annotate Charaka Samhita Sanskrit Botanical Lexicon",
      company: "AIIA Digital Informatics Cell",
      stipend: "₹4,500",
      duration: "7 Days",
      mode: "Remote",
      skills: ["Ayurvedic Pharmacognosy", "NLP Annotation", "Sanskrit"],
      deadline: "Oct 18, 2026",
      type: "Micro-Gig"
    },
    {
      id: "gig-3",
      title: "Validate Stability Curves for Triphala Formulations",
      company: "Patanjali Ayurved R&D",
      stipend: "₹8,000",
      duration: "14 Days",
      mode: "Hybrid",
      skills: ["GLP", "Quality Control", "Herbal Formulation"],
      deadline: "Oct 25, 2026",
      type: "Micro-Gig"
    }
  ],

  // Talent Pipeline Forecasting for Industry (Idea #6)
  talentForecast: {
    role: "Herbal Formulation & Phytochemical Scientists",
    timeframe: "Next 6 Months (Oct 2026 - Mar 2027)",
    estimatedIndustryDemand: 65,
    projectedTalentSupply: [
      { institution: "All India Institute of Ayurveda (AIIA), New Delhi", readyScholars: 24, trendingSkill: "HPTLC & Formulation (+35%)" },
      { institution: "National Institute of Ayurveda (NIA), Jaipur", readyScholars: 18, trendingSkill: "Pharmacology & Clinical (+28%)" },
      { institution: "Faculty of Ayurveda, BHU Varanasi", readyScholars: 15, trendingSkill: "Phytochemistry & QC (+22%)" },
      { institution: "Gujarat Ayurved University, Jamnagar", readyScholars: 12, trendingSkill: "Drug Discovery & Docking (+40%)" }
    ]
  },

  // Placement Cell / TPO Metrics for Colleges (Idea #10)
  tpoMetrics: {
    registeredStudents: 342,
    funnel: {
      applied: 248,
      shortlisted: 94,
      offersAccepted: 52,
      pendingInterviews: 28
    },
    predictivePlacementReadiness: 84, // 84% on track to placement
    ghostingRate: "4.2% (Industry leading)",
    urgentInterventionNeeded: 14 // Students needing mock interview / gap closing
  },

  // Bilingual UI Translations (Idea #13)
  translations: {
    en: {
      portalTitle: "JOBLEX",
      portalSubtitle: "Ministry of Ayush · Problem Statement 26044",
      heroTitle: "Next-Gen Skill Synergy on",
      heroSubtitle: "Bridging academia and industries with AI skill mapping, gamified career roadmaps, dynamic syllabus modernization, and verified placement pipelines.",
      studentGateway: "Student Sector",
      academyGateway: "Academy Sector",
      industryGateway: "Industry Sector",
      accessButton: "Enter JOBLEX Portal / Access Roles"
    },
    hi: {
      portalTitle: "जॉबलेक्स (JOBLEX)",
      portalSubtitle: "आयुष मंत्रालय · समस्या विवरण ID: 26044",
      heroTitle: "अगली पीढ़ी का कौशल तालमेल",
      heroSubtitle: "एआई कौशल मैपिंग, गेमीफाइड करियर रोडमैप, गतिशील पाठ्यक्रम आधुनिकीकरण और सत्यापित प्लेसमेंट पाइपलाइन के माध्यम से शिक्षा और उद्योग को जोड़ना।",
      studentGateway: "विद्यार्थी क्षेत्र (Student Portal)",
      academyGateway: "अकादमिक संस्थान (Academy Portal)",
      industryGateway: "उद्योग एवं प्लेसमेंट (Industry Portal)",
      accessButton: "जॉबलेक्स पोर्टल में प्रवेश करें"
    }
  },

  // Language management
  getLang() {
    return localStorage.getItem('joblex_lang') || 'en';
  },

  setLang(lang) {
    localStorage.setItem('joblex_lang', lang);
    window.location.reload();
  },

  // Auth Helpers
  getCurrentUser() {
    const data = localStorage.getItem('joblex_user');
    if (data) {
      try { return JSON.parse(data); } catch(e) {}
    }
    return null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('joblex_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('joblex_user');
    }
  },

  logout() {
    localStorage.removeItem('joblex_user');
    window.location.href = 'auth.html';
  },

  requireAuth(expectedRole = null) {
    const user = this.getCurrentUser();
    if (!user) {
      const currentPath = window.location.pathname.split('/').pop() || 'student.html';
      const roleParam = expectedRole || 'student';
      window.location.href = `auth.html?role=${encodeURIComponent(roleParam)}&redirect=${encodeURIComponent(currentPath)}`;
      return false;
    }
    return true;
  },

  navigateToPortal(role = 'student') {
    const user = this.getCurrentUser();
    const portalPage = `${role}.html`;
    if (!user) {
      window.location.href = `auth.html?role=${encodeURIComponent(role)}&redirect=${encodeURIComponent(portalPage)}`;
    } else {
      window.location.href = portalPage;
    }
  },

  async login(email, password, role) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      this.setCurrentUser(data.user);
      return data;
    }
    throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
  },

  async getRoadmap() {
    try {
      const res = await fetch(`${API_BASE}/roadmap`);
      if (res.ok) return await res.json();
    } catch(e) {}
    return {
      currentPhase: 1,
      totalXp: 1450,
      streak: 7,
      decayFrozenUntil: '2026-10-25',
      phases: [
        {
          id: 1,
          name: 'Core Ayurvedic Pharmacognosy & GLP',
          xpReward: 350,
          status: 'IN_PROGRESS',
          tasks: [
            { id: 't1', title: 'Complete Good Laboratory Practice (GLP) module', xp: 50, completed: true },
            { id: 't2', title: 'Ayurvedic botanical authentication quiz in Arena', xp: 50, completed: true },
            { id: 't3', title: 'Prepare Ashwagandha classical decoction report', xp: 100, completed: false }
          ]
        },
        {
          id: 2,
          name: 'Chromatography & HPTLC Profiling',
          xpReward: 450,
          status: 'LOCKED',
          tasks: [
            { id: 't4', title: 'MoU Partner (Dabur) Webinar on HPLC standards', xp: 75, completed: false },
            { id: 't5', title: 'Perform Fingerprint Marker Analysis quiz', xp: 75, completed: false }
          ]
        },
        {
          id: 3,
          name: 'Computational Drug Discovery & Health-AI',
          xpReward: 500,
          status: 'LOCKED',
          tasks: [
            { id: 't6', title: 'Python for Pharmacological Data Processing', xp: 100, completed: false },
            { id: 't7', title: 'In-silico docking of Phytochemical compounds', xp: 150, completed: false }
          ]
        },
        {
          id: 4,
          name: 'Corporate Internship & Capstone Formulation',
          xpReward: 600,
          status: 'LOCKED',
          tasks: [
            { id: 't8', title: 'Submit candidate CV to Dabur / Patanjali via Board', xp: 200, completed: false },
            { id: 't9', title: 'Pass Final Technical Evaluation Panel', xp: 400, completed: false }
          ]
        }
      ]
    };
  },

  async analyzeResume(text, role) {
    try {
      const res = await fetch(`${API_BASE}/resume/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text, targetRole: role })
      });
      if (res.ok) return await res.json();
    } catch(e) {}
    return {
      success: true,
      targetRole: role,
      matchPercentage: 78,
      benchmark: 85,
      extractedSkills: ["Herbal Formulation", "Ayurvedic Pharmacognosy", "GLP", "Python"],
      missingSkills: ["HPTLC / HPLC Fingerprinting", "Formulation Stability Protocols", "Nanomedicine Delivery"],
      softSkillsMatched: ["Scientific Documentation", "Research Ethics"],
      recommendations: [
        "Complete HPTLC chromatography certification through Dabur MoU workshop.",
        "Take the 'Formulation Stability Testing' quiz in Quiz Arena (+150 XP).",
        "Engage in clinical protocol documentation to reach the 85% industry benchmark."
      ]
    };
  },

  async askZulu(prompt) {
    try {
      const res = await fetch(`${API_BASE}/zulu/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) return data;
      }
    } catch(e) {}
    const query = (prompt || '').toLowerCase();
    let text = `### Zulu AI Guidance\n\nNamaste! Regarding **"${prompt.trim()}"**:\n\n- **Strategic Overview**: Combining classical wisdom with modern analytical methodologies (HPTLC, Phytochemistry, In-silico AutoDock) positions you in the top tier of applicants.\n- **Action Item**: Check your **Career Roadmap** to complete active skill modules and protect your Anti-Decay XP streak! `;

    if (query.includes('dabur') || query.includes('patanjali') || query.includes('himalaya') || query.includes('internship') || query.includes('job')) {
      text = `### Industry R&D & Competency Pathway\n\nNamaste! Based on recruitment benchmarks from Dabur, Himalaya, and Patanjali R&D labs:\n\n1. **High-Demand Competencies**: HPTLC fingerprinting, GLP/GCP compliance, and Python computational biology.\n2. **Next Steps**: Apply via your *Internships Board* or complete Phase 2 of your *Career Roadmap* for direct referral. `;
    } else if (query.includes('decay') || query.includes('freeze') || query.includes('xp') || query.includes('quiz')) {
      text = `### Anti-Decay XP & Competency Freeze Engine\n\nGreetings! Completing any Quiz Arena module or daily check-in freezes your competency score for **72 hours** and awards a 1.5x XP streak multiplier in recruiter talent pools! `;
    }

    return {
      reply: text
    };
  }
};

window.JoblexAPI = JoblexAPI;
