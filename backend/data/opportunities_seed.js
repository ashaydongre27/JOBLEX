/**
 * JOBLEX Comprehensive Seed Opportunities & Multi-Domain Profiles
 * 18+ Realistic Industry Opportunities with Skill Vectors
 * Ministry of Ayush & Corporate Partners | Problem Statement ID: 26044
 */

const SEED_OPPORTUNITIES = [
  // ── 1. CORPORATE RESEARCH INTERNSHIPS (6 Opportunities) ────────────────────────
  {
    id: "opp-corp-01",
    title: "Phytochemical Standardization & HPTLC Research Fellow",
    company: "Dabur India Ltd. / R&D Division",
    type: "Internship",
    skills: ["Herbal Formulation", "HPTLC Fingerprinting", "Good Laboratory Practice (GLP)", "Phytochemical Extraction"],
    location: "Ghaziabad R&D Center / Hybrid",
    stipend: "₹24,000/mo",
    deadline: "2026-11-15",
    description: "Hands-on chromatographic standardization of Withania somnifera and classical kwatha formulations under Dabur senior research scientists."
  },
  {
    id: "opp-corp-02",
    title: "Bioactive Lead Optimization & Molecular Docking Intern",
    company: "Himalaya Wellness Company",
    type: "Internship",
    skills: ["In-Silico Molecular Docking", "Python", "Ayurvedic Pharmacognosy", "ADMET Property Prediction"],
    location: "Bengaluru Innovation Hub",
    stipend: "₹26,000/mo",
    deadline: "2026-11-20",
    description: "Utilize computational docking (AutoDock) and network pharmacology to correlate traditional Ayurvedic polyherbal bioactives with metabolic targets."
  },
  {
    id: "opp-corp-03",
    title: "Pharmacovigilance & Quality Control Lab Associate",
    company: "Patanjali Research Foundation",
    type: "Internship",
    skills: ["HPLC Analysis", "Good Laboratory Practice (GLP)", "Pharmacopeial Monograph Standards", "Microbial Contamination Testing"],
    location: "Haridwar Central Lab",
    stipend: "₹22,000/mo",
    deadline: "2026-12-05",
    description: "Quality assurance batch testing and pharmacopeial compliance documentation for botanical raw materials and herbal syrups."
  },
  {
    id: "opp-corp-04",
    title: "Ayush Digital Grid & Clinical EHR Data Intern",
    company: "National AYUSH Mission & AIIA",
    type: "Internship",
    skills: ["Python", "Health Informatics", "Electronic Health Records (EHR)", "SQL & Relational Databases"],
    location: "New Delhi / Hybrid",
    stipend: "₹25,000/mo",
    deadline: "2026-11-30",
    description: "Cleanse, anonymize, and analyze multi-centric clinical trial records and patient Prakriti registries across tertiary Ayush hospitals."
  },
  {
    id: "opp-corp-05",
    title: "Polyherbal Nano-Suspension Formulation Intern",
    company: "Aimil Pharmaceuticals",
    type: "Internship",
    skills: ["Nanomedicine in Ayurveda", "Herbal Formulation", "Formulation Stability Protocols", "In-Vitro Bio-Assays"],
    location: "New Delhi Industrial Area",
    stipend: "₹20,000/mo",
    deadline: "2026-11-25",
    description: "Formulation optimization for water-insoluble curcumin and boswellia extracts utilizing phytosome and nano-encapsulation techniques."
  },
  {
    id: "opp-corp-06",
    title: "Full Stack Health-Platform Engineering Intern",
    company: "Arogya Digital Health Systems",
    type: "Internship",
    skills: ["JavaScript", "React", "Node.js", "RESTful API Architecture", "SQL & Relational Databases"],
    location: "Hyderabad / Remote",
    stipend: "₹28,000/mo",
    deadline: "2026-11-18",
    description: "Build clinical dashboard widgets and tele-consultation interfaces connecting Ayush practitioners with remote rural dispensaries."
  },

  // ── 2. FULL-TIME CORPORATE PLACEMENT JOBS (5 Opportunities) ─────────────────────
  {
    id: "opp-job-01",
    title: "Herbal Formulation Development Scientist",
    company: "Dabur India Ltd.",
    type: "Job",
    skills: ["Herbal Formulation", "Ayurvedic Pharmacognosy", "HPTLC Fingerprinting", "Good Manufacturing Practice (GMP)", "Formulation Stability Protocols"],
    location: "Ghaziabad / National",
    stipend: "₹9.5 - 12.0 LPA",
    deadline: "2026-12-15",
    description: "Lead new product development for OTC herbal formulations, oversee scale-up from pilot lab to manufacturing plants, and ensure AYUSH regulatory approval."
  },
  {
    id: "opp-job-02",
    title: "Pharma Quality Assurance & Regulatory Officer",
    company: "Baidyanath Research Labs",
    type: "Job",
    skills: ["Good Laboratory Practice (GLP)", "HPLC Analysis", "Regulatory Dossier Preparation", "Pharmacopeial Monograph Standards"],
    location: "Kolkata / Jhansi",
    stipend: "₹8.0 - 10.5 LPA",
    deadline: "2026-12-01",
    description: "Manage statutory inspections, review certificate of analysis (CoA) dossiers for export consignments, and coordinate with Ministry of Ayush licensing cells."
  },
  {
    id: "opp-job-03",
    title: "Classical Sanskrit NLP & AI Engineer",
    company: "Ayush Digital Grid Technology",
    type: "Job",
    skills: ["Python", "NLP for Classical Sanskrit Texts", "Natural Language Processing (NLP)", "Large Language Models (LLMs) & Prompting", "SQL & Relational Databases"],
    location: "New Delhi / Bengaluru",
    stipend: "₹12.0 - 16.0 LPA",
    deadline: "2026-12-20",
    description: "Develop domain-adapted transformer models for extracting botanical synonyms and therapeutic formulations from Charaka and Sushruta Samhitas."
  },
  {
    id: "opp-job-04",
    title: "Senior Full Stack Cloud Platform Engineer",
    company: "Joblex Academic Cloud",
    type: "Job",
    skills: ["TypeScript", "Node.js", "React", "RESTful API Architecture", "Docker & Containerization", "Cloud Infrastructure & AWS/GCP"],
    location: "Noida / Hybrid",
    stipend: "₹14.0 - 18.0 LPA",
    deadline: "2026-12-10",
    description: "Architect high-concurrency education data portals, maintain microservices for student evaluation, and manage Supabase and Redis caching layers."
  },
  {
    id: "opp-job-05",
    title: "Biostatistical Clinical Trial Data Analyst",
    company: "Sun Pharma Advanced Research",
    type: "Job",
    skills: ["Bio-Statistics", "Python", "Clinical Data Analytics", "GCP Clinical Trial Protocols", "Pandas & Tabular Wrangling"],
    location: "Vadodara / Mumbai",
    stipend: "₹9.0 - 11.5 LPA",
    deadline: "2026-12-12",
    description: "Design statistical analysis plans (SAP), analyze multi-arm clinical trials data for botanical therapeutic efficacy, and prepare CDISC SDTM datasets."
  },

  // ── 3. MICRO-GIGS & RAPID TASK BOUNTIES (5 Opportunities) ─────────────────────
  {
    id: "opp-gig-01",
    title: "Cleanse & Standardize 100 Ashwagandha Trial Records",
    company: "Dabur Research Labs",
    type: "Micro-Gig",
    skills: ["Pandas & Tabular Wrangling", "Phytochemical Extraction", "Python", "Good Laboratory Practice (GLP)"],
    location: "Remote (10 Days)",
    stipend: "₹8,500 Task Bounty",
    deadline: "2026-11-10",
    description: "Harmonize disparate chromatographic and clinical data sheets into a unified schema for multi-center botanical consistency analysis."
  },
  {
    id: "opp-gig-02",
    title: "Annotate Classical Charaka Botanical Lexicon Synonyms",
    company: "AIIA Digital Informatics Cell",
    type: "Micro-Gig",
    skills: ["NLP for Classical Sanskrit Texts", "Ayurvedic Pharmacognosy", "Scientific Documentation & Dossier Writing"],
    location: "Remote (7 Days)",
    stipend: "₹6,000 Task Bounty",
    deadline: "2026-11-12",
    description: "Tag 250 classical botanical synonyms and cross-reference with Kew Botanical Index taxonomy for machine-learning named entity recognition."
  },
  {
    id: "opp-gig-03",
    title: "Execute In-Silico Molecular Docking for 20 Bioactive Ligands",
    company: "Himalaya Wellness Research Cell",
    type: "Micro-Gig",
    skills: ["In-Silico Molecular Docking", "Protein-Ligand Interaction Profiling", "ADMET Property Prediction"],
    location: "Remote (14 Days)",
    stipend: "₹12,000 Task Bounty",
    deadline: "2026-11-16",
    description: "Run AutoDock Vina binding simulations of gingerol and piperine derivatives against inflammatory cytokine receptor targets."
  },
  {
    id: "opp-gig-04",
    title: "Build Responsive Chart.js Analytics Widget for College Portal",
    company: "Nexus EdTech Solutions",
    type: "Micro-Gig",
    skills: ["JavaScript", "Data Visualization & Charting", "Tailwind CSS & Responsive UI"],
    location: "Remote (5 Days)",
    stipend: "₹7,500 Task Bounty",
    deadline: "2026-11-08",
    description: "Develop reusable radar and stacked-bar chart web components displaying NAAC criteria attainment."
  },
  {
    id: "opp-gig-05",
    title: "Draft SOP for HPTLC Mobile Phase Solvent Recovery",
    company: "All India Institute of Ayurveda Lab Cell",
    type: "Micro-Gig",
    skills: ["Good Laboratory Practice (GLP)", "HPTLC Fingerprinting", "Scientific Documentation & Dossier Writing"],
    location: "Remote (4 Days)",
    stipend: "₹4,500 Task Bounty",
    deadline: "2026-11-05",
    description: "Formulate standard operating procedure complying with green laboratory protocols for solvent recycling in TLC chambers."
  },

  // ── 4. HACKATHONS & INNOVATION CHALLENGES (2 Opportunities) ───────────────────
  {
    id: "opp-hack-01",
    title: "National Ayush AI & Prakriti Prediction Hackathon 2026",
    company: "Ministry of Ayush & AIIA",
    type: "Hackathon",
    skills: ["Machine Learning", "Python", "Health Informatics", "Large Language Models (LLMs) & Prompting", "React"],
    location: "New Delhi / Hybrid",
    stipend: "Cash Bounty: ₹3,50,000",
    deadline: "2026-12-01",
    description: "Nationwide hackathon challenge to develop multi-modal computer vision and speech diagnostic tools for constitution (Prakriti) assessment."
  },
  {
    id: "opp-hack-02",
    title: "Bio-Tech Sustainable Packaging Grand Challenge",
    company: "Patanjali & NMPB",
    type: "Hackathon",
    skills: ["Herbal Formulation", "Formulation Stability Protocols", "Critical Problem Solving"],
    location: "Haridwar / Virtual",
    stipend: "Cash Bounty: ₹2,00,000",
    deadline: "2026-11-28",
    description: "Develop biodegradable and moisture-barrier packaging solutions for delicate herbal decoctions and volatile essential oils."
  }
];

