/**
 * JOBLEX Decision Tree & Personalized Roadmap Engine
 * Core service for algorithmic target role classification and dynamic roadmap synthesis
 * Implements: Student Profile → Skill Gap Analysis → Decision Tree → Target Role → Personalized Roadmap
 */

const DB = require('../data/database');

/**
 * 88-Skill Ontology for Gap Analysis
 * Maps each role to required skills with importance weights
 */
const ROLE_BENCHMARKS = {
  'fullstack-software-engineer': {
    roleId: 'fullstack-software-engineer',
    title: 'Full Stack Software Engineer',
    sector: 'Technology & Software',
    benchmarkSkills: [
      { skill: 'JavaScript (ES2024+)', category: 'Frontend', weight: 1.0, required: true },
      { skill: 'TypeScript', category: 'Frontend', weight: 0.9, required: true },
      { skill: 'React.js / Next.js', category: 'Frontend', weight: 1.0, required: true },
      { skill: 'Node.js / Express / Fastify', category: 'Backend', weight: 1.0, required: true },
      { skill: 'PostgreSQL & Supabase', category: 'Database', weight: 0.9, required: true },
      { skill: 'RESTful Architecture', category: 'Backend', weight: 0.9, required: true },
      { skill: 'GraphQL', category: 'Backend', weight: 0.7, required: false },
      { skill: 'Docker Containerization', category: 'DevOps', weight: 0.8, required: true },
      { skill: 'GitHub Actions CI/CD', category: 'DevOps', weight: 0.7, required: true },
      { skill: 'Redis Caching', category: 'Backend', weight: 0.6, required: false },
      { skill: 'WebSockets / Realtime', category: 'Backend', weight: 0.5, required: false },
      { skill: 'System Design', category: 'Architecture', weight: 0.7, required: false }
    ],
    marketDemand: 'Very High',
    avgSalary: '₹12-25 LPA',
    growthRate: '22% YoY'
  },
  'data-scientist-ml-engineer': {
    roleId: 'data-scientist-ml-engineer',
    title: 'Data Scientist & ML Engineer',
    sector: 'Artificial Intelligence & Data',
    benchmarkSkills: [
      { skill: 'Python 3.12+', category: 'Programming', weight: 1.0, required: true },
      { skill: 'NumPy & Pandas', category: 'Data Engineering', weight: 0.9, required: true },
      { skill: 'Scikit-Learn', category: 'ML', weight: 0.9, required: true },
      { skill: 'PyTorch', category: 'Deep Learning', weight: 1.0, required: true },
      { skill: 'TensorFlow', category: 'Deep Learning', weight: 0.7, required: false },
      { skill: 'Transformers & Attention', category: 'Deep Learning', weight: 0.9, required: true },
      { skill: 'LangChain & LangGraph', category: 'LLM Orchestration', weight: 0.8, required: true },
      { skill: 'Vector Databases (Qdrant/Pinecone)', category: 'MLOps', weight: 0.8, required: true },
      { skill: 'MLflow & DVC', category: 'MLOps', weight: 0.7, required: false },
      { skill: 'FastAPI Model Serving', category: 'MLOps', weight: 0.8, required: true },
      { skill: 'Docker & Kubernetes', category: 'MLOps', weight: 0.7, required: false },
      { skill: 'Model Monitoring & Drift Detection', category: 'MLOps', weight: 0.6, required: false }
    ],
    marketDemand: 'Very High',
    avgSalary: '₹15-30 LPA',
    growthRate: '28% YoY'
  },
  'ayush-health-nlp': {
    roleId: 'ayush-health-nlp',
    title: 'Ayush Health-Tech & Bio-NLP Specialist',
    sector: 'Healthcare & Life Sciences',
    benchmarkSkills: [
      { skill: 'Python', category: 'Programming', weight: 1.0, required: true },
      { skill: 'Natural Language Processing', category: 'NLP', weight: 1.0, required: true },
      { skill: 'Biomedical NER', category: 'NLP', weight: 0.9, required: true },
      { skill: 'Sanskrit NLP / Classical Text Processing', category: 'NLP', weight: 0.8, required: true },
      { skill: 'BioBERT / ClinicalBERT', category: 'NLP', weight: 0.9, required: true },
      { skill: 'FastAPI Serving', category: 'Backend', weight: 0.8, required: true },
      { skill: 'Vector Databases (Qdrant)', category: 'MLOps', weight: 0.8, required: true },
      { skill: 'PubMed / MeSH Ontologies', category: 'Domain', weight: 0.7, required: true },
      { skill: 'HL7 / FHIR Standards', category: 'Health Informatics', weight: 0.7, required: false },
      { skill: 'Molecular Docking (AutoDock Vina)', category: 'Computational Bio', weight: 0.6, required: false },
      { skill: 'Network Pharmacology', category: 'Computational Bio', weight: 0.6, required: false },
      { skill: 'HIPAA Compliance', category: 'Regulatory', weight: 0.5, required: false }
    ],
    marketDemand: 'Very High',
    avgSalary: '₹10-22 LPA',
    growthRate: '35% YoY'
  },
  'quality-control-regulatory': {
    roleId: 'quality-control-regulatory',
    title: 'Quality Control & Regulatory Affairs Analyst',
    sector: 'Healthcare & Life Sciences',
    benchmarkSkills: [
      { skill: 'Good Laboratory Practice (GLP)', category: 'Quality', weight: 1.0, required: true },
      { skill: 'Good Manufacturing Practice (GMP)', category: 'Quality', weight: 1.0, required: true },
      { skill: 'HPLC Analysis', category: 'Analytical', weight: 0.9, required: true },
      { skill: 'HPTLC Fingerprinting', category: 'Analytical', weight: 0.9, required: true },
      { skill: 'LC-MS/MS', category: 'Analytical', weight: 0.8, required: false },
      { skill: 'CTD Dossier Preparation', category: 'Regulatory', weight: 0.9, required: true },
      { skill: 'Stability Testing', category: 'Quality', weight: 0.8, required: true },
      { skill: 'ICH Guidelines (Q1-Q11)', category: 'Regulatory', weight: 0.8, required: true },
      { skill: '21 CFR Part 11 (ELN/LIMS)', category: 'Regulatory', weight: 0.7, required: false },
      { skill: 'Pharmacopeial Standards (API/BP/USP)', category: 'Regulatory', weight: 0.9, required: true },
      { skill: 'Validation Protocols (IQ/OQ/PQ)', category: 'Quality', weight: 0.7, required: false },
      { skill: 'Deviation & CAPA Management', category: 'Quality', weight: 0.6, required: false }
    ],
    marketDemand: 'High',
    avgSalary: '₹8-18 LPA',
    growthRate: '15% YoY'
  },
  'cloud-infrastructure-engineer': {
    roleId: 'cloud-infrastructure-engineer',
    title: 'Cloud Infrastructure Engineer',
    sector: 'Infrastructure & Cloud',
    benchmarkSkills: [
      { skill: 'Linux Kernel & Bash Scripting', category: 'Systems', weight: 1.0, required: true },
      { skill: 'TCP/IP, DNS, SSL/TLS', category: 'Networking', weight: 0.9, required: true },
      { skill: 'Docker & Multi-Stage Builds', category: 'Containers', weight: 1.0, required: true },
      { skill: 'Kubernetes (Pods, Services, Ingress)', category: 'Orchestration', weight: 1.0, required: true },
      { skill: 'Helm Charts', category: 'Orchestration', weight: 0.8, required: true },
      { skill: 'Terraform / OpenTofu', category: 'IaC', weight: 1.0, required: true },
      { skill: 'AWS / GCP Cloud Services', category: 'Cloud', weight: 1.0, required: true },
      { skill: 'GitHub Actions & GitLab CI', category: 'CI/CD', weight: 0.9, required: true },
      { skill: 'ArgoCD & GitOps', category: 'CI/CD', weight: 0.8, required: false },
      { skill: 'Prometheus & Grafana', category: 'Observability', weight: 0.8, required: true },
      { skill: 'OpenTelemetry & Jaeger', category: 'Observability', weight: 0.7, required: false },
      { skill: 'Secrets Management (Vault)', category: 'Security', weight: 0.6, required: false }
    ],
    marketDemand: 'Very High',
    avgSalary: '₹14-28 LPA',
    growthRate: '25% YoY'
  }
};

