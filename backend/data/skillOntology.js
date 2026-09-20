/**
 * JOBLEX Canonical Skill Ontology & Taxonomy
 * 85+ Skills with Categories, Importance Weights, Aliases, and Role Benchmarks
 * Ministry of Ayush & Corporate Industry Partners | Problem Statement ID: 26044
 */

const SKILL_ONTOLOGY = [
  // ── 1. AYURVEDIC & CLASSICAL PHARMACOLOGY (18 Skills) ──────────────────────────
  { id: 'ayur-01', name: 'Herbal Formulation', category: 'Ayush Pharmacology', weight: 1.25, aliases: ['herbal compounding', 'ayurvedic formulation', 'kwatha preparation', 'vati formulation', 'bhasma processing'] },
  { id: 'ayur-02', name: 'Ayurvedic Pharmacognosy', category: 'Ayush Pharmacology', weight: 1.2, aliases: ['pharmacognosy', 'botanical identification', 'dravyaguna vijnana', 'medicinal plants'] },
  { id: 'ayur-03', name: 'HPTLC Fingerprinting', category: 'Ayush Pharmacology', weight: 1.3, aliases: ['hptlc', 'high performance thin layer chromatography', 'chromatographic fingerprinting', 'marker profiling'] },
  { id: 'ayur-04', name: 'HPLC Analysis', category: 'Ayush Pharmacology', weight: 1.25, aliases: ['hplc', 'high performance liquid chromatography', 'quantitative chromatography'] },
  { id: 'ayur-05', name: 'Phytochemical Extraction', category: 'Ayush Pharmacology', weight: 1.15, aliases: ['solvent extraction', 'soxhlet extraction', 'fractionation', 'alkaloid extraction'] },
  { id: 'ayur-06', name: 'Good Laboratory Practice (GLP)', category: 'Ayush Pharmacology', weight: 1.1, aliases: ['glp compliance', 'glp standards', 'nmpb lab guidelines', 'nmpb glp'] },
  { id: 'ayur-07', name: 'Good Manufacturing Practice (GMP)', category: 'Ayush Pharmacology', weight: 1.15, aliases: ['gmp compliance', 'ayush gmp', 'schedule t compliance'] },
  { id: 'ayur-08', name: 'Spectrophotometry & Spectroscopy', category: 'Ayush Pharmacology', weight: 1.1, aliases: ['uv-vis', 'uv-visible spectroscopy', 'ftir spectroscopy', 'nmr profiling'] },
  { id: 'ayur-09', name: 'Formulation Stability Protocols', category: 'Ayush Pharmacology', weight: 1.15, aliases: ['accelerated stability testing', 'shelf-life determination', 'ich stability guidelines'] },
  { id: 'ayur-10', name: 'Pharmacopeial Monograph Standards', category: 'Ayush Pharmacology', weight: 1.2, aliases: ['ayurvedic pharmacopoeia of india', 'api monograph', 'pharmacopeial compliance'] },
  { id: 'ayur-11', name: 'Herbal Raw Material Standardization', category: 'Ayush Pharmacology', weight: 1.1, aliases: ['crude drug authentication', 'foreign matter analysis', 'ash value assay'] },
  { id: 'ayur-12', name: 'Traditional Toxicology & Shodhana', category: 'Ayush Pharmacology', weight: 1.05, aliases: ['shodhana', 'mineral detoxification', 'heavy metal limit testing', 'rasashastra'] },
  { id: 'ayur-13', name: 'Prakriti Clinical Assessment', category: 'Ayush Pharmacology', weight: 1.0, aliases: ['dosha profiling', 'prakriti analysis', 'ayurvedic diagnostics'] },
  { id: 'ayur-14', name: 'In-Vitro Bio-Assays', category: 'Ayush Pharmacology', weight: 1.15, aliases: ['antioxidant assay', 'dpph assay', 'antimicrobial assay', 'cell viability assay'] },
  { id: 'ayur-15', name: 'GCP Clinical Trial Protocols', category: 'Ayush Pharmacology', weight: 1.15, aliases: ['gcp', 'good clinical practice', 'ctri protocol', 'clinical trial management'] },
  { id: 'ayur-16', name: 'Nanomedicine in Ayurveda', category: 'Ayush Pharmacology', weight: 1.2, aliases: ['nano-herbal', 'bhasma nanoparticles', 'phytosome technology', 'polyherbal nano-suspension'] },
  { id: 'ayur-17', name: 'Regulatory Dossier Preparation', category: 'Ayush Pharmacology', weight: 1.1, aliases: ['ctd dossier', 'ayush export clearance', 'who copp', 'fssai nutraceuticals'] },
  { id: 'ayur-18', name: 'Microbial Contamination Testing', category: 'Ayush Pharmacology', weight: 1.05, aliases: ['pathogen screening', 'total viable aerobic count', 'bioburden testing'] },

  // ── 2. HEALTH-TECH, BIO-INFORMATICS & SANSKRIT NLP (14 Skills) ───────────────
  { id: 'ht-01', name: 'In-Silico Molecular Docking', category: 'Health-Tech & Bio-Informatics', weight: 1.25, aliases: ['autodock', 'molecular docking', 'binding affinity', 'ligand docking', 'pyrx'] },
  { id: 'ht-02', name: 'NLP for Classical Sanskrit Texts', category: 'Health-Tech & Bio-Informatics', weight: 1.3, aliases: ['sanskrit nlp', 'classical text mining', 'charaka text processing', 'indic nlp'] },
  { id: 'ht-03', name: 'Health Informatics', category: 'Health-Tech & Bio-Informatics', weight: 1.2, aliases: ['healthcare informatics', 'ayush grid', 'ehr analysis', 'health data management'] },
  { id: 'ht-04', name: 'Chemoinformatics', category: 'Health-Tech & Bio-Informatics', weight: 1.2, aliases: ['pubchem mining', 'smiles notation', 'molecular fingerprinting', 'qsar modeling'] },
  { id: 'ht-05', name: 'Clinical Data Analytics', category: 'Health-Tech & Bio-Informatics', weight: 1.15, aliases: ['clinical analytics', 'epidemiological data', 'patient registry analysis'] },
  { id: 'ht-06', name: 'Electronic Health Records (EHR)', category: 'Health-Tech & Bio-Informatics', weight: 1.05, aliases: ['ehr', 'emr', 'fhir standards', 'ayush ehr'] },
  { id: 'ht-07', name: 'Bio-Statistics', category: 'Health-Tech & Bio-Informatics', weight: 1.15, aliases: ['biostatistical analysis', 'p-value hypothesis testing', 'anova', 'survival analysis'] },
  { id: 'ht-08', name: 'Molecular Dynamics Simulation', category: 'Health-Tech & Bio-Informatics', weight: 1.25, aliases: ['gromacs', 'amber', 'md simulation', 'rmsd trajectory'] },
  { id: 'ht-09', name: 'Protein-Ligand Interaction Profiling', category: 'Health-Tech & Bio-Informatics', weight: 1.2, aliases: ['interaction diagrams', 'pymol', 'discovery studio', 'hydrogen bonding analysis'] },
  { id: 'ht-10', name: 'Medical Ontology & SNOMED CT', category: 'Health-Tech & Bio-Informatics', weight: 1.1, aliases: ['namaste portal ontology', 'icd-11 tm-2', 'snomed', 'ayush terminology'] },
  { id: 'ht-11', name: 'ADMET Property Prediction', category: 'Health-Tech & Bio-Informatics', weight: 1.2, aliases: ['swissadme', 'pharmacokinetics prediction', 'toxicity profiling', 'lipinski rule'] },
  { id: 'ht-12', name: 'Genomic & Transcriptomic Profiling', category: 'Health-Tech & Bio-Informatics', weight: 1.2, aliases: ['rna-seq', 'gene expression', 'microarray analysis', 'target identification'] },
  { id: 'ht-13', name: 'Network Pharmacology', category: 'Health-Tech & Bio-Informatics', weight: 1.25, aliases: ['cytoscape', 'target network', 'herb-target-disease network'] },
  { id: 'ht-14', name: 'Bio-Python & SeqIO', category: 'Health-Tech & Bio-Informatics', weight: 1.1, aliases: ['biopython', 'sequence analysis', 'fasta parsing'] },

  // ── 3. COMPUTER SCIENCE & SOFTWARE ENGINEERING (20 Skills) ────────────────────
  { id: 'cs-01', name: 'Python', category: 'Software Engineering', weight: 1.2, aliases: ['python3', 'py', 'python programming'] },
  { id: 'cs-02', name: 'JavaScript', category: 'Software Engineering', weight: 1.15, aliases: ['js', 'es6', 'modern javascript', 'ecmascript'] },
  { id: 'cs-03', name: 'TypeScript', category: 'Software Engineering', weight: 1.2, aliases: ['ts', 'typed javascript'] },
  { id: 'cs-04', name: 'Node.js', category: 'Software Engineering', weight: 1.2, aliases: ['nodejs', 'node backend', 'node runtime'] },
  { id: 'cs-05', name: 'Express.js', category: 'Software Engineering', weight: 1.15, aliases: ['express', 'express server', 'express rest api'] },
  { id: 'cs-06', name: 'React', category: 'Software Engineering', weight: 1.2, aliases: ['reactjs', 'react.js', 'react components', 'react hooks'] },
  { id: 'cs-07', name: 'HTML5 & Semantic Markup', category: 'Software Engineering', weight: 1.0, aliases: ['html', 'html5', 'semantic web'] },
  { id: 'cs-08', name: 'Tailwind CSS & Responsive UI', category: 'Software Engineering', weight: 1.05, aliases: ['tailwind', 'tailwindcss', 'css3', 'responsive design'] },
  { id: 'cs-09', name: 'RESTful API Architecture', category: 'Software Engineering', weight: 1.2, aliases: ['rest api', 'api design', 'restful services', 'endpoints'] },
  { id: 'cs-10', name: 'SQL & Relational Databases', category: 'Software Engineering', weight: 1.2, aliases: ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'rdbms'] },
  { id: 'cs-11', name: 'MongoDB & NoSQL', category: 'Software Engineering', weight: 1.1, aliases: ['mongodb', 'nosql', 'document db', 'mongoose'] },
  { id: 'cs-12', name: 'Git & Version Control', category: 'Software Engineering', weight: 1.1, aliases: ['git', 'github', 'branching', 'pull requests'] },
  { id: 'cs-13', name: 'Docker & Containerization', category: 'Software Engineering', weight: 1.15, aliases: ['docker', 'containers', 'docker-compose'] },
  { id: 'cs-14', name: 'Cloud Infrastructure & AWS/GCP', category: 'Software Engineering', weight: 1.2, aliases: ['cloud', 'aws', 'gcp', 'google cloud', 'serverless'] },
  { id: 'cs-15', name: 'Microservices Architecture', category: 'Software Engineering', weight: 1.2, aliases: ['microservices', 'distributed systems', 'service mesh'] },
  { id: 'cs-16', name: 'CI/CD Pipelines', category: 'Software Engineering', weight: 1.1, aliases: ['ci/cd', 'github actions', 'continuous integration', 'automated deployment'] },
  { id: 'cs-17', name: 'GraphQL', category: 'Software Engineering', weight: 1.15, aliases: ['graphql schema', 'apollo client', 'graphql query'] },
  { id: 'cs-18', name: 'Redis Caching', category: 'Software Engineering', weight: 1.1, aliases: ['redis', 'in-memory cache', 'key-value store'] },
  { id: 'cs-19', name: 'Authentication & JWT Security', category: 'Software Engineering', weight: 1.2, aliases: ['jwt', 'oauth2', 'auth tokens', 'role-based access control', 'rbac'] },
  { id: 'cs-20', name: 'Unit Testing & TDD', category: 'Software Engineering', weight: 1.1, aliases: ['unit testing', 'jest', 'mocha', 'integration testing', 'tdd'] },

  // ── 4. DATA SCIENCE & ARTIFICIAL INTELLIGENCE (18 Skills) ─────────────────────
  { id: 'ds-01', name: 'Machine Learning', category: 'Data Science & AI', weight: 1.25, aliases: ['ml', 'supervised learning', 'unsupervised learning', 'classification', 'regression'] },
  { id: 'ds-02', name: 'Deep Learning & Neural Networks', category: 'Data Science & AI', weight: 1.25, aliases: ['deep learning', 'cnn', 'rnn', 'transformers', 'neural networks'] },
  { id: 'ds-03', name: 'Pandas & Tabular Wrangling', category: 'Data Science & AI', weight: 1.15, aliases: ['pandas', 'data wrangling', 'dataframe manipulation', 'data cleaning'] },
  { id: 'ds-04', name: 'NumPy & Vector Mathematics', category: 'Data Science & AI', weight: 1.1, aliases: ['numpy', 'linear algebra', 'matrix calculations'] },
  { id: 'ds-05', name: 'Scikit-Learn', category: 'Data Science & AI', weight: 1.2, aliases: ['sklearn', 'scikit-learn pipelines', 'random forest', 'svm'] },
  { id: 'ds-06', name: 'PyTorch', category: 'Data Science & AI', weight: 1.25, aliases: ['pytorch', 'torch tensors', 'deep learning models'] },
  { id: 'ds-07', name: 'TensorFlow & Keras', category: 'Data Science & AI', weight: 1.2, aliases: ['tensorflow', 'keras', 'tf model'] },
  { id: 'ds-08', name: 'Natural Language Processing (NLP)', category: 'Data Science & AI', weight: 1.25, aliases: ['nlp', 'spacy', 'nltk', 'text classification', 'tokenization'] },
  { id: 'ds-09', name: 'Large Language Models (LLMs) & Prompting', category: 'Data Science & AI', weight: 1.3, aliases: ['llm', 'gemini api', 'gpt', 'rag', 'langchain', 'langgraph', 'prompt engineering'] },
  { id: 'ds-10', name: 'Data Visualization & Charting', category: 'Data Science & AI', weight: 1.1, aliases: ['matplotlib', 'seaborn', 'chart.js', 'plotly', 'dashboarding'] },
  { id: 'ds-11', name: 'Model Deployment & MLOps', category: 'Data Science & AI', weight: 1.2, aliases: ['mlops', 'model serving', 'fastapi ml', 'onnx'] },
  { id: 'ds-12', name: 'Vector Search & Embeddings', category: 'Data Science & AI', weight: 1.25, aliases: ['embeddings', 'vector database', 'cosine distance', 'faiss', 'chromadb'] },
  { id: 'ds-13', name: 'Exploratory Data Analysis (EDA)', category: 'Data Science & AI', weight: 1.15, aliases: ['eda', 'data profiling', 'outlier detection', 'statistical summaries'] },
  { id: 'ds-14', name: 'Feature Engineering', category: 'Data Science & AI', weight: 1.2, aliases: ['feature selection', 'pca', 'dimensionality reduction', 'one-hot encoding'] },
  { id: 'ds-15', name: 'Time Series Forecasting', category: 'Data Science & AI', weight: 1.15, aliases: ['time series', 'arima', 'prophet', 'trend forecasting'] },
  { id: 'ds-16', name: 'Computer Vision', category: 'Data Science & AI', weight: 1.2, aliases: ['cv', 'opencv', 'image classification', 'microscopy analysis'] },
  { id: 'ds-17', name: 'Reinforcement Learning', category: 'Data Science & AI', weight: 1.15, aliases: ['rl', 'q-learning', 'policy gradient'] },
  { id: 'ds-18', name: 'Big Data Processing & Spark', category: 'Data Science & AI', weight: 1.15, aliases: ['spark', 'pyspark', 'hadoop', 'mapreduce'] },

  // ── 5. PROFESSIONAL SOFT SKILLS & APTITUDE (18 Skills) ────────────────────────
  { id: 'soft-01', name: 'Scientific Documentation & Dossier Writing', category: 'Soft Skills & Professionalism', weight: 1.15, aliases: ['scientific writing', 'sop preparation', 'technical documentation', 'report drafting'] },
  { id: 'soft-02', name: 'Interdisciplinary Collaboration', category: 'Soft Skills & Professionalism', weight: 1.1, aliases: ['cross-functional collaboration', 'teamwork', 'partner syndication'] },
  { id: 'soft-03', name: 'Research Ethics & Academic Integrity', category: 'Soft Skills & Professionalism', weight: 1.15, aliases: ['bioethics', 'ethical compliance', 'plagiarism avoidance', 'declaration of helsinki'] },
  { id: 'soft-04', name: 'Project & Grant Management', category: 'Soft Skills & Professionalism', weight: 1.15, aliases: ['grant writing', 'project milestones', 'budget management', 'rfp response'] },
  { id: 'soft-05', name: 'Oral Defense & Technical Presentation', category: 'Soft Skills & Professionalism', weight: 1.05, aliases: ['public speaking', 'symposium presentation', 'seminar delivery', 'slide deck storytelling'] },
  { id: 'soft-06', name: 'Critical Problem Solving', category: 'Soft Skills & Professionalism', weight: 1.15, aliases: ['analytical reasoning', 'root cause analysis', 'troubleshooting'] },
  { id: 'soft-07', name: 'Intellectual Property & Patents', category: 'Soft Skills & Professionalism', weight: 1.2, aliases: ['patent drafting', 'prior art search', 'ipr', 'tkdl clearance'] },
  { id: 'soft-08', name: 'Regulatory Audit Readiness', category: 'Soft Skills & Professionalism', weight: 1.1, aliases: ['audit prep', 'naac criterion review', 'inspection compliance', 'quality audit'] },
  { id: 'soft-09', name: 'Time Management & Sprint Agility', category: 'Soft Skills & Professionalism', weight: 1.0, aliases: ['agile', 'scrum', 'deadline adherence', 'sprint delivery'] },
  { id: 'soft-10', name: 'Stakeholder & Recruiter Communication', category: 'Soft Skills & Professionalism', weight: 1.05, aliases: ['client communication', 'executive presentation', 'interview communication'] },
  { id: 'apt-01', name: 'Quantitative Aptitude & Mathematical Logic', category: 'Aptitude & Reasoning', weight: 1.1, aliases: ['math problem solving', 'numerical reasoning', 'percentages and ratios'] },
  { id: 'apt-02', name: 'Deductive & Inductive Logical Reasoning', category: 'Aptitude & Reasoning', weight: 1.1, aliases: ['logical deduction', 'syllogisms', 'inference testing'] },
  { id: 'apt-03', name: 'Experimental Data Interpretation', category: 'Aptitude & Reasoning', weight: 1.2, aliases: ['graph interpretation', 'table interpretation', 'experimental analysis'] },
  { id: 'apt-04', name: 'Pattern Recognition & Spatial Reasoning', category: 'Aptitude & Reasoning', weight: 1.05, aliases: ['pattern completion', 'spatial reasoning', 'abstract reasoning'] },
  { id: 'apt-05', name: 'Hypothesis Formulation & Testing', category: 'Aptitude & Reasoning', weight: 1.15, aliases: ['scientific method', 'null hypothesis', 'experimental design'] },
  { id: 'apt-06', name: 'Algorithmic Complexity & Optimization', category: 'Aptitude & Reasoning', weight: 1.15, aliases: ['big-o notation', 'computational efficiency', 'algorithm design'] },
  { id: 'apt-07', name: 'Systemic Risk & Quality Assessment', category: 'Aptitude & Reasoning', weight: 1.1, aliases: ['risk analysis', 'failure mode analysis', 'fmea'] },
  { id: 'apt-08', name: 'Verbal Comprehension & Technical Synthesis', category: 'Aptitude & Reasoning', weight: 1.05, aliases: ['reading comprehension', 'literature synthesis', 'abstract comprehension'] }
];