// Diverse Student Profiles for Multi-Domain Testing
const SEED_CANDIDATES = [
  {
    id: "usr-student-01",
    name: "Aarav Sharma",
    email: "aarav.sharma@aiia.gov.in",
    college: "All India Institute of Ayurveda (AIIA), New Delhi",
    department: "Dravyaguna (Phytochemistry)",
    year: "3rd Year BAMS",
    skills: ["Herbal Formulation", "Ayurvedic Pharmacognosy", "HPTLC Fingerprinting", "Good Laboratory Practice (GLP)", "Python"],
    verified_skills: ["Herbal Formulation", "Pharmacognosy", "HPTLC Fingerprinting", "Good Laboratory Practice (GLP)", "Python"],
    targetRole: "Herbal Formulation Scientist",
    xp: 1450,
    readinessScore: 84,
    status: "Ready for Interview"
  },
  {
    id: "usr-student-02",
    name: "Kavya Singh",
    email: "kavya@nexus.edu",
    college: "AIIA New Delhi & IIT Delhi Joint Cell",
    department: "Health Informatics & Data Science",
    year: "Postgraduate Scholar",
    skills: ["Python", "Health Informatics", "NLP for Classical Sanskrit Texts", "SQL & Relational Databases", "Machine Learning"],
    verified_skills: ["Python", "NLP for Classical Sanskrit Texts", "Machine Learning", "Health Informatics"],
    targetRole: "Ayush Health-Tech & NLP Specialist",
    xp: 1820,
    readinessScore: 91,
    status: "Shortlisted"
  },
  {
    id: "usr-student-03",
    name: "Priya Nair",
    email: "priya@nexus.edu",
    college: "Gujarat Ayurved University, Jamnagar",
    department: "Pharmaceutical Chemistry",
    year: "Final Year",
    skills: ["In-Silico Molecular Docking", "Phytochemical Extraction", "HPTLC Fingerprinting", "ADMET Property Prediction", "Python"],
    verified_skills: ["In-Silico Molecular Docking", "HPTLC Fingerprinting", "Phytochemical Extraction"],
    targetRole: "Bioactive Lead Optimization Scientist",
    xp: 1640,
    readinessScore: 88,
    status: "Top Applicant"
  },
  {
    id: "usr-student-04",
    name: "Rohan Sharma",
    email: "rohan@nexus.edu",
    college: "National Institute of Ayurveda (NIA), Jaipur",
    department: "Quality Assurance & Standardization",
    year: "3rd Year",
    skills: ["HPLC Analysis", "Good Laboratory Practice (GLP)", "Good Manufacturing Practice (GMP)", "Pharmacopeial Monograph Standards"],
    verified_skills: ["Good Laboratory Practice (GLP)", "HPLC Analysis", "GMP"],
    targetRole: "Quality Control & Regulatory Affairs Analyst",
    xp: 1320,
    readinessScore: 82,
    status: "Under Review"
  },
  {
    id: "usr-student-05",
    name: "Arjun Patel",
    email: "arjun@nexus.edu",
    college: "Faculty of Ayurveda, BHU Varanasi",
    department: "Computer Science & Bioinformatics",
    year: "4th Year B.Tech / Bio",
    skills: ["JavaScript", "TypeScript", "Node.js", "React", "Docker & Containerization", "RESTful API Architecture"],
    verified_skills: ["JavaScript", "Node.js", "React", "RESTful API Architecture"],
    targetRole: "Full Stack Software Engineer",
    xp: 1950,
    readinessScore: 89,
    status: "Offer Extended"
  },
  {
    id: "usr-student-06",
    name: "Sneha Reddy",
    email: "sneha@nexus.edu",
    college: "Institute of Medical Sciences, BHU",
    department: "Bio-Statistics & Epidemiology",
    year: "2nd Year M.Sc.",
    skills: ["Bio-Statistics", "Python", "Pandas & Tabular Wrangling", "Clinical Data Analytics", "Scikit-Learn"],
    verified_skills: ["Bio-Statistics", "Python", "Pandas & Tabular Wrangling"],
    targetRole: "Data Scientist & ML Engineer",
    xp: 1510,
    readinessScore: 86,
    status: "Ready for Interview"
  }
];