/**
 * Decision Tree Questions & Logic
 */
const DECISION_TREE_STEPS = [
  {
    id: 'step1',
    question: 'What is your primary domain of interest?',
    key: 'primaryDomain',
    options: [
      { value: 'software-web', label: 'Software & Web Development', description: 'Building web applications, APIs, and full-stack systems' },
      { value: 'ai-data', label: 'AI, Data Science & Machine Learning', description: 'Predictive modeling, deep learning, LLM orchestration' },
      { value: 'pharma-health', label: 'Pharma, Health-Tech & Life Sciences', description: 'Computational biology, clinical informatics, bio-NLP' },
      { value: 'cloud-security', label: 'Cloud Infrastructure & Cybersecurity', description: 'Distributed systems, DevOps, security operations' }
    ]
  },
  {
    id: 'step2a',
    condition: (answers) => answers.primaryDomain === 'software-web',
    question: 'Which technical orientation aligns with your strengths?',
    key: 'technicalOrientation',
    options: [
      { value: 'web-applications', label: 'Web Applications & Product Engineering', description: 'Frontend frameworks, backend APIs, user-facing products' },
      { value: 'systems-architecture', label: 'Systems Architecture & Scalable Backend', description: 'Distributed systems, caching, message queues, microservices' }
    ]
  },
  {
    id: 'step2b',
    condition: (answers) => answers.primaryDomain === 'ai-data',
    question: 'What is your preferred AI specialization?',
    key: 'aiSpecialization',
    options: [
      { value: 'llms-analytics', label: 'LLMs, RAG & Generative AI', description: 'LangGraph, vector search, agentic workflows, prompt engineering' },
      { value: 'ml-engineering', label: 'ML Engineering & MLOps', description: 'Model training, deployment pipelines, monitoring, feature stores' }
    ]
  },
  {
    id: 'step2c',
    condition: (answers) => answers.primaryDomain === 'pharma-health',
    question: 'Where do you want to apply your skills?',
    key: 'healthFocus',
    options: [
      { value: 'computational-informatics', label: 'Computational Informatics & Bio-NLP', description: 'Sanskrit NLP, biomedical text mining, knowledge graphs' },
      { value: 'regulatory-wetlab', label: 'Regulatory Affairs & Quality Control', description: 'GLP/GMP compliance, chromatography, dossier compilation' }
    ]
  },
  {
    id: 'step2d',
    condition: (answers) => answers.primaryDomain === 'cloud-security',
    question: 'Which infrastructure track interests you?',
    key: 'infraTrack',
    options: [
      { value: 'devops-platform', label: 'DevOps & Platform Engineering', description: 'Kubernetes, Terraform, CI/CD, GitOps, observability' },
      { value: 'cybersecurity', label: 'Cybersecurity & Red Teaming', description: 'Penetration testing, SIEM, incident response, forensics' }
    ]
  },
  {
    id: 'step3',
    question: 'What is your preferred learning timeline?',
    key: 'preferredPaceMonths',
    options: [
      { value: 3, label: '3 Months Intensive (Bootcamp Style)', description: 'Full-time commitment, accelerated milestones, high intensity' },
      { value: 6, label: '6 Months Comprehensive (Standard)', description: 'Balanced pace, deep skill building, portfolio projects' },
      { value: 9, label: '9 Months Extended (Deep Mastery)', description: 'Thorough coverage, research projects, advanced specializations' }
    ]
  },
  {
    id: 'step4',
    question: 'What is your current technical comfort level?',
    key: 'technicalComfortLevel',
    options: [
      { value: 'beginner', label: 'Beginner (0-1 years)', description: 'New to the field, need foundational concepts' },
      { value: 'intermediate', label: 'Intermediate (1-3 years)', description: 'Some experience, ready for advanced topics' },
      { value: 'advanced', label: 'Advanced (3+ years)', description: 'Experienced, seeking specialization and leadership' }
    ]
  },
  {
    id: 'step5',
    question: 'What is your primary career goal?',
    key: 'primaryGoal',
    options: [
      { value: 'industry-internship', label: 'Industry Internship', description: 'Gain hands-on experience at a partner company' },
      { value: 'full-time-placement', label: 'Full-Time Placement', description: 'Secure a permanent role at a top employer' },
      { value: 'research-fellowship', label: 'Research Fellowship', description: 'Pursue academic or industrial research' },
      { value: 'entrepreneurship', label: 'Entrepreneurship / Startup', description: 'Build your own product or venture' }
    ]
  }
];