// Target Role Competency Profiles (Used for benchmark gap analysis and auto-assessment)
const ROLE_BENCHMARK_PROFILES = {
  "Herbal Formulation Scientist": {
    roleId: "role-formulation-scientist",
    title: "Herbal Formulation Scientist",
    industry: "Pharmaceutical R&D & Ayush Manufacturing",
    targetScore: 85,
    mandatorySkills: [
      { id: 'ayur-01', minProficiency: 0.85 }, // Herbal Formulation
      { id: 'ayur-02', minProficiency: 0.80 }, // Ayurvedic Pharmacognosy
      { id: 'ayur-03', minProficiency: 0.85 }, // HPTLC Fingerprinting
      { id: 'ayur-05', minProficiency: 0.75 }, // Phytochemical Extraction
      { id: 'ayur-06', minProficiency: 0.80 }, // GLP Compliance
      { id: 'ayur-09', minProficiency: 0.75 }, // Stability Protocols
      { id: 'soft-01', minProficiency: 0.70 }  // Scientific Documentation
    ],
    recommendedCourses: [
      { title: "Advanced HPTLC Standardization & Quality Control", provider: "Dabur R&D / AIIA", duration: "4 Weeks", link: "https://joblex.in/courses/hptlc-standardization" },
      { title: "Phytochemical Fingerprinting & GLP Lab Compliance", provider: "National Medicinal Plants Board", duration: "6 Weeks", link: "https://joblex.in/courses/glp-compliance" },
      { title: "Accelerated Herbal Stability Testing (ICH Guidelines)", provider: "Council of Scientific & Industrial Research", duration: "3 Weeks", link: "https://joblex.in/courses/stability-protocols" }
    ]
  },
  "Quality Control & Regulatory Affairs Analyst": {
    roleId: "role-qc-analyst",
    title: "Quality Control & Regulatory Affairs Analyst",
    industry: "Ayush Quality Assurance & Testing Labs",
    targetScore: 88,
    mandatorySkills: [
      { id: 'ayur-04', minProficiency: 0.85 }, // HPLC Analysis
      { id: 'ayur-06', minProficiency: 0.90 }, // GLP
      { id: 'ayur-07', minProficiency: 0.85 }, // GMP
      { id: 'ayur-10', minProficiency: 0.85 }, // Pharmacopeial Monographs
      { id: 'ayur-17', minProficiency: 0.80 }, // Regulatory Dossiers
      { id: 'ayur-18', minProficiency: 0.75 }, // Microbial Testing
      { id: 'soft-08', minProficiency: 0.80 }  // Audit Readiness
    ],
    recommendedCourses: [
      { title: "API Monograph Formulation & Regulatory Dossiers", provider: "Ministry of Ayush / Pharmacopoeia Commission", duration: "5 Weeks", link: "https://joblex.in/courses/ayush-regulatory" },
      { title: "HPLC & Spectroscopic QC Standards in Pharma", provider: "Patanjali Research Institute", duration: "4 Weeks", link: "https://joblex.in/courses/hplc-qc-standards" }
    ]
  },
  "Ayush Health-Tech & NLP Specialist": {
    roleId: "role-health-tech",
    title: "Ayush Health-Tech & NLP Specialist",
    industry: "Health-Tech, EHR & AI Research",
    targetScore: 82,
    mandatorySkills: [
      { id: 'cs-01', minProficiency: 0.85 },   // Python
      { id: 'ht-02', minProficiency: 0.80 },   // NLP for Classical Texts
      { id: 'ht-03', minProficiency: 0.80 },   // Health Informatics
      { id: 'ds-01', minProficiency: 0.80 },   // Machine Learning
      { id: 'ds-08', minProficiency: 0.80 },   // NLP
      { id: 'ht-01', minProficiency: 0.70 },   // In-Silico Molecular Docking
      { id: 'cs-10', minProficiency: 0.75 }    // SQL
    ],
    recommendedCourses: [
      { title: "Classical Sanskrit NLP & Text-Mining Pipelines", provider: "IIT Delhi Ayush Cell & AIIA", duration: "6 Weeks", link: "https://joblex.in/courses/sanskrit-nlp" },
      { title: "Health Informatics & Clinical Trial Analytics in Python", provider: "Himalaya Wellness Data Division", duration: "4 Weeks", link: "https://joblex.in/courses/health-informatics" }
    ]
  },
  "Full Stack Software Engineer": {
    roleId: "role-software-engineer",
    title: "Full Stack Software Engineer",
    industry: "Enterprise Software & Cloud Platforms",
    targetScore: 85,
    mandatorySkills: [
      { id: 'cs-01', minProficiency: 0.80 },   // Python
      { id: 'cs-02', minProficiency: 0.85 },   // JavaScript
      { id: 'cs-04', minProficiency: 0.85 },   // Node.js
      { id: 'cs-06', minProficiency: 0.80 },   // React
      { id: 'cs-09', minProficiency: 0.85 },   // RESTful APIs
      { id: 'cs-10', minProficiency: 0.80 },   // SQL
      { id: 'cs-12', minProficiency: 0.80 }    // Git
    ],
    recommendedCourses: [
      { title: "Full-Stack Microservices with Node.js & React", provider: "Joblex Developer Academy", duration: "8 Weeks", link: "https://joblex.in/courses/full-stack-engineer" },
      { title: "Cloud Architecture & Scalable Systems", provider: "Cloud Native Foundation", duration: "6 Weeks", link: "https://joblex.in/courses/cloud-architecture" }
    ]
  },
  "Data Scientist & ML Engineer": {
    roleId: "role-data-scientist",
    title: "Data Scientist & ML Engineer",
    industry: "AI/ML & Predictive Analytics",
    targetScore: 86,
    mandatorySkills: [
      { id: 'cs-01', minProficiency: 0.90 },   // Python
      { id: 'ds-01', minProficiency: 0.85 },   // Machine Learning
      { id: 'ds-03', minProficiency: 0.85 },   // Pandas
      { id: 'ds-05', minProficiency: 0.80 },   // Scikit-Learn
      { id: 'ds-06', minProficiency: 0.75 },   // PyTorch
      { id: 'ds-12', minProficiency: 0.75 },   // Vector Search & Embeddings
      { id: 'apt-01', minProficiency: 0.80 }   // Quantitative Aptitude
    ],
    recommendedCourses: [
      { title: "End-to-End Machine Learning & Vector Search Systems", provider: "Joblex AI Research", duration: "8 Weeks", link: "https://joblex.in/courses/ml-engineer" },
      { title: "Applied Deep Learning & NLP Model Deployment", provider: "DeepLearning Institute", duration: "6 Weeks", link: "https://joblex.in/courses/applied-deep-learning" }
    ]
  }
};

module.exports = {
  SKILL_ONTOLOGY,
  ROLE_BENCHMARK_PROFILES
};