// Diverse Faculty Profiles for Academician Hub Matching
const SEED_FACULTY = [
  {
    id: "usr-academy-01",
    name: "Dr. Rajesh Sharma",
    email: "rajesh.sharma@aiia.gov.in",
    institution: "All India Institute of Ayurveda",
    department: "Dravyaguna & Ayurvedic Pharmacology",
    designation: "Dean & Professor",
    expertise: ["Ayurvedic Pharmacognosy", "Herbal Formulation", "HPTLC Fingerprinting", "Good Laboratory Practice (GLP)", "Curriculum Modernization"],
    publications: 34,
    patents: 3,
    activeGrants: ["cg-01"]
  },
  {
    id: "usr-faculty-02",
    name: "Dr. Sneha Kulkarni",
    email: "sneha.faculty@aiia.gov.in",
    institution: "All India Institute of Ayurveda",
    department: "Ayush Health Informatics",
    designation: "Associate Professor",
    expertise: ["NLP for Classical Sanskrit Texts", "Health Informatics", "Machine Learning", "Electronic Health Records (EHR)"],
    publications: 21,
    patents: 1,
    activeGrants: ["cg-02"]
  }
];

module.exports = {
  SEED_OPPORTUNITIES,
  SEED_CANDIDATES,
  SEED_FACULTY
};