/**
 * Role Resolution Matrix
 * Maps decision tree answers to target roles
 */
const ROLE_RESOLUTION_MATRIX = {
  'software-web': {
    'web-applications': 'fullstack-software-engineer',
    'systems-architecture': 'fullstack-software-engineer' // Could also be cloud but keeping simple
  },
  'ai-data': {
    'llms-analytics': 'data-scientist-ml-engineer',
    'ml-engineering': 'data-scientist-ml-engineer'
  },
  'pharma-health': {
    'computational-informatics': 'ayush-health-nlp',
    'regulatory-wetlab': 'quality-control-regulatory'
  },
  'cloud-security': {
    'devops-platform': 'cloud-infrastructure-engineer',
    'cybersecurity': 'cloud-infrastructure-engineer' // Simplified - cybersecurity is separate role in reality
  }
};

/**
 * Compute skill gap analysis between student's existing skills and role benchmark
 */
function computeSkillGapAnalysis(existingSkills, targetRoleBenchmark) {
  const existingLower = existingSkills.map(s => s.toLowerCase().trim());
  const gaps = [];
  const matched = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  targetRoleBenchmark.benchmarkSkills.forEach(benchmark => {
    totalWeight += benchmark.weight;
    const isMatched = existingLower.some(es =>
      es.includes(benchmark.skill.toLowerCase()) ||
      benchmark.skill.toLowerCase().includes(es)
    );

    if (isMatched) {
      matchedWeight += benchmark.weight;
      matched.push({
        skill: benchmark.skill,
        category: benchmark.category,
        importance: benchmark.weight,
        status: 'VERIFIED'
      });
    } else {
      gaps.push({
        skill: benchmark.skill,
        category: benchmark.category,
        importance: benchmark.weight,
        required: benchmark.required,
        status: 'GAP'
      });
    }
  });

  const compatibilityScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  return {
    compatibilityScore,
    totalSkills: targetRoleBenchmark.benchmarkSkills.length,
    matchedSkills: matched.length,
    gapCount: gaps.length,
    matched,
    gaps: gaps.sort((a, b) => b.importance - a.importance), // Sort by importance
    primarySkillGaps: gaps
      .filter(g => g.required)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)
      .map(g => g.skill)
  };
}

