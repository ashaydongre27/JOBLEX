/**
 * JOBLEX Central Backend Database State & Seed Data (JavaScript / Node.js)
 * Ministry of Ayush / All India Institute of Ayurveda | Problem Statement ID: 26044
 */

const { SEED_OPPORTUNITIES, SEED_CANDIDATES, SEED_FACULTY } = require('./opportunities_seed');

const DB = {
  users: [
    {
      id: "usr-student-01",
      name: "Aarav Sharma",
      email: "aarav.sharma@aiia.gov.in",
      password: "password123",
      role: "student",
      institution: "All India Institute of Ayurveda",
      department: "Ayush Health Informatics & Phytopharmacology",
      year: "4th Year Undergraduate",
      xp: 1450,
      streak: 7,
      verified_skills: ["CAMAG HPTLC Densitometry", "Phytochemical Profiling", "Good Laboratory Practice (GLP)"]
    },
    {
      id: "usr-academy-01",
      name: "Prof. R.K. Sharma",
      email: "prof.sharma@aiia.gov.in",
      password: "password123",
      role: "academy",
      institution: "All India Institute of Ayurveda",
      department: "Dravyaguna & Pharmaceutical Sciences",
      designation: "Dean of Academic Affairs & HoD",
      xp: 3200,
      streak: 15,
      verified_skills: ["Curriculum Accreditation", "NAAC Institutional Review", "Ayush Pharmacology"]
    },
    {
      id: "usr-industry-01",
      name: "Corporate Talent Lead",
      email: "recruiter@dabur.com",
      password: "password123",
      role: "industry",
      company: "Dabur India Ltd.",
      designation: "Senior Lead Talent Acquisition & R&D Partnerships",
      xp: 2800,
      streak: 12,
      verified_skills: ["Formulation Research Recruiting", "GLP/GMP Auditing", "Corporate Requisitions"]
    }
  ],

  candidates: SEED_CANDIDATES,

  opportunities: [
    {
      id: "opp-tech-01",
      title: "Software Engineering & Systems Intern",
      company: "Apex Cloud Innovations",
      type: "Internship",
      skills: ["Python", "JavaScript", "Data Structures", "REST APIs", "Git"],
      location: "Bengaluru / Hybrid",
      stipend: "₹30,000/mo",
      deadline: "2026-11-30",
      match: 95,
      description: "Build high-throughput backend services, optimize database queries, and contribute to production cloud architectures."
    },
    {
      id: "opp-tech-02",
      title: "Machine Learning & Data Science Fellow",
      company: "Cognitive Nexus Labs",
      type: "Internship",
      skills: ["Python", "Machine Learning", "Data Analysis", "SQL", "Pandas"],
      location: "Hyderabad / Remote",
      stipend: "₹35,000/mo",
      deadline: "2026-12-01",
      match: 93,
      description: "Develop predictive machine learning models, statistical pipelines, and real-time inference microservices."
    },
    {
      id: "opp-tech-04",
      title: "National Student Innovation Challenge 2026",
      company: "National Collegiate Innovation Council",
      type: "Hackathon",
      skills: ["Python", "Problem Solving", "AI & Analytics", "System Design"],
      location: "National / Online",
      stipend: "Bounty Pool: ₹5,00,000",
      deadline: "2026-11-15",
      match: 91,
      description: "Pan-university multi-disciplinary hackathon solving real-world challenges across healthcare, climate, education, and AI."
    },
    ...SEED_OPPORTUNITIES,
    {
      id: "opp-1",
      title: "Phytochemical Research Intern",
      company: "Dabur India Ltd.",
      type: "Internship",
      skills: ["Herbal Formulation", "Clinical Research", "Phytochemistry", "GLP"],
      location: "Ghaziabad / Hybrid",
      stipend: "₹22,000/mo",
      deadline: "2026-10-15",
      match: 92,
      description: "Work on standardization and chromatographic profiling of classical Ayurvedic herbal formulations."
    },
    {
      id: "opp-2",
      title: "Ayush AI Innovation Challenge 2026",
      company: "Ministry of Ayush & AIIA",
      type: "Hackathon",
      skills: ["Python", "Machine Learning", "NLP for Classical Texts", "Data Science"],
      location: "New Delhi / National",
      stipend: "Cash Bounty: ₹3,00,000",
      deadline: "2026-11-01",
      match: 88,
      description: "National hackathon to build predictive Prakriti assessment engines and herbal drug-interaction databases."
    },
    {
      id: "opp-3",
      title: "Formulation Development Scientist",
      company: "Patanjali Research Foundation",
      type: "Job",
      skills: ["Ayurvedic Pharmacognosy", "Nanotechnology in Herbal Drug Delivery", "Quality Control"],
      location: "Haridwar",
      stipend: "₹8.5 - 12.0 LPA",
      deadline: "2026-10-30",
      match: 75,
      description: "Full-time position for postgraduate researchers in formulation optimization and stability testing."
    },
    {
      id: "opp-4",
      title: "Health Informatics & EHR Analytics Intern",
      company: "Himalaya Wellness Company",
      type: "Internship",
      skills: ["Python", "Clinical Trials Data", "Health Informatics"],
      location: "Bengaluru / Hybrid",
      stipend: "₹25,000/mo",
      deadline: "2026-10-20",
      match: 82,
      description: "Analyze clinical trial databases to correlate phytochemical markers with patient therapeutic outcomes."
    },
    {
      id: "opp-gig-2",
      title: "Annotate Charaka Samhita Sanskrit Botanical Lexicon",
      company: "AIIA Digital Informatics Cell",
      type: "Micro-Gig",
      skills: ["Ayurvedic Pharmacognosy", "NLP Annotation", "Sanskrit"],
      location: "Remote (7 Days)",
      stipend: "₹4,500 Task Bounty",
      deadline: "2026-10-18",
      match: 85,
      description: "Annotation of classical botanical synonyms for NLP machine learning models."
    }
  ],

  student_roadmap: {
    userId: "usr-student-01",
    careerGoal: "Multi-Disciplinary Technical & Research Specialist",
    currentLevel: "Level 1 - Aspiring Scholar",
    totalXp: 0,
    streakDays: 0,
    decayStatus: "Active",
    currentPhase: 1,
    phases: [
      {
        id: 1,
        name: "Core Fundamentals & Technical Standards",
        xpReward: 350,
        status: "IN_PROGRESS",
        tasks: [
          { id: "t1", title: "Complete Foundational Competency assessment in Arena", xp: 50, completed: false },
          { id: "t2", title: "Verify Technical and Quantitative problem solving", xp: 50, completed: false },
          { id: "t3", title: "Document initial domain portfolio project", xp: 100, completed: false }
        ]
      },
      {
        id: 2,
        name: "Domain Methodologies & Practical Tooling",
        xpReward: 450,
        status: "LOCKED",
        tasks: [
          { id: "t4", title: "Participate in Industry Partner technical webinar", xp: 75, completed: false },
          { id: "t5", title: "Complete Advanced Skill verification module", xp: 75, completed: false }
        ]
      },
      {
        id: 3,
        name: "Applied Analytics, Systems & Innovation",
        xpReward: 500,
        status: "LOCKED",
        tasks: [
          { id: "t6", title: "Applied Programming and Computational Data Analysis", xp: 100, completed: false },
          { id: "t7", title: "Deploy capstone project or technical simulation", xp: 150, completed: false }
        ]
      },
      {
        id: 4,
        name: "Corporate Internship & Placement Readiness",
        xpReward: 600,
        status: "LOCKED",
        tasks: [
          { id: "t8", title: "Submit candidate dossier to corporate partner requisitions", xp: 200, completed: false },
          { id: "t9", title: "Pass Final Technical & Professional Evaluation Panel", xp: 400, completed: false }
        ]
      }
    ]
  },

  peerBenchmarking: {
    userPercentile: 78,
    branchAverageScore: 72,
    placedPeerAverageScore: 86,
    targetCompanies: ["Leading Enterprise Partners", "National R&D Labs", "Global Consultancies"],
    topMissingPeerSkills: [
      { name: "Advanced Domain Analytics", prevalence: "88% of placed peers" },
      { name: "System Architecture & Modeling", prevalence: "74% of placed peers" },
      { name: "Quality & Industry Protocols", prevalence: "69% of placed peers" }
    ]
  },

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

  tpoMetrics: {
    registeredStudents: 342,
    funnel: {
      applied: 248,
      shortlisted: 94,
      offersAccepted: 52,
      pendingInterviews: 28
    },
    predictivePlacementReadiness: 84,
    ghostingRate: "4.2%",
    urgentInterventionNeeded: 14
  },

  departmentalReadiness: [
    { dept: 'Ayurvedic Pharmacology (Dravyaguna)', head: 'Dr. Rajeshwari Rao', obe: 94, labIndex: 'High (GLP / HPTLC)', bosStatus: 'Approved (NEP-2020)', naacCriterion: 'Criterion 3.4 Compliant' },
    { dept: 'Rasashastra & Bhaishajya Kalpana (Pharmaceutics)', head: 'Prof. Alok Tripathi', obe: 91, labIndex: 'High (Extraction Core)', bosStatus: 'BoS Review Scheduled', naacCriterion: 'Criterion 3.4 Compliant' },
    { dept: 'Ayush Health Informatics & Data Science', head: 'Dr. Sneha Kulkarni', obe: 96, labIndex: 'Active (Python/EHR)', bosStatus: 'Approved (NEP-2020)', naacCriterion: 'Criterion 1.2 Compliant' },
    { dept: 'Swasthavritta & Preventive Medicine', head: 'Dr. Manoj Sharma', obe: 88, labIndex: 'Moderate (Community)', bosStatus: 'In Audit Stage', naacCriterion: 'Criterion 2.1 Compliant' },
    { dept: 'Kaya Chikitsa & Clinical Diagnostics', head: 'Prof. Virendra Sen', obe: 93, labIndex: 'High (Hospital Link)', bosStatus: 'Approved (NEP-2020)', naacCriterion: 'Criterion 3.4 Compliant' }
  ],

  syllabus_suggestions: [
    {
      id: "syl-101",
      currentTopic: "Traditional Herbal Pharmacognosy (Unit 3)",
      suggestedAddition: "Computational Molecular Docking of Botanicals using Python & AutoDock Vina",
      source: "MoU Partner: Dabur Research & Development Ltd.",
      department: "Ayurvedic Pharmacology (Dravyaguna)",
      impact: "Closes 68% candidate gap for Formulation Scientist positions",
      credits: "3 Academic Credits",
      nepPillar: "Pillar 3: Multi-Disciplinary Tech Immersion",
      adopted: false
    },
    {
      id: "syl-102",
      currentTopic: "Herbal Standardization & Quality Control (Unit 5)",
      suggestedAddition: "Automated High-Performance Thin-Layer Chromatography (HPTLC CAMAG 4) Fingerprinting",
      source: "MoU Partner: Himalaya Wellness R&D",
      department: "Pharmaceutical Chemistry & Quality Assurance",
      impact: "Mandatory for Good Laboratory Practice (GLP) and schedule T compliance",
      credits: "4 Lab Credits",
      nepPillar: "Pillar 2: Industrial Lab Mastery",
      adopted: false
    },
    {
      id: "syl-103",
      currentTopic: "Clinical Medicine & Diagnostics (Unit 2)",
      suggestedAddition: "Digital Health Informatics & AI-Powered Prakriti Phenotyping Databases",
      source: "National AYUSH Mission & AIIA Informatics Cell",
      department: "Health Informatics & Clinical Epidemiology",
      impact: "Meets NEP-2020 digital health technology integration benchmarks",
      credits: "3 Academic Credits",
      nepPillar: "Pillar 4: Digital Health Architecture",
      adopted: false
    },
    {
      id: "syl-104",
      currentTopic: "Rasashastra & Mineral Processing (Unit 4)",
      suggestedAddition: "Bhasma Nanoparticle Characterization via XRD, TEM & Dynamic Light Scattering",
      source: "Patanjali Research Foundation & IIT Roorkee",
      department: "Rasashastra & Bhaishajya Kalpana",
      impact: "Enables nano-ayurvedic export dossier approvals under USFDA botanical guidelines",
      credits: "4 Lab Credits",
      nepPillar: "Pillar 3: Advanced Nanomaterial Characterization",
      adopted: false
    },
    {
      id: "syl-105",
      currentTopic: "Ayurvedic Toxicology (Agada Tantra)",
      suggestedAddition: "LC-MS/MS Pesticide Residue & Heavy Metal Trace Quantification Protocols",
      source: "Central Council for Research in Ayurvedic Sciences (CCRAS)",
      department: "Agada Tantra & Forensic Medicine",
      impact: "Zero-defect export compliance across European and GCC botanical pharmacopoeias",
      credits: "3 Lab Credits",
      nepPillar: "Pillar 2: Global Pharmacopeial Compliance",
      adopted: false
    },
    {
      id: "syl-106",
      currentTopic: "Classical Sanskrit Textual Analysis (Unit 1)",
      suggestedAddition: "Natural Language Processing (NLP) for Charaka & Sushruta Samhita Sanskrit Lexicons",
      source: "AI Innovation Challenge / Ayush-Tech Initiative",
      department: "Sanskrit Samhita & Siddhanta",
      impact: "Empowers scholars to build semantic knowledge graphs for ancient therapeutic formulations",
      credits: "3 Credits (Interdisciplinary)",
      nepPillar: "Pillar 1: Indigenous Knowledge Systems Modernization",
      adopted: false
    },
    {
      id: "syl-107",
      currentTopic: "Clinical Research Methodology (Unit 6)",
      suggestedAddition: "Good Clinical Practice (GCP) & Adaptive Bayesian Clinical Trial Design",
      source: "Indian Council of Medical Research (ICMR) & AIIA",
      department: "Kaya Chikitsa & Research Methodology",
      impact: "Equips postgraduates to lead multi-center randomized controlled trials (RCTs)",
      credits: "3 Academic Credits",
      nepPillar: "Pillar 4: Evidence-Based Clinical Validation",
      adopted: false
    },
    {
      id: "syl-108",
      currentTopic: "Herbal Drug Regulatory Affairs (Unit 7)",
      suggestedAddition: "eCTD Dossier Assembly for Botanical Drugs (WHO & US-FDA 21 CFR Part 312)",
      source: "Pharmexcil & Ministry of Commerce",
      department: "Regulatory Affairs & Pharmacovigilance",
      impact: "Accelerates commercialization and international patent filiings by 45%",
      credits: "2 Elective Credits",
      nepPillar: "Pillar 2: Global Regulatory Harmonization",
      adopted: false
    },
    {
      id: "syl-109",
      currentTopic: "Bhaishajya Kalpana (Dosage Formulations)",
      suggestedAddition: "Liposomal & Phytosome Delivery Matrix Design for Poorly Water-Soluble Actives",
      source: "Dabur Center of Excellence in Nanomedicine",
      department: "Pharmaceutics & Novel Drug Delivery",
      impact: "Increases bioavailability of curcuminoids and withanolides by 14x in clinical models",
      credits: "4 Lab Credits",
      nepPillar: "Pillar 3: Bioavailability Engineering",
      adopted: false
    },
    {
      id: "syl-110",
      currentTopic: "Ayush Preventive Healthcare & Dietetics",
      suggestedAddition: "Metabolomic Profiling of Ahara Formulations & Gut Microbiome Sequencing",
      source: "Institute of Genomics and Integrative Biology (CSIR-IGIB)",
      department: "Swasthavritta & Functional Nutrition",
      impact: "Positions university at forefront of precision preventive nutraceutical science",
      credits: "3 Credits",
      nepPillar: "Pillar 4: Precision Ayur-Genomics",
      adopted: false
    }
  ],

  candidates: [
    ...SEED_CANDIDATES,
    { name: "Aarav Sharma", college: "All India Institute of Ayurveda", match: 94, skills: ["Herbal Formulation", "GLP", "Phytochemistry", "Python"], status: "Ready for Interview" },
    { name: "Kavya Singh", college: "AIIA New Delhi", match: 91, skills: ["Health Informatics", "Python", "NLP for Classical Texts", "SQL"], status: "Shortlisted" },
    { name: "Rohan Sharma", college: "National Institute of Ayurveda, Jaipur", match: 82, skills: ["Ayurvedic Pharmacognosy", "Standardization", "Quality Control"], status: "Under Review" },
    { name: "Ananya Roy", college: "Banaras Hindu University (IMS)", match: 88, skills: ["Clinical Research", "Pharmacology", "Herbal Formulation"], status: "Shortlisted" },
    { name: "Priya Nair", college: "Gujarat Ayurved University, Jamnagar", match: 96, skills: ["Drug Discovery", "Phytochemistry", "HPTLC", "AutoDock"], status: "Top Applicant" }
  ],

  // Idea 11: Cross-College Benchmarking (Anonymized & Opt-In)
  crossCollegeBenchmarking: [
    { rank: 1, institution: "All India Institute of Ayurveda (AIIA), New Delhi", avgSkillScore: 78.4, placementRate: "86%", mouCount: 8, naacGrade: "A++", status: "Your Institution" },
    { rank: 2, institution: "National Institute of Ayurveda (NIA), Jaipur", avgSkillScore: 74.2, placementRate: "81%", mouCount: 6, naacGrade: "A+", status: "Peer Tier-1" },
    { rank: 3, institution: "Faculty of Ayurveda, BHU Varanasi", avgSkillScore: 72.8, placementRate: "79%", mouCount: 5, naacGrade: "A++", status: "Peer Tier-1" },
    { rank: 4, institution: "Gujarat Ayurved University, Jamnagar", avgSkillScore: 71.5, placementRate: "76%", mouCount: 4, naacGrade: "A", status: "Peer Tier-1" }
  ],

  // Idea 8: Sponsored Skill Bootcamps tied to real hiring roles
  sponsoredBootcamps: [
    {
      id: "bc-01",
      title: "Dabur-AIIA 4-Week Rapid HPTLC & Phytochemical Bootcamp",
      sponsor: "Dabur Research & Development Ltd.",
      partnerCollege: "All India Institute of Ayurveda",
      targetHires: 20,
      matchedScholars: 18,
      startDate: "Nov 01, 2026",
      stipend: "Full Sponsorship + ₹15,000 Completion Bounty",
      guaranteedOutcome: "Guaranteed Placement Interviews for Top 10 Cohort Finishers",
      status: "Cohort Enrolling"
    },
    {
      id: "bc-02",
      title: "Himalaya In-Silico Molecular Docking & Drug Screening Sprint",
      sponsor: "Himalaya Wellness Company",
      partnerCollege: "National Institute of Ayurveda",
      targetHires: 15,
      matchedScholars: 12,
      startDate: "Nov 15, 2026",
      stipend: "Cloud GPU Compute Grants + ₹12,000 Bounty",
      guaranteedOutcome: "Direct Pre-Placement Offers (PPOs) for Top 5",
      status: "Cohort Enrolling"
    }
  ],

  // Idea 7: Skill Match ROI & Evaluation Loop
  skillRoiMetrics: {
    predictedMatchAccuracy: 94.2,
    totalHiresEvaluated: 48,
    averageRecruiterRating: 4.8,
    feedbackLogs: [
      { candidate: "Aarav Sharma", predictedMatch: 94, actualLabRating: 4.9, company: "Dabur R&D", note: "Exceptional botanical extraction & Python modeling accuracy." },
      { candidate: "Pooja Verma", predictedMatch: 86, actualLabRating: 4.6, company: "Himalaya", note: "Solid chromatography fundamentals; fast learner." }
    ]
  },

  applications: [
    {
      id: "app-seed-01",
      opportunityId: "opp-1",
      opportunityTitle: "Phytochemical Research Intern",
      company: "Dabur India Ltd.",
      type: "Internship",
      studentName: "Aarav Sharma",
      studentEmail: "aarav.sharma@aiia.gov.in",
      college: "All India Institute of Ayurveda (AIIA), New Delhi",
      skills: ["Herbal Formulation", "Phytochemistry", "GLP", "Python"],
      match: 94,
      appliedDate: "2026-09-03",
      status: "Shortlisted",
      verifiedBadge: "AIIA-CERT-2026-9842",
      coverNote: "Strong background in botanical extraction protocols and AutoDock docking simulations."
    },
    {
      id: "app-seed-02",
      opportunityId: "opp-2",
      opportunityTitle: "Ayush AI Innovation Challenge 2026",
      company: "Ministry of Ayush & AIIA",
      type: "Hackathon",
      studentName: "Priya Nair",
      studentEmail: "priya@nexus.edu",
      college: "Gujarat Ayurved University, Jamnagar",
      skills: ["Drug Discovery", "Phytochemistry", "HPTLC", "AutoDock"],
      match: 96,
      appliedDate: "2026-09-02",
      status: "Interview Scheduled",
      verifiedBadge: "GAU-CERT-2026-1104",
      coverNote: "Expert in HPTLC standardization and molecular docking."
    },
    {
      id: "app-seed-03",
      opportunityId: "opp-3",
      opportunityTitle: "Formulation Development Scientist",
      company: "Patanjali Research Foundation",
      type: "Job",
      studentName: "Kavya Singh",
      studentEmail: "kavya@nexus.edu",
      college: "AIIA New Delhi",
      skills: ["Health Informatics", "Python", "NLP for Classical Texts", "SQL"],
      match: 91,
      appliedDate: "2026-09-04",
      status: "Pending Review",
      verifiedBadge: "AIIA-CERT-2026-8831",
      coverNote: "Prakriti classification ML models and classical NLP extraction pipelines."
    },
  ],

  mou_partnerships: [
    {
      id: "mou-01",
      partner: "Dabur Research Laboratories",
      institution: "All India Institute of Ayurveda",
      status: "Active",
      signedDate: "2025-06-12",
      validUntil: "2028-06-12",
      focusAreas: ["Nanomedicine in Ayurveda", "Student Internships", "Joint Patents"],
      internshipsProvided: 18,
      curriculumSponsors: "Standardization of Kwatha Formulations"
    },
    {
      id: "mou-02",
      partner: "Himalaya Drug Company",
      institution: "All India Institute of Ayurveda",
      status: "Active",
      signedDate: "2025-09-20",
      validUntil: "2027-09-20",
      focusAreas: ["Pharmacovigilance", "Clinical Trial Protocols", "Faculty Industrial Training"],
      internshipsProvided: 12,
      curriculumSponsors: "Computational Herbal Discovery"
    },
    {
      id: "mou-03",
      partner: "Aimil Pharmaceuticals",
      institution: "All India Institute of Ayurveda",
      status: "Reviewing Renewal",
      signedDate: "2024-02-15",
      validUntil: "2026-12-31",
      focusAreas: ["Metabolic Disorders Formulations", "Sponsored PG Dissertations"],
      internshipsProvided: 9,
      curriculumSponsors: "Herbal Quality Control & HPTLC"
    }
  ],

  consultancy_grants: [
    {
      id: "cg-01",
      title: "Standardization of Ashwagandha Active Withanolides in Water-Soluble Matrix",
      industry: "Dabur R&D",
      grantAmount: "₹18,50,000",
      deadline: "2026-11-15",
      targetDept: "Dravyaguna / Pharmaceutical Sciences",
      status: "Open for Faculty Proposals"
    },
    {
      id: "cg-02",
      title: "Bio-Efficacy Validation of Triphala Nano-Suspension in Gut Microbiome Models",
      industry: "Himalaya Drug Co.",
      grantAmount: "₹24,00,000",
      deadline: "2026-12-01",
      targetDept: "Kaya Chikitsa & Microbiology",
      status: "Open for Faculty Proposals"
    }
  ],

  fdp_programs: [
    {
      id: "fdp-01",
      title: "Industrial Immersion in High-Throughput Herbal Extraction & HPTLC",
      organizer: "National Medicinal Plants Board (NMPB) & Dabur Labs",
      duration: "2 Weeks (Hands-on Lab Immersion)",
      mode: "Offline at R&D Campus, Ghaziabad",
      eligibility: "Assistant / Associate Professors in Ayush",
      enrolled: 24,
      seats: 30
    },
    {
      id: "fdp-02",
      title: "Generative AI & Data Analytics for Traditional Medicine Curriculums",
      organizer: "All India Institute of Ayurveda & IIT Delhi Ayush Cell",
      duration: "1 Week (30 Hours)",
      mode: "Hybrid (Virtual + Weekend Hands-on)",
      eligibility: "All Ayush Faculty Members",
      enrolled: 68,
      seats: 100
    }
  ],

  wishlists: {},

  skillProfiles: {},

  portfolioItems: [],

  facultyOpportunities: [
    {
      id: "fac-opp-01",
      title: "Industrial Sabbatical: High-Throughput Phytochemical Screening",
      industry: "Dabur India Ltd. R&D",
      type: "Faculty Internship",
      duration: "4 Weeks",
      stipend: "₹1,20,000 Total Honorarium",
      eligibility: "Associate Professors / Professors in Pharmacognosy or Chemistry",
      skills: ["Ayurvedic Pharmacognosy", "HPTLC Fingerprinting", "Good Laboratory Practice (GLP)"],
      deadline: "2026-11-30",
      description: "Faculty industrial immersion in modern quality control labs working with chromatography and mass spectrometry."
    },
    {
      id: "fac-opp-02",
      title: "Joint Research Grant: Withanolide Water-Solubility Enhancement",
      industry: "Himalaya Drug Co. & Ministry of Ayush",
      type: "Consultancy Grant",
      duration: "12 Months",
      stipend: "₹24,00,000 Research Grant",
      eligibility: "Principal Investigators in Ayush Institutions",
      skills: ["Herbal Formulation", "Nanomedicine in Ayurveda", "In-Vitro Bio-Assays"],
      deadline: "2026-12-15",
      description: "Industry-sponsored research grant for development and pre-clinical bio-efficacy validation of nano-curcumin and ashwagandha formulations."
    },
    {
      id: "fac-opp-03",
      title: "Faculty Development Program: Computational Drug Discovery in Ayush",
      industry: "IIT Delhi Ayush Cell & AIIA",
      type: "FDP",
      duration: "2 Weeks (Hybrid)",
      stipend: "UGC / AICTE Approved (Cert. + Travel Grant)",
      eligibility: "All Ayush Faculty Members",
      skills: ["In-Silico Molecular Docking", "Health Informatics", "Python"],
      deadline: "2026-11-20",
      description: "NEP-2020 aligned advanced FDP training faculty in AutoDock, network pharmacology, and Python data pipelines."
    }
  ],

  facultyApplications: [
    {
      id: "fac-app-01",
      facultyId: "usr-academy-01",
      facultyName: "Dr. Rajesh Sharma",
      facultyEmail: "faculty@aiia.gov.in",
      opportunityId: "fac-opp-02",
      opportunityTitle: "Joint Research Grant: Withanolide Water-Solubility Enhancement",
      industry: "Himalaya Drug Co. & Ministry of Ayush",
      appliedDate: "2026-09-02",
      status: "Shortlisted",
      proposalTitle: "Nano-Emulsion Delivery Matrix for Active Withanolides",
      grantAmount: "₹24,00,000"
    }
  ],

  // Feature 1: Student Contextual To-Do Engine
  todos: [],

  // Feature 2: In-Portal Notifications Hub
  inPortalNotifications: [],

  // Feature 3: Company Tech Stack Registry
  companyTechStacks: [
    {
      id: "cts-001",
      companyId: "usr-industry-01",
      companyName: "Dabur India Ltd. / R&D Division",
      sector: "Herbal Phytomedicine & Formulation",
      techCategory: "Analytical Instrumentation",
      techName: "High-Performance Thin-Layer Chromatography (HPTLC CAMAG 4)",
      proficiencyDemandLevel: "Production Mastery",
      adoptionStage: "Core Production",
      curriculumRelevanceNote: "Mandatory for standardized marker compound profiling (Withaferin-A, Curcuminoids). University syllabus currently covers only classical paper chromatography.",
      lastVerifiedDate: "2026-09-01"
    },
    {
      id: "cts-002",
      companyId: "usr-industry-01",
      companyName: "Dabur India Ltd. / R&D Division",
      sector: "Pharmaceutical QA & Compliance",
      techCategory: "Laboratory Informatics & Compliance",
      techName: "21 CFR Part 11 Electronic Lab Notebooks (ELN / LIMS)",
      proficiencyDemandLevel: "Intermediate Practitioner",
      adoptionStage: "Core Production",
      curriculumRelevanceNote: "Regulatory requirement for audit trails and GLP raw data integrity. Urgent need to train Ayush postgraduates in audit-trail navigation.",
      lastVerifiedDate: "2026-09-02"
    },
    {
      id: "cts-003",
      companyId: "comp-patanjali",
      companyName: "Patanjali Research Foundation",
      sector: "Herbal Drug Standardization",
      techCategory: "Advanced Bio-Separation",
      techName: "Liquid Chromatography-Tandem Mass Spectrometry (LC-MS/MS)",
      proficiencyDemandLevel: "Production Mastery",
      adoptionStage: "Rapid Growth",
      curriculumRelevanceNote: "Required for heavy-metal trace screening, pesticide multi-residue analysis, and metabolomics.",
      lastVerifiedDate: "2026-08-28"
    },
    {
      id: "cts-004",
      companyId: "comp-himalaya",
      companyName: "Himalaya Wellness Company",
      sector: "Health Informatics & AI",
      techCategory: "Computational Biology & Data Science",
      techName: "Python (Polars, SciPy, BioPython, AutoDock Vina)",
      proficiencyDemandLevel: "Intermediate Practitioner",
      adoptionStage: "Rapid Growth",
      curriculumRelevanceNote: "Network pharmacology and reverse phytopharmacological docking pipelines now standard in preliminary formulation research.",
      lastVerifiedDate: "2026-09-04"
    }
  ],

  // Feature 4: Virtual Workshops & Bilateral Negotiations
  virtualWorkshops: [
    {
      id: "wsp-001",
      hostCompanyId: "usr-industry-01",
      hostCompanyName: "Dabur India Ltd. / R&D Division",
      speakerName: "Dr. Vikram Malhotra",
      speakerDesignation: "Chief Scientist & VP R&D",
      title: "Good Laboratory Practice (GLP) & Industrial Densitometry Validation",
      description: "An intensive 90-minute live interactive masterclass demonstrating real-time HPTLC peak identification, baseline drift correction, and FDA audit-trail best practices.",
      targetDepartments: ["Dravyaguna", "Pharmacognosy", "Pharmaceutical Chemistry", "Ayush Research Scholars"],
      scheduledStart: "2026-10-18T14:30:00.000Z",
      durationMinutes: 90,
      meetingLink: "https://nexus.edu/workshops/glp-validation-live",
      maxSeats: 250,
      enrolledCount: 194,
      status: "Approved",
      createdAt: "2026-09-01T10:00:00.000Z"
    },
    {
      id: "wsp-002",
      hostCompanyId: "comp-patanjali",
      hostCompanyName: "Patanjali Research Foundation",
      speakerName: "Dr. Anurag Varshney",
      speakerDesignation: "Head of Drug Discovery & Bio-Safety",
      title: "In-Silico Network Pharmacology & Classical Ayush Target Deconvolution",
      description: "Practical computational workshop teaching Ayush researchers how to map multi-herb phytoconstituents to human cytokine and receptor network targets.",
      targetDepartments: ["Ayush Informatics", "Biotechnology", "Ayurvedic Pharmacology"],
      scheduledStart: "2026-10-25T11:00:00.000Z",
      durationMinutes: 120,
      meetingLink: "https://nexus.edu/workshops/network-pharm-live",
      maxSeats: 300,
      enrolledCount: 228,
      status: "Approved",
      createdAt: "2026-09-03T11:30:00.000Z"
    },
    {
      id: "wsp-003",
      hostCompanyId: "comp-himalaya",
      hostCompanyName: "Himalaya Wellness Company",
      speakerName: "Siddharth Sen",
      speakerDesignation: "Director of Clinical Quality & Regulatory Affairs",
      title: "Regulatory Dossier Compilation for Herbal Therapeutics (WHO & Ayush GMP)",
      description: "Corporate-academic dialogue on building export-ready botanical drug safety dossiers for European and GCC markets.",
      targetDepartments: ["Regulatory Affairs", "Dravyaguna", "Ayush Faculty"],
      scheduledStart: "2026-11-05T15:00:00.000Z",
      durationMinutes: 75,
      meetingLink: "https://nexus.edu/workshops/who-gmp-dossier",
      maxSeats: 150,
      enrolledCount: 88,
      status: "Proposed",
      createdAt: "2026-09-05T16:00:00.000Z"
    }
  ],

  workshopEnrollments: [
    {
      id: "we-001",
      workshopId: "wsp-001",
      studentId: "usr-student-01",
      studentName: "Aarav Sharma",
      attendanceConfirmed: false,
      certificateIssued: false,
      registeredAt: "2026-09-06T13:00:00.000Z"
    }
  ],

  // Feature 5: Co-Curricular & Holistic Aptitude Question Bank (30 Questions across 5 Domains)
  aptitudeQuestions: [
    // 1. Quantitative Aptitude
    {
      id: "apt-q1",
      domain: "Quantitative",
      difficulty: "Medium",
      questionText: "An herbal extraction vessel operates with an 85% solvent recovery efficiency. If 400 liters of ethanol are used per batch, how many total liters of fresh ethanol are consumed across 5 identical production batches?",
      options: ["300 Liters", "340 Liters", "60 Liters", "240 Liters"],
      correctOptionIndex: 0,
      explanation: "Loss per batch = 15% of 400L = 60L fresh ethanol needed per batch. For 5 batches: 5 * 60L = 300 Liters."
    },
    {
      id: "apt-q2",
      domain: "Quantitative",
      difficulty: "Easy",
      questionText: "A standardized Ashwagandha extract is formulated to contain 2.5% Withaferin-A by weight. How many grams of Withaferin-A are present in a 250g therapeutic batch?",
      options: ["5.0 g", "6.25 g", "7.5 g", "10.0 g"],
      correctOptionIndex: 1,
      explanation: "2.5% of 250g = (2.5 / 100) * 250 = 6.25 grams."
    },
    {
      id: "apt-q3",
      domain: "Quantitative",
      difficulty: "Medium",
      questionText: "A freeze-drying lyophilizer completes a run in 18 hours with 4 condensors active. If 2 additional condensors of equal capacity are brought online, how many hours will the same batch take assuming linear heat sublimation?",
      options: ["10 Hours", "12 Hours", "14 Hours", "15 Hours"],
      correctOptionIndex: 1,
      explanation: "Work = 18 * 4 = 72 condensor-hours. With 6 condensors: 72 / 6 = 12 Hours."
    },
    {
      id: "apt-q4",
      domain: "Quantitative",
      difficulty: "Hard",
      questionText: "A lab technician mixes two herbal tinctures: Solution A has 12% alcohol and Solution B has 32% alcohol. In what ratio must Solution A and Solution B be blended to obtain a 24% alcohol blend?",
      options: ["2 : 3", "3 : 2", "1 : 2", "4 : 3"],
      correctOptionIndex: 0,
      explanation: "By Alligation: |12 - 24| = 12, |32 - 24| = 8. Ratio A:B = 8:12 = 2:3."
    },
    {
      id: "apt-q5",
      domain: "Quantitative",
      difficulty: "Medium",
      questionText: "If the concentration of an active marker in an herbal decoction degrades exponentially at 5% per month at 25°C, what fraction of the original marker remains after 2 months (rounded to nearest %)?",
      options: ["90%", "95%", "92%", "88%"],
      correctOptionIndex: 0,
      explanation: "Month 1 = 95%. Month 2 = 95% * 0.95 = 90.25% ~ 90%."
    },
    {
      id: "apt-q6",
      domain: "Quantitative",
      difficulty: "Easy",
      questionText: "A clinical trial cohort enrolls 120 patients across 4 regional clinics in the ratio 3:4:2:1. How many patients are enrolled at the largest clinic?",
      options: ["36", "48", "24", "60"],
      correctOptionIndex: 1,
      explanation: "Total parts = 3 + 4 + 2 + 1 = 10 parts. 1 part = 120 / 10 = 12. Largest clinic has 4 parts = 4 * 12 = 48 patients."
    },

    // 2. Logical Reasoning
    {
      id: "apt-q7",
      domain: "Logical_Reasoning",
      difficulty: "Medium",
      questionText: "Statements: All standardized herbal extracts undergo chromatography. Some chromatography tests require LC-MS. Conclusion I: Some standardized extracts require LC-MS. Conclusion II: All LC-MS tests are performed on standardized extracts.",
      options: ["Only Conclusion I follows", "Only Conclusion II follows", "Both I and II follow", "Neither follows with certainty"],
      correctOptionIndex: 0,
      explanation: "Since some chromatography tests require LC-MS and all standardized extracts undergo chromatography, the intersection allows that some standardized extracts undergo LC-MS."
    },
    {
      id: "apt-q8",
      domain: "Logical_Reasoning",
      difficulty: "Easy",
      questionText: "Find the next item in the logical sequence: BAMS, CBMS, DCMS, EDMS, ___?",
      options: ["FEMS", "EEMS", "FCMS", "GDMS"],
      correctOptionIndex: 0,
      explanation: "The first letter advances sequentially: B, C, D, E, F while remaining letters remain 'EMS'."
    },
    {
      id: "apt-q9",
      domain: "Logical_Reasoning",
      difficulty: "Medium",
      questionText: "If GLP is coded as 7-12-16 in an audit ledger, how is GMP coded in the same system?",
      options: ["7-13-16", "7-14-16", "6-13-15", "8-13-17"],
      correctOptionIndex: 0,
      explanation: "Standard alphabetical positions: G=7, M=13, P=16."
    },
    {
      id: "apt-q10",
      domain: "Logical_Reasoning",
      difficulty: "Hard",
      questionText: "In a quality test, Sample X is purer than Sample Y. Sample Z is purer than Sample W but less pure than Sample Y. Which sample is the least pure?",
      options: ["Sample X", "Sample Y", "Sample Z", "Sample W"],
      correctOptionIndex: 3,
      explanation: "Order of purity: X > Y > Z > W. Therefore, Sample W is the least pure."
    },
    {
      id: "apt-q11",
      domain: "Logical_Reasoning",
      difficulty: "Medium",
      questionText: "Six scientists (A, B, C, D, E, F) sit around a circular lab bench. A is opposite to D. B is to the immediate right of A. C is opposite to B. Who sits to the immediate left of D?",
      options: ["C", "B", "E", "F"],
      correctOptionIndex: 0,
      explanation: "Sitting circular positions: If A is at 12 o'clock, D is at 6 o'clock. B is at 1 o'clock (immediate right). C is opposite B at 7 o'clock. In circular seating facing inward, 7 o'clock is immediate left of 6 o'clock (D)."
    },
    {
      id: "apt-q12",
      domain: "Logical_Reasoning",
      difficulty: "Easy",
      questionText: "Which word does NOT belong with the others: Pipette, Burette, Centrifuge, Spectrophotometer, Sanskrit?",
      options: ["Pipette", "Centrifuge", "Spectrophotometer", "Sanskrit"],
      correctOptionIndex: 3,
      explanation: "Sanskrit is an ancient classical language; all other terms are laboratory instruments."
    },

    // 3. Verbal Ability & Technical Communication
    {
      id: "apt-q13",
      domain: "Verbal_Ability",
      difficulty: "Medium",
      questionText: "Choose the word most nearly opposite in meaning to 'ADULTERATED' in analytical quality standards:",
      options: ["Tainted", "Unblemished / Pristine", "Spurious", "Homogenized"],
      correctOptionIndex: 1,
      explanation: "Adulterated means contaminated or degraded by foreign substances. Pristine / Unblemished signifies untouched purity."
    },
    {
      id: "apt-q14",
      domain: "Verbal_Ability",
      difficulty: "Medium",
      questionText: "Select the correctly punctuated and grammatically sound technical statement:",
      options: [
        "The chromatographic baseline having drifted, the analyst recalibrated the detector.",
        "The chromatographic baseline having drifted the analyst, recalibrated the detector.",
        "The chromatographic baseline had drifted, however analyst recalibrated detector.",
        "The chromatographic baseline having drift, the analyst recalibrated."
      ],
      correctOptionIndex: 0,
      explanation: "Standard nominative absolute participial phrase properly set off by a comma."
    },
    {
      id: "apt-q15",
      domain: "Verbal_Ability",
      difficulty: "Easy",
      questionText: "Complete the sentence: 'Rigorous documentation according to GLP guidelines is not merely a bureaucratic formality; it is an __________ safeguard against data falsification.'",
      options: ["optional", "indispensable", "ephemeral", "incidental"],
      correctOptionIndex: 1,
      explanation: "'Indispensable' means absolutely essential, which correctly fits the technical emphasis."
    },
    {
      id: "apt-q16",
      domain: "Verbal_Ability",
      difficulty: "Hard",
      questionText: "Identify the idiom or phrase that best conveys 'reconciling modern empirical proof with classical traditional wisdom':",
      options: ["Reinventing the wheel", "Bridging epistemological paradigms", "Cutting the Gordian knot", "Burying the hatchet"],
      correctOptionIndex: 1,
      explanation: "'Bridging epistemological paradigms' precisely denotes harmonizing two distinct systems of knowing (classical Ayurvedic Shastra and Western empirical science)."
    },
    {
      id: "apt-q17",
      domain: "Verbal_Ability",
      difficulty: "Medium",
      questionText: "Choose the correct spelling for the term denoting the study of drugs derived from natural plant and animal sources:",
      options: ["Pharmacognocy", "Pharmacognosy", "Pharmocognosy", "Pharmacognozy"],
      correctOptionIndex: 1,
      explanation: "The correct standard scientific spelling is 'Pharmacognosy'."
    },
    {
      id: "apt-q18",
      domain: "Verbal_Ability",
      difficulty: "Easy",
      questionText: "In a professional email to an industry recruiter, which closing is most appropriate?",
      options: ["Cheers mate,", "Warm regards,", "Sent from my phone,", "Later,"],
      correctOptionIndex: 1,
      explanation: "'Warm regards,' is the established standard professional sign-off."
    },

    // 4. General Knowledge & Ayush Industry Context
    {
      id: "apt-q19",
      domain: "General_Knowledge",
      difficulty: "Easy",
      questionText: "Under the Ministry of Ayush, what does the acronym 'AIIA' stand for?",
      options: [
        "All India Institute of Ayurveda",
        "All India Industrial Academy",
        "Apex Indian Institute of Ayush",
        "Association of Indian Indigenous Apothecaries"
      ],
      correctOptionIndex: 0,
      explanation: "AIIA stands for the All India Institute of Ayurveda, New Delhi."
    },
    {
      id: "apt-q20",
      domain: "General_Knowledge",
      difficulty: "Medium",
      questionText: "Which national policy in India mandates multi-disciplinary research, credit transfer frameworks (ABC), and active industry-academia syllabus co-design?",
      options: ["National Education Policy 2020 (NEP-2020)", "Ayush Vision 2030", "Digital India Act 2022", "Pharma Standards Act 2018"],
      correctOptionIndex: 0,
      explanation: "NEP-2020 introduces Academic Bank of Credits, multi-disciplinary research, and industry-aligned syllabus revisions."
    },
    {
      id: "apt-q21",
      domain: "General_Knowledge",
      difficulty: "Medium",
      questionText: "Which standard pharmacopoeial compendium publishes official regulatory standards for identity, purity, and strength of Ayurvedic formulations in India?",
      options: [
        "Ayurvedic Pharmacopoeia of India (API)",
        "British Pharmacopoeia (BP)",
        "Charaka Samhita Digital Edition",
        "United States Dispensatory"
      ],
      correctOptionIndex: 0,
      explanation: "The Ayurvedic Pharmacopoeia of India (API), published by PCIM&H under the Ministry of Ayush, is the statutory legal standard."
    },
    {
      id: "apt-q22",
      domain: "General_Knowledge",
      difficulty: "Hard",
      questionText: "What is the primary chemical marker utilized internationally for chromatographic standardization of Ashwagandha (Withania somnifera)?",
      options: ["Withaferin-A", "Curcumin", "Piperine", "Ginkgolide-B"],
      correctOptionIndex: 0,
      explanation: "Withaferin-A and Withanolide-A are the principal steroidal lactone markers used for Ashwagandha standardization."
    },
    {
      id: "apt-q23",
      domain: "General_Knowledge",
      difficulty: "Easy",
      questionText: "Which body provides NAAC accreditation to universities and higher education institutions in India?",
      options: ["UGC", "AICTE", "NITI Aayog", "Ministry of Finance"],
      correctOptionIndex: 0,
      explanation: "The National Assessment and Accreditation Council (NAAC) is an autonomous body funded by the University Grants Commission (UGC)."
    },
    {
      id: "apt-q24",
      domain: "General_Knowledge",
      difficulty: "Medium",
      questionText: "What international WHO guideline establishes technical quality benchmarks for medicinal plant materials from cultivation to processing?",
      options: ["WHO GACP Guidelines", "ISO 9001", "FDA Title 21", "ICH Q10"],
      correctOptionIndex: 0,
      explanation: "WHO Good Agricultural and Collection Practices (GACP) for Medicinal Plants govern cultivation, harvesting, and post-harvest handling."
    },

    // 5. Industry Ethics & Data Integrity
    {
      id: "apt-q25",
      domain: "Industry_Ethics",
      difficulty: "Medium",
      questionText: "Under FDA 21 CFR Part 11 and Good Laboratory Practices (GLP), what does the acronym 'ALCOA' stand for in data integrity?",
      options: [
        "Attributable, Legible, Contemporaneous, Original, Accurate",
        "Actionable, Logical, Continuous, Operational, Auditable",
        "Authorized, Legal, Certified, Organized, Archived",
        "Automated, Laboratory, Calibrated, Optimal, Accurate"
      ],
      correctOptionIndex: 0,
      explanation: "ALCOA is the cornerstone principle of pharmaceutical data integrity: Attributable, Legible, Contemporaneous, Original, and Accurate."
    },
    {
      id: "apt-q26",
      domain: "Industry_Ethics",
      difficulty: "Easy",
      questionText: "If an unexpected peak appears in a duplicate chromatographic trial, what is the ethically correct protocol?",
      options: [
        "Investigate the root cause, document the Out of Specification (OOS), and retain all raw injection traces.",
        "Delete the raw chromatogram file and reinject until the peak disappears.",
        "Adjust the integration threshold until the peak area falls below detection limits.",
        "Replace the result with the first trial's numbers without noting the deviation."
      ],
      correctOptionIndex: 0,
      explanation: "Data integrity strictly mandates logging an Out of Specification (OOS) investigation and never discarding or altering raw data."
    },
    {
      id: "apt-q27",
      domain: "Industry_Ethics",
      difficulty: "Medium",
      questionText: "What is an Institutional Ethics Committee (IEC) clearance required for prior to starting a health study?",
      options: [
        "Any human clinical trial or therapeutic intervention",
        "Purchasing laboratory glassware",
        "Signing an employment contract",
        "Registering for an online student portal"
      ],
      correctOptionIndex: 0,
      explanation: "IEC clearance is legally required for any biomedical and health research involving human participants to safeguard ethics and safety."
    },
    {
      id: "apt-q28",
      domain: "Industry_Ethics",
      difficulty: "Medium",
      questionText: "A pharmaceutical sponsor asks an academic researcher to suppress adverse-event data observed during a herbal trial. The researcher must:",
      options: [
        "Refuse to suppress data and report all adverse events in accordance with pharmacovigilance regulations.",
        "Agree to suppress if the sponsor increases the research grant.",
        "Delay publishing until the drug hits retail shelves.",
        "Publish only the positive bio-efficacy findings in a local magazine."
      ],
      correctOptionIndex: 0,
      explanation: "Pharmacovigilance regulations and scientific ethics mandate transparent reporting of all adverse drug reactions."
    },
    {
      id: "apt-q29",
      domain: "Industry_Ethics",
      difficulty: "Hard",
      questionText: "Which document constitutes legally binding intellectual property protection when a university and company begin confidential joint research?",
      options: [
        "Non-Disclosure Agreement (NDA) & Material Transfer Agreement (MTA)",
        "Student ID Card",
        "Syllabus Outline",
        "Press Release"
      ],
      correctOptionIndex: 0,
      explanation: "NDAs protect confidential proprietary know-how, while MTAs govern biological sample ownership and usage rights."
    },
    {
      id: "apt-q30",
      domain: "Industry_Ethics",
      difficulty: "Medium",
      questionText: "Under the Biological Diversity Act 2002 of India, prior approval from the National Biodiversity Authority (NBA) is mandatory when:",
      options: [
        "Commercializing Indian biological resources or applying for patents based on them by foreign entities.",
        "Selling agricultural vegetables in a local bazaar.",
        "Reading historical Ayurvedic manuscripts in a university library.",
        "Teaching botany to undergraduate students."
      ],
      correctOptionIndex: 0,
      explanation: "The NBA regulates fair and equitable benefit sharing when biological resources from India are commercially exploited or patented."
    }
  ],

  assessmentSessions: [
    {
      id: "sess-001",
      studentId: "usr-student-01",
      assessmentType: "National Foundational Aptitude (NFAT-2026)",
      startedAt: "2026-09-04T10:00:00.000Z",
      completedAt: "2026-09-04T10:28:45.000Z",
      rawScore: 26,
      totalQuestions: 30,
      percentage: 86.67,
      percentile: 91.4,
      domainScores: {
        Quantitative: 83.3,
        Logical_Reasoning: 100.0,
        Verbal_Ability: 83.3,
        General_Knowledge: 83.3,
        Industry_Ethics: 83.3
      },
      passed: true,
      badgeHash: "a7c89f012e8b6543d2c109876543210fedcba9876543210abcdef0123456789a"
    }
  ],

  // Feature 7: Company-Provided Quizzes for Skill Certification
  companyQuizzes: [
    {
      id: "quiz-dabur-01",
      companyId: "usr-industry-01",
      companyName: "Dabur India Ltd.",
      badgeTitle: "Dabur Certified Herbal Formulation Specialist",
      badgeIcon: "verified",
      skillCategory: "Herbal Formulation & Extraction",
      timeLimitMinutes: 15,
      passingPercentage: 75,
      totalTakers: 412,
      passCount: 268,
      isActive: true,
      questions: [
        {
          id: "dq-1",
          question: "Which solvent system is most widely standard for separating Withanolides on Silica Gel 60 F254 TLC plates?",
          options: [
            "Toluene : Ethyl Acetate : Formic Acid (5:4:1)",
            "Pure Distilled Water (10:0)",
            "Hexane : Petroleum Ether (9:1)",
            "Methanol : Ammonia (1:9)"
          ],
          correctIndex: 0,
          explanation: "Toluene : Ethyl Acetate : Formic Acid provides optimal resolution without tailing for withanolides."
        },
        {
          id: "dq-2",
          question: "In industrial maceration, what does the term 'Menstruum' signify?",
          options: [
            "The solvent liquid employed for dissolving extractive matter from crude botanical drugs",
            "The solid fibrous plant residue remaining after straining",
            "The temperature at which drying occurs",
            "The speed of the centrifugal stirrer"
          ],
          correctIndex: 0,
          explanation: "Menstruum is the extraction solvent; the remaining insoluble residue is known as the 'Marc'."
        },
        {
          id: "dq-3",
          question: "Under Ayush Good Manufacturing Practices (Schedule T), what is the maximum permissible total microbial count for oral herbal extracts?",
          options: [
            "10^5 CFU/g for aerobic bacteria; 10^3 CFU/g for fungi",
            "Zero CFU/g (total sterile requirement)",
            "10^8 CFU/g without limits",
            "Not specified in Schedule T"
          ],
          correctIndex: 0,
          explanation: "Schedule T and Pharmacopoeial standards align on 10^5 CFU/g aerobic bacterial limit and 10^3 CFU/g yeast and moulds."
        },
        {
          id: "dq-4",
          question: "Why is Nitrogen gas sparging frequently employed in high-end herbal oil formulation processing?",
          options: [
            "To prevent oxidative rancidity of polyunsaturated fatty acids and preserve active phytosterols",
            "To change the natural scent of the oil",
            "To solidify the oil into wax",
            "To speed up gravity filtration"
          ],
          correctIndex: 0,
          explanation: "Nitrogen creates an inert blanket protecting sensitive botanical oils from oxidation."
        }
      ]
    },
    {
      id: "quiz-patanjali-01",
      companyId: "comp-patanjali",
      companyName: "Patanjali Research Foundation",
      badgeTitle: "Patanjali Certified Analytical Chromatographer",
      badgeIcon: "biotech",
      skillCategory: "HPTLC & Spectrophotometry",
      timeLimitMinutes: 15,
      passingPercentage: 75,
      totalTakers: 310,
      passCount: 189,
      isActive: true,
      questions: [
        {
          id: "pq-1",
          question: "What is the primary role of the CAMAG Derivatizer in HPTLC visualization of non-UV active triterpenoids?",
          options: [
            "Even micro-aerosol spraying of Anisaldehyde-Sulfuric Acid reagent followed by controlled thermal plate heating",
            "Cutting the TLC silica plate into strips",
            "Drying the plate using microwave radiation",
            "Reading optical absorbance without reagents"
          ],
          correctIndex: 0,
          explanation: "Automated derivatizers ensure uniform reagent aerosol deposition, eliminating manual spray artifacts."
        },
        {
          id: "pq-2",
          question: "In chromatographic method validation (ICH Q2R1), what does the parameter 'Resolution (Rs)' between two adjacent peaks ideally equal or exceed?",
          options: ["Rs >= 1.5", "Rs >= 0.2", "Rs = 0", "Rs <= -1.0"],
          correctIndex: 0,
          explanation: "Baseline resolution between adjacent peaks is attained when Rs >= 1.5."
        },
        {
          id: "pq-3",
          question: "Which detector is considered a universal mass-concentration detector for lipids and carbohydrates lacking UV chromophores?",
          options: [
            "Evaporative Light Scattering Detector (ELSD) / CAD",
            "Photodiode Array (PDA) at 254 nm",
            "Fluorescence detector",
            "Refractometer at 100°C"
          ],
          correctIndex: 0,
          explanation: "ELSD evaporates the mobile phase and measures scattered light from solute aerosol particles, making it independent of optical absorption."
        }
      ]
    }
  ],

  studentQuizCertifications: [],
  adaptiveQuizAttempts: [],

  // Feature 8: Companies & Company Tech Stack Showcase
  companies: [
    {
      id: "comp-dabur",
      name: "Dabur India Ltd.",
      tagline: "Science-Backed Natural Healthcare & Consumer Goods Pioneer",
      logo: "🌿",
      industry_sector: "Pharmaceuticals & Consumer Goods",
      location: "Ghaziabad / Delhi-NCR",
      website: "https://www.dabur.com",
      description: "Dabur India Ltd. is one of India's leading S&P CNX Nifty FMCG companies with a heritage of over 138 years. Dedicated to bringing natural, science-validated Ayush healthcare formulations to global markets.",
      tech_stack: ["Python", "HPTLC", "HPLC Fingerprinting", "In-Silico AutoDock", "GLP/GCP Compliance", "PyTorch", "Node.js"],
      verified: true,
      created_at: "2026-01-15T00:00:00.000Z"
    },
    {
      id: "comp-patanjali",
      name: "Patanjali Research Foundation",
      tagline: "World-Class Ayurvedic R&D & Clinical Standardization Laboratory",
      logo: "🌱",
      industry_sector: "Biotechnology & Ayurvedic Medicine",
      location: "Haridwar, Uttarakhand",
      website: "https://www.patanjali.res.in",
      description: "Patanjali Research Institute conducts cutting-edge biomedical research, botanical extract standardization, multi-center clinical trials, and bio-data informatics to validate classical wellness modalities.",
      tech_stack: ["Ayurvedic Pharmacognosy", "HPTLC / HPLC", "Python", "Bio-Informatics", "SQL", "Pandas"],
      verified: true,
      created_at: "2026-01-20T00:00:00.000Z"
    },
    {
      id: "comp-apex",
      name: "Apex Cloud Innovations",
      tagline: "High-Performance Distributed Systems & Intelligent Enterprise Platforms",
      logo: "⚡",
      industry_sector: "Information Technology & Cloud Systems",
      location: "Bengaluru, Karnataka",
      website: "https://apexcloud.example.io",
      description: "Apex Cloud Innovations engineers scalable cloud architectures, real-time microservices, and AI-driven automation solutions for global enterprise clients.",
      tech_stack: ["Python", "JavaScript", "React", "Node.js", "Docker", "AWS", "PostgreSQL"],
      verified: true,
      created_at: "2026-02-01T00:00:00.000Z"
    },
    {
      id: "comp-himalaya",
      name: "Himalaya Wellness Company",
      tagline: "Head-to-Heel Botanical Healthcare & Personal Care Innovations",
      logo: "🍃",
      industry_sector: "Nutraceuticals & Herbal Healthcare",
      location: "Bengaluru, Karnataka",
      website: "https://www.himalayawellness.in",
      description: "Himalaya Wellness integrates modern scientific research with ancient botanical expertise to produce globally trusted healthcare, personal care, and therapeutic formulations.",
      tech_stack: ["Phytochemistry", "GLP Standards", "Clinical Analytics", "R&D Data Pipeline", "Python"],
      verified: true,
      created_at: "2026-02-10T00:00:00.000Z"
    }
  ],

  // Feature 9: Company News, R&D Updates & Tech Blogs Feed
  companyUpdates: [
    {
      id: "cup-101",
      companyId: "comp-dabur",
      companyName: "Dabur India Ltd.",
      title: "Dabur R&D Expands In-Silico Molecular Docking Lab for Herbal Phytochemicals",
      content: "We are thrilled to announce the launch of our upgraded Computational Bio-Informatics Lab. We are actively hiring student interns proficient in Python, AutoDock, and HPTLC fingerprinting.",
      category: "Tech & R&D",
      created_at: "2026-09-08T10:30:00.000Z"
    },
    {
      id: "cup-102",
      companyId: "comp-patanjali",
      companyName: "Patanjali Research Foundation",
      title: "Patanjali Signs MoU with Top Universities for Shared Analytical Instrumentation",
      content: "Our state-of-the-art HPTLC Densitometry and High-Resolution Mass Spectrometry facility is now accessible for student researchers across partner academic institutions.",
      category: "MoU & Collaboration",
      created_at: "2026-09-06T14:15:00.000Z"
    },
    {
      id: "cup-103",
      companyId: "comp-apex",
      companyName: "Apex Cloud Innovations",
      title: "Open Requisitions: 2026 Graduate Software Engineering & AI Internships",
      content: "Apex Cloud Innovations has opened 15 new positions for student developers proficient in Node.js, React, Python, and SQL. Apply via the Student Opportunities Board!",
      category: "Hiring Event",
      created_at: "2026-09-05T09:00:00.000Z"
    }
  ]
};

module.exports = DB;