/**
 * Generate personalized 4-phase roadmap based on gaps, timeline, and comfort level
 */
function synthesizePersonalizedRoadmap(gapAnalysis, targetRole, paceMonths, technicalComfortLevel, primaryGoal) {
  const roleBenchmark = ROLE_BENCHMARKS[targetRole.roleId];
  const gaps = gapAnalysis.gaps;
  const requiredGaps = gaps.filter(g => g.required);
  const optionalGaps = gaps.filter(g => !g.required);

  // Distribute skills across phases based on pace
  const skillsPerPhase = paceMonths <= 3 ? 4 : paceMonths <= 6 ? 3 : 2;

  // Phase 1: Foundations (required gaps first)
  const phase1Skills = requiredGaps.slice(0, skillsPerPhase);
  // Phase 2: Core Engineering (remaining required + high-importance optional)
  const phase2Skills = requiredGaps.slice(skillsPerPhase).concat(optionalGaps.slice(0, skillsPerPhase));
  // Phase 3: Applied Projects (optional gaps + integration skills)
  const phase3Skills = optionalGaps.slice(skillsPerPhase, skillsPerPhase * 2);
  // Phase 4: Capstone & Industry Readiness
  const phase4Skills = ['Portfolio Integration', 'Interview Preparation', 'Industry Project'];

  const xpBase = paceMonths <= 3 ? 150 : paceMonths <= 6 ? 100 : 80;

  const phases = [
    {
      phase: 'Phase 1: Foundations',
      timeline: paceMonths <= 3 ? 'Weeks 1-4' : paceMonths <= 6 ? 'Month 1-2' : 'Month 1-3',
      focus: 'Core Fundamentals & Prerequisite Skills',
      xpBounty: xpBase * 2,
      tasks: phase1Skills.map((gap, idx) => ({
        id: `t-${targetRole.roleId}-1-${idx + 1}`,
        title: `Master ${gap.skill}`,
        description: `Build proficiency in ${gap.skill} through guided tutorials and hands-on labs`,
        xp: Math.round(xpBase * (1.0 + idx * 0.1)),
        completed: false,
        skill: gap.skill,
        category: gap.category,
        learningLink: generateLearningLink(gap.skill),
        priority: gap.required ? 'HIGH' : 'MEDIUM'
      })).concat([{
        id: `t-${targetRole.roleId}-1-foundation-checkpoint`,
        title: 'Phase 1 Checkpoint: Foundational Assessment',
        description: 'Complete competency validation quiz for Phase 1 skills',
        xp: Math.round(xpBase * 0.5),
        completed: false,
        skill: 'Assessment',
        category: 'Validation',
        learningLink: '/student-quiz.html',
        priority: 'HIGH'
      }])
    },
    {
      phase: 'Phase 2: Core Engineering',
      timeline: paceMonths <= 3 ? 'Weeks 5-8' : paceMonths <= 6 ? 'Month 3-4' : 'Month 4-6',
      focus: 'Applied Technical Skills & System Building',
      xpBounty: xpBase * 3,
      tasks: phase2Skills.map((gap, idx) => ({
        id: `t-${targetRole.roleId}-2-${idx + 1}`,
        title: `Implement ${gap.skill} Project`,
        description: `Build a portfolio project demonstrating ${gap.skill} in a real-world context`,
        xp: Math.round(xpBase * 1.5 * (1.0 + idx * 0.05)),
        completed: false,
        skill: gap.skill,
        category: gap.category,
        learningLink: generateLearningLink(gap.skill),
        priority: gap.required ? 'HIGH' : 'MEDIUM'
      })).concat([{
        id: `t-${targetRole.roleId}-2-integration`,
        title: 'Integration Mini-Project',
        description: 'Combine Phase 1 & 2 skills into a cohesive mini-application',
        xp: Math.round(xpBase * 2),
        completed: false,
        skill: 'System Integration',
        category: 'Project',
        learningLink: '/student-roadmap.html',
        priority: 'HIGH'
      }])
    },
    {
      phase: 'Phase 3: Advanced Specialization',
      timeline: paceMonths <= 3 ? 'Weeks 9-12' : paceMonths <= 6 ? 'Month 5' : 'Month 7-8',
      focus: 'Specialized Topics & Industry Patterns',
      xpBounty: xpBase * 2,
      tasks: phase3Skills.map((gap, idx) => ({
        id: `t-${targetRole.roleId}-3-${idx + 1}`,
        title: `Advanced ${gap.skill}`,
        description: `Deep-dive into advanced ${gap.skill} patterns used in production systems`,
        xp: Math.round(xpBase * 2 * (1.0 + idx * 0.05)),
        completed: false,
        skill: gap.skill,
        category: gap.category,
        learningLink: generateLearningLink(gap.skill),
        priority: 'MEDIUM'
      })).concat([
        {
          id: `t-${targetRole.roleId}-3-capstone-design`,
          title: 'Capstone Project Design',
          description: 'Design end-to-end capstone project architecture with mentor review',
          xp: Math.round(xpBase * 2),
          completed: false,
          skill: 'System Design',
          category: 'Architecture',
          learningLink: '/student-roadmap.html',
          priority: 'HIGH'
        },
        {
          id: `t-${targetRole.roleId}-3-mock-interview`,
          title: 'Technical Mock Interview',
          description: 'Complete a simulated technical interview with industry mentor',
          xp: Math.round(xpBase * 1.5),
          completed: false,
          skill: 'Interview Prep',
          category: 'Career',
          learningLink: '/student-zulu.html',
          priority: 'HIGH'
        }
      ])
    },
    {
      phase: 'Phase 4: Capstone & Industry Launch',
      timeline: paceMonths <= 3 ? 'Weeks 13-16' : paceMonths <= 6 ? 'Month 6' : 'Month 9',
      focus: 'Production Capstone, Portfolio & Placement Readiness',
      xpBounty: xpBase * 3,
      tasks: [
        {
          id: `t-${targetRole.roleId}-4-capstone-build`,
          title: 'Build & Deploy Capstone Project',
          description: 'Complete end-to-end capstone with CI/CD, monitoring, and documentation',
          xp: Math.round(xpBase * 3),
          completed: false,
          skill: 'Full Stack Development',
          category: 'Capstone',
          learningLink: '/student-portfolio.html',
          priority: 'CRITICAL'
        },
        {
          id: `t-${targetRole.roleId}-4-portfolio`,
          title: 'Polish Verified Portfolio',
          description: 'Finalize portfolio with verified skills, project demos, and testimonials',
          xp: Math.round(xpBase * 1.5),
          completed: false,
          skill: 'Portfolio',
          category: 'Career',
          learningLink: '/student-portfolio.html',
          priority: 'HIGH'
        },
        {
          id: `t-${targetRole.roleId}-4-applications`,
          title: primaryGoal === 'industry-internship'
            ? 'Apply to Top 10 Matching Internships'
            : primaryGoal === 'full-time-placement'
              ? 'Submit Applications to 15 Target Companies'
              : 'Prepare Research Proposal / Startup Pitch',
          description: `Execute ${primaryGoal === 'industry-internship' ? 'internship' : primaryGoal === 'full-time-placement' ? 'job' : 'research/venture'} application strategy`,
          xp: Math.round(xpBase * 2),
          completed: false,
          skill: 'Career Strategy',
          category: 'Placement',
          learningLink: primaryGoal === 'industry-internship' ? '/student-internships.html' : '/student-jobs.html',
          priority: 'CRITICAL'
        },
        {
          id: `t-${targetRole.roleId}-4-final-eval`,
          title: 'Final Technical Evaluation Panel',
          description: 'Present capstone to industry panel for placement readiness certification',
          xp: Math.round(xpBase * 2),
          completed: false,
          skill: 'Technical Communication',
          category: 'Evaluation',
          learningLink: '/student-zulu.html',
          priority: 'CRITICAL'
        }
      ]
    }
  ];

  const totalXp = phases.reduce((sum, p) => sum + p.xpBounty, 0);

  return {
    title: `${paceMonths <= 3 ? 'Accelerated' : 'Comprehensive'} Pathway to ${targetRole.title}`,
    totalDuration: `${paceMonths} Months`,
    estimatedXpAvailable: totalXp,
    phases
  };
}

/**
 * Generate learning resource links for skills
 */
function generateLearningLink(skill) {
  const skillLinks = {
    'JavaScript (ES2024+)': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    'TypeScript': 'https://www.typescriptlang.org/docs/',
    'React.js / Next.js': 'https://nextjs.org/learn',
    'Node.js / Express / Fastify': 'https://nodejs.org/en/learn',
    'PostgreSQL & Supabase': 'https://supabase.com/docs',
    'RESTful Architecture': 'https://restfulapi.net/',
    'GraphQL': 'https://graphql.org/learn/',
    'Docker Containerization': 'https://docs.docker.com/get-started/',
    'GitHub Actions CI/CD': 'https://docs.github.com/en/actions',
    'Redis Caching': 'https://redis.io/learn/',
    'WebSockets / Realtime': 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
    'System Design': 'https://www.systemdesignprimer.com/',
    'Python 3.12+': 'https://docs.python.org/3/tutorial/',
    'NumPy & Pandas': 'https://pandas.pydata.org/docs/getting_started/',
    'Scikit-Learn': 'https://scikit-learn.org/stable/user_guide.html',
    'PyTorch': 'https://pytorch.org/tutorials/',
    'TensorFlow': 'https://www.tensorflow.org/tutorials',
    'Transformers & Attention': 'https://huggingface.co/learn/nlp-course',
    'LangChain & LangGraph': 'https://python.langchain.com/docs/get_started/introduction',
    'Vector Databases (Qdrant/Pinecone)': 'https://qdrant.tech/documentation/',
    'MLflow & DVC': 'https://mlflow.org/docs/latest/tutorials-and-examples/index.html',
    'FastAPI Model Serving': 'https://fastapi.tiangolo.com/tutorial/',
    'Docker & Kubernetes': 'https://kubernetes.io/docs/tutorials/',
    'Model Monitoring & Drift Detection': 'https://www.evidentlyai.com/',
    'Natural Language Processing': 'https://www.nltk.org/book/',
    'Biomedical NER': 'https://github.com/ncbi-nlp/bluebert',
    'Sanskrit NLP / Classical Text Processing': 'https://github.com/AI4Bharat/indic-nlp-library',
    'BioBERT / ClinicalBERT': 'https://huggingface.co/dmis-lab/biobert-v1.1',
    'FastAPI Serving': 'https://fastapi.tiangolo.com/',
    'Vector Databases (Qdrant)': 'https://qdrant.tech/documentation/',
    'PubMed / MeSH Ontologies': 'https://www.ncbi.nlm.nih.gov/mesh/',
    'HL7 / FHIR Standards': 'https://www.hl7.org/fhir/',
    'Molecular Docking (AutoDock Vina)': 'https://vina.scripps.edu/',
    'Network Pharmacology': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7127135/',
    'HIPAA Compliance': 'https://www.hhs.gov/hipaa/',
    'Good Laboratory Practice (GLP)': 'https://www.fda.gov/good-laboratory-practice',
    'Good Manufacturing Practice (GMP)': 'https://www.fda.gov/drugs/pharmaceutical-quality-resources/current-good-manufacturing-practice-cgmp-regulations',
    'HPLC Analysis': 'https://www.waters.com/waters/en_US/HPLC-Basics/nav.htm',
    'HPTLC Fingerprinting': 'https://www.camag.com/en/knowledge-base/hptlc-basics',
    'LC-MS/MS': 'https://www.thermofisher.com/in/en/home/industrial/mass-spectrometry/liquid-chromatography-mass-spectrometry-lc-ms.html',
    'CTD Dossier Preparation': 'https://www.ich.org/page/ctd-dossier',
    'Stability Testing': 'https://www.ich.org/page/ich-guidelines',
    'ICH Guidelines (Q1-Q11)': 'https://www.ich.org/page/quality-guidelines',
    '21 CFR Part 11 (ELN/LIMS)': 'https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/part-11',
    'Pharmacopeial Standards (API/BP/USP)': 'https://www.usp.org/',
    'Validation Protocols (IQ/OQ/PQ)': 'https://www.ispe.org/validation',
    'Deviation & CAPA Management': 'https://www.fda.gov/medical-devices/postmarket-requirements-devices/corrective-and-preventive-action-capa',
    'Linux Kernel & Bash Scripting': 'https://linuxjourney.com/',
    'TCP/IP, DNS, SSL/TLS': 'https://developer.mozilla.org/en-US/docs/Web/Performance/HTTP/HTTP2',
    'Docker & Multi-Stage Builds': 'https://docs.docker.com/develop/develop-images/multistage-build/',
    'Kubernetes (Pods, Services, Ingress)': 'https://kubernetes.io/docs/concepts/',
    'Helm Charts': 'https://helm.sh/docs/topics/charts/',
    'Terraform / OpenTofu': 'https://developer.hashicorp.com/terraform/tutorials',
    'AWS / GCP Cloud Services': 'https://aws.amazon.com/getting-started/',
    'GitHub Actions & GitLab CI': 'https://docs.github.com/en/actions',
    'ArgoCD & GitOps': 'https://argo-cd.readthedocs.io/en/stable/',
    'Prometheus & Grafana': 'https://prometheus.io/docs/introduction/overview/',
    'OpenTelemetry & Jaeger': 'https://opentelemetry.io/docs/',
    'Secrets Management (Vault)': 'https://developer.hashicorp.com/vault/tutorials'
  };
  return skillLinks[skill] || `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial')}`;
}

/**
 * Find matching opportunities for the target role
 */
function findMatchingOpportunities(targetRoleId, studentProfile) {
  const opportunities = DB.opportunities || [];
  const roleBenchmark = ROLE_BENCHMARKS[targetRoleId];
  if (!roleBenchmark) return [];

  const roleSkills = roleBenchmark.benchmarkSkills.map(s => s.skill.toLowerCase());

  return opportunities
    .filter(opp => {
      const oppSkills = (opp.skills || []).map(s => s.toLowerCase());
      const overlap = roleSkills.filter(rs => oppSkills.some(os => os.includes(rs) || rs.includes(os))).length;
      return overlap >= 2; // At least 2 skill matches
    })
    .map(opp => {
      const oppSkills = (opp.skills || []).map(s => s.toLowerCase());
      const matchedSkills = roleSkills.filter(rs => oppSkills.some(os => os.includes(rs) || rs.includes(os)));
      const fitScore = Math.min(95, Math.round((matchedSkills.length / roleSkills.length) * 100 + 30));
      return {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        location: opp.location,
        stipend: opp.stipend,
        deadline: opp.deadline,
        fitScore,
        matchedSkills: matchedSkills.slice(0, 5),
        description: opp.description
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 5);
}

/**
 * Generate decision tree reasoning path
 */
function generateDecisionPath(answers, targetRole) {
  const path = [];

  // Step 1
  const step1Option = DECISION_TREE_STEPS[0].options.find(o => o.value === answers.primaryDomain);
  path.push(`Domain: ${step1Option?.label || answers.primaryDomain}`);

  // Step 2 (conditional)
  if (answers.primaryDomain === 'software-web' && answers.technicalOrientation) {
    const opt = DECISION_TREE_STEPS[1].options.find(o => o.value === answers.technicalOrientation);
    path.push(`Orientation: ${opt?.label || answers.technicalOrientation}`);
  } else if (answers.primaryDomain === 'ai-data' && answers.aiSpecialization) {
    const opt = DECISION_TREE_STEPS[2].options.find(o => o.value === answers.aiSpecialization);
    path.push(`Specialization: ${opt?.label || answers.aiSpecialization}`);
  } else if (answers.primaryDomain === 'pharma-health' && answers.healthFocus) {
    const opt = DECISION_TREE_STEPS[3].options.find(o => o.value === answers.healthFocus);
    path.push(`Focus: ${opt?.label || answers.healthFocus}`);
  } else if (answers.primaryDomain === 'cloud-security' && answers.infraTrack) {
    const opt = DECISION_TREE_STEPS[4].options.find(o => o.value === answers.infraTrack);
    path.push(`Track: ${opt?.label || answers.infraTrack}`);
  }

  // Step 3
  path.push(`Timeline: ${answers.preferredPaceMonths} Months (${answers.preferredPaceMonths <= 3 ? 'Intensive' : answers.preferredPaceMonths <= 6 ? 'Standard' : 'Extended'})`);

  // Step 4
  path.push(`Skill Baseline: ${answers.technicalComfortLevel.charAt(0).toUpperCase() + answers.technicalComfortLevel.slice(1)}`);

  // Step 5
  const goalOpt = DECISION_TREE_STEPS[5].options.find(o => o.value === answers.primaryGoal);
  path.push(`Goal: ${goalOpt?.label || answers.primaryGoal}`);

  // Final resolution
  path.push(`Prescribed Specialty: ${targetRole.title}`);

  return path;
}

/**
 * Main Decision Tree Evaluation Function
 */
async function evaluateDecisionTree(studentInput) {
  const {
    academicDepartment,
    careerAmbition,
    technicalComfortLevel,
    preferredPaceMonths,
    existingSkills = [],
    primaryGoal
  } = studentInput;

  // Build answers object for decision tree traversal
  const answers = {
    primaryDomain: mapCareerAmbitionToDomain(careerAmbition, academicDepartment),
    technicalComfortLevel,
    preferredPaceMonths: parseInt(preferredPaceMonths, 10) || 6,
    primaryGoal: primaryGoal || 'industry-internship',
    existingSkills
  };

  // Resolve step 2 based on primary domain
  if (answers.primaryDomain === 'software-web') {
    answers.technicalOrientation = 'web-applications'; // Default
  } else if (answers.primaryDomain === 'ai-data') {
    answers.aiSpecialization = 'llms-analytics'; // Default
  } else if (answers.primaryDomain === 'pharma-health') {
    answers.healthFocus = academicDepartment?.toLowerCase().includes('informatics') || academicDepartment?.toLowerCase().includes('data')
      ? 'computational-informatics' : 'regulatory-wetlab';
  } else if (answers.primaryDomain === 'cloud-security') {
    answers.infraTrack = 'devops-platform'; // Default
  }

  // Resolve target role
  const roleId = ROLE_RESOLUTION_MATRIX[answers.primaryDomain]?.[
    answers.technicalOrientation || answers.aiSpecialization || answers.healthFocus || answers.infraTrack
  ] || 'fullstack-software-engineer';

  const targetRole = ROLE_BENCHMARKS[roleId];

  // Compute skill gap analysis
  const gapAnalysis = computeSkillGapAnalysis(existingSkills, targetRole);

  // Synthesize personalized roadmap
  const personalizedRoadmap = synthesizePersonalizedRoadmap(
    gapAnalysis,
    targetRole,
    answers.preferredPaceMonths,
    answers.technicalComfortLevel,
    answers.primaryGoal
  );

  // Find matching opportunities
  const matchingOpportunities = findMatchingOpportunities(roleId, studentInput);

  // Generate decision path reasoning
  const decisionPath = generateDecisionPath(answers, targetRole);

  return {
    success: true,
    decisionPath,
    targetRole: {
      roleId: targetRole.roleId,
      title: targetRole.title,
      benchmarkCompatibility: gapAnalysis.compatibilityScore,
      primarySkillGaps: gapAnalysis.primarySkillGaps,
      marketDemandLevel: targetRole.marketDemand,
      sector: targetRole.sector,
      avgSalary: targetRole.avgSalary,
      growthRate: targetRole.growthRate
    },
    personalizedRoadmap,
    matchingOpportunities,
    skillGapAnalysis: gapAnalysis
  };
}

/**
 * Map career ambition and academic department to primary domain
 */
function mapCareerAmbitionToDomain(careerAmbition, academicDepartment) {
  const ambition = (careerAmbition || '').toLowerCase();
  const dept = (academicDepartment || '').toLowerCase();

  // Health-tech / Pharma indicators
  if (ambition.includes('health') || ambition.includes('pharma') || ambition.includes('bio') || ambition.includes('ayush') || ambition.includes('clinical') ||
      dept.includes('health') || dept.includes('pharma') || dept.includes('bio') || dept.includes('ayush') || dept.includes('informatics') || dept.includes('life science')) {
    return 'pharma-health';
  }

  // AI / Data indicators
  if (ambition.includes('ai') || ambition.includes('machine learning') || ambition.includes('data science') || ambition.includes('ml') || ambition.includes('deep learning') || ambition.includes('nlp') ||
      dept.includes('computer science') || dept.includes('data science') || dept.includes('artificial intelligence') || dept.includes('statistics')) {
    return 'ai-data';
  }

  // Cloud / Security indicators
  if (ambition.includes('cloud') || ambition.includes('devops') || ambition.includes('infrastructure') || ambition.includes('security') || ambition.includes('cyber') || ambition.includes('kubernetes') || ambition.includes('docker') ||
      dept.includes('cloud') || dept.includes('network') || dept.includes('security')) {
    return 'cloud-security';
  }

  // Default to software/web
  return 'software-web';
}

module.exports = {
  evaluateDecisionTree,
  ROLE_BENCHMARKS,
  DECISION_TREE_STEPS,
  ROLE_RESOLUTION_MATRIX,
  computeSkillGapAnalysis,
  synthesizePersonalizedRoadmap,
  findMatchingOpportunities,
  generateDecisionPath,
  mapCareerAmbitionToDomain
};