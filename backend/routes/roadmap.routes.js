const express = require('express');
const router = require('express').Router();
const { supabase, isConfigured } = require('../config/supabase');
const DB = require('../data/database');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { generateWithFailover } = require('../services/ai.service');

router.use(authenticateToken, requireRole(['student']));

/**
 * Modern Multi-Sector Career Roadmaps Catalog
 */
const SECTOR_ROADMAPS = [
  {
    id: "fullstack-web",
    title: "Full Stack Software Engineering",
    sector: "Technology & Software",
    icon: "code",
    color: "from-blue-600 to-cyan-500",
    duration: "6 Months",
    difficulty: "Intermediate",
    summary: "Complete modern roadmap from responsive frontend frameworks to scalable cloud microservices.",
    milestones: [
      {
        phase: "Phase 1",
        timeline: "Month 1 - 2",
        title: "Frontend Foundations & Component Architecture",
        description: "Master modern browser architectures, state management, and modern styling libraries.",
        skills: ["HTML5 / Semantic Web", "Modern CSS / Tailwind", "JavaScript (ES2024+)", "React.js / Next.js", "TypeScript"],
        keyDeliverables: ["Production-ready responsive web UI", "Global client state management with Zustand", "Accessible component design system"]
      },
      {
        phase: "Phase 2",
        timeline: "Month 3 - 4",
        title: "Backend Services, REST & GraphQL APIs",
        description: "Develop secure server runtime environments, authentication pipelines, and relational databases.",
        skills: ["Node.js / Express / Fastify", "PostgreSQL & Supabase", "Prisma / Drizzle ORM", "RESTful Architecture", "JWT & OAuth2"],
        keyDeliverables: ["Secure REST API server with JWT Auth", "Relational database schema with migrations", "Automated integration testing suite"]
      },
      {
        phase: "Phase 3",
        timeline: "Month 5",
        title: "System Architecture, Caching & Message Queues",
        description: "Scale applications using caching layers, background worker queues, and event streams.",
        skills: ["Redis Caching", "Docker Containerization", "WebSockets / Realtime", "Message Queues (RabbitMQ/BullMQ)", "System Design"],
        keyDeliverables: ["High-throughput caching pipeline", "Multi-container Docker Compose environment", "Live collaboration websocket channel"]
      },
      {
        phase: "Phase 4",
        timeline: "Month 6",
        title: "Cloud Infrastructure, CI/CD & Production Capstone",
        description: "Deploy robust distributed systems with automated integration and continuous deployment.",
        skills: ["AWS / Vercel Deployment", "GitHub Actions CI/CD", "Nginx & Reverse Proxies", "Monitoring & Logging", "Performance Tuning"],
        keyDeliverables: ["Automated GitHub Actions CI/CD pipeline", "Zero-downtime production deployment", "Comprehensive technical design portfolio"]
      }
    ]
  },
  {
    id: "ai-data-science",
    title: "AI & Machine Learning Engineering",
    sector: "Artificial Intelligence & Data",
    icon: "psychology",
    color: "from-purple-600 to-indigo-600",
    duration: "8 Months",
    difficulty: "Advanced",
    summary: "From statistical mathematics to deep learning architectures, vector databases, and LLM agent systems.",
    milestones: [
      {
        phase: "Phase 1",
        timeline: "Month 1 - 2",
        title: "Mathematics, Python & Exploratory Data Analysis",
        description: "Build rigorous foundational skills in linear algebra, multivariable calculus, and dataset munging.",
        skills: ["Python 3.12+", "NumPy & Pandas", "Linear Algebra & Calculus", "Matplotlib & Seaborn", "Scikit-Learn"],
        keyDeliverables: ["End-to-end exploratory data analysis report", "Statistical hypothesis testing dossier", "Baseline supervised predictive models"]
      },
      {
        phase: "Phase 2",
        timeline: "Month 3 - 4",
        title: "Deep Learning & Neural Network Architectures",
        description: "Train deep convolutional, recurrent, and transformer architectures with PyTorch.",
        skills: ["PyTorch", "Convolutional Neural Networks", "Transformers & Attention Mechanisms", "Hyperparameter Optimization", "Weights & Biases"],
        keyDeliverables: ["Computer vision classification pipeline", "Custom transformer implementation from scratch", "Model checkpointing & experiment tracking"]
      },
      {
        phase: "Phase 3",
        timeline: "Month 5 - 6",
        title: "LLM Orchestration, RAG & Vector Systems",
        description: "Build retrieval augmented generation systems with semantic search, embeddings, and vector databases.",
        skills: ["LangChain & LangGraph", "Vector Databases (Qdrant/Pinecone)", "Embedding Models", "OpenAI / Anthropic APIs", "RAG Pipelines"],
        keyDeliverables: ["Enterprise multi-document RAG pipeline", "Hybrid keyword + vector dense retrieval", "Autonomous agentic workflow with tools"]
      },
      {
        phase: "Phase 4",
        timeline: "Month 7 - 8",
        title: "MLOps, Model Deployment & Production Inference",
        description: "Serve models with ultra-low latency, quantify drift, and automate continuous retraining pipelines.",
        skills: ["FastAPI Model Serving", "vLLM / Triton Inference Server", "MLflow & DVC", "Docker & Kubernetes", "Model Monitoring & Evident Drift"],
        keyDeliverables: ["Low-latency streaming inference API", "Automated model registry and deployment pipeline", "Production telemetry & drift dashboard"]
      }
    ]
  },
  {
    id: "cloud-devops",
    title: "Cloud Architecture & DevOps Engineering",
    sector: "Infrastructure & Cloud",
    icon: "cloud_done",
    color: "from-emerald-600 to-teal-500",
    duration: "6 Months",
    difficulty: "Intermediate",
    summary: "Design reliable, fault-tolerant infrastructure as code, Kubernetes clusters, and enterprise CI/CD.",
    milestones: [
      {
        phase: "Phase 1",
        timeline: "Month 1",
        title: "Linux Systems, Networking & Shell Scripting",
        description: "Gain deep mastery over POSIX systems, networking protocols, security firewalls, and automation scripts.",
        skills: ["Linux Kernel & Bash Scripting", "TCP/IP, DNS, SSL/TLS", "SSH & Systemd Services", "Git & Trunk-Based Development"],
        keyDeliverables: ["Automated Linux server provisioning script", "Network diagnostic & packet inspection toolkit", "Security hardening checklist"]
      },
      {
        phase: "Phase 2",
        timeline: "Month 2 - 3",
        title: "Containers, Orchestration & Kubernetes",
        description: "Containerize multi-tier applications and orchestrate self-healing clusters with Kubernetes.",
        skills: ["Docker & Multi-Stage Builds", "Kubernetes Pods, Services, Ingress", "Helm Charts", "Container Security & Scanning"],
        keyDeliverables: ["Production-grade Helm package for microservices", "Multi-node Kubernetes cluster configuration", "Automated container vulnerability scanning"]
      },
      {
        phase: "Phase 3",
        timeline: "Month 4 - 5",
        title: "Infrastructure as Code & CI/CD Pipelines",
        description: "Codify cloud infrastructure declaratively using Terraform and build gitops deployment pipelines.",
        skills: ["Terraform / OpenTofu", "AWS / GCP Cloud Services", "GitHub Actions & GitLab CI", "ArgoCD & GitOps"],
        keyDeliverables: ["Declarative cloud infrastructure codebase", "GitOps deployment workflow with ArgoCD", "Secrets management using Vault"]
      },
      {
        phase: "Phase 4",
        timeline: "Month 6",
        title: "Site Reliability, Observability & Chaos Engineering",
        description: "Monitor SLIs/SLOs, aggregate logs, trace distributed requests, and prepare disaster recovery plans.",
        skills: ["Prometheus & Grafana", "OpenTelemetry & Jaeger", "ELK / Loki Log Aggregation", "Incident Response & Postmortems"],
        keyDeliverables: ["Real-time Grafana observability dashboard", "Distributed request tracing instrumentation", "Automated alert paging policy"]
      }
    ]
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity & Ethical Hacking",
    sector: "Information Security",
    icon: "security",
    color: "from-rose-600 to-red-500",
    duration: "6 Months",
    difficulty: "Intermediate to Advanced",
    summary: "Comprehensive defensive and offensive security, vulnerability assessment, cryptography, and network defense.",
    milestones: [
      {
        phase: "Phase 1",
        timeline: "Month 1 - 2",
        title: "Network Security & Defensive Foundations",
        description: "Analyze network traffic, configure perimeter defenses, and master core symmetric and asymmetric cryptography.",
        skills: ["Wireshark & Packet Analysis", "Public Key Infrastructure (PKI)", "Firewalls & IDS/IPS", "Linux Security Modules"],
        keyDeliverables: ["Network intrusion detection report", "Encrypted communication protocol audit", "Defensive network topology diagram"]
      },
      {
        phase: "Phase 2",
        timeline: "Month 3",
        title: "Web Application Security & OWASP Top 10",
        description: "Identify and remediate critical vulnerabilities in web applications, APIs, and authentication flows.",
        skills: ["Burp Suite & OWASP ZAP", "SQL Injection, XSS, CSRF", "Broken Object Level Authorization", "Authentication & JWT Flaws"],
        keyDeliverables: ["Full web application penetration test report", "Remediation code patches for OWASP Top 10 vulnerabilities", "Automated DAST security scanner"]
      },
      {
        phase: "Phase 3",
        timeline: "Month 4 - 5",
        title: "System Exploitation & Red Teaming",
        description: "Perform authorized penetration testing, privilege escalation, and active directory assessments.",
        skills: ["Metasploit Framework", "Linux & Windows Privilege Escalation", "Active Directory Security", "Social Engineering Awareness"],
        keyDeliverables: ["Internal network compromise methodology log", "Privilege escalation demonstration in isolated lab", "Red team debrief presentation"]
      },
      {
        phase: "Phase 4",
        timeline: "Month 6",
        title: "Security Operations & Incident Response",
        description: "Operate modern SIEM tools, conduct digital forensics, and lead emergency security incident handling.",
        skills: ["SIEM (Splunk / Elastic Security)", "Memory & Disk Forensics", "Threat Hunting & MITRE ATT&CK", "Incident Response Protocols"],
        keyDeliverables: ["Threat detection rule library aligned with MITRE ATT&CK", "Forensic analysis investigation dossier", "Enterprise incident response playbook"]
      }
    ]
  },
  {
    id: "biotech-healthtech",
    title: "Health-Tech, Bioinformatics & Pharma Analytics",
    sector: "Healthcare & Life Sciences",
    icon: "biotech",
    color: "from-amber-600 to-orange-500",
    duration: "6 Months",
    difficulty: "Intermediate",
    summary: "Connecting computational biology, clinical data management, molecular docking, and regulatory compliance.",
    milestones: [
      {
        phase: "Phase 1",
        timeline: "Month 1 - 2",
        title: "Biostatistics, Python & Clinical Data Standards",
        description: "Manage clinical trial datasets, apply statistical methodologies, and master healthcare regulatory norms.",
        skills: ["Python for Life Sciences", "Biostatistics (R / Scipy)", "CDISC / SDTM Standards", "Good Laboratory Practice (GLP)"],
        keyDeliverables: ["Clinical trial data validation pipeline", "Biostatistical survival analysis report", "Regulatory audit compliance documentation"]
      },
      {
        phase: "Phase 2",
        timeline: "Month 3 - 4",
        title: "Computational Drug Discovery & Molecular Modeling",
        description: "Conduct in-silico ligand screening, molecular docking, and virtual chemical library filtering.",
        skills: ["AutoDock Vina & PyMOL", "RDKit Cheminformatics", "QSAR Modeling", "Protein-Ligand Interaction Profiling"],
        keyDeliverables: ["Virtual screening campaign for target receptors", "Molecular docking binding affinity report", "3D molecular visualization interactive dossier"]
      },
      {
        phase: "Phase 3",
        timeline: "Month 5",
        title: "Genomics Data Pipelines & Next-Gen Sequencing",
        description: "Process genomic sequence reads, perform variant calling, and analyze transcriptomics expression arrays.",
        skills: ["FASTQ / BAM / VCF Pipelines", "Biopython & Scanpy", "Variant Calling (GATK)", "Gene Ontology Enrichment"],
        keyDeliverables: ["Automated NGS variant calling workflow", "Differential gene expression heatmap report", "Genomic biomarker discovery analysis"]
      },
      {
        phase: "Phase 4",
        timeline: "Month 6",
        title: "Healthcare AI & Clinical Decision Systems",
        description: "Deploy HIPAA-compliant clinical predictions, diagnostic imaging classifiers, and EHR interoperability.",
        skills: ["HL7 / FHIR Standards", "Medical Imaging Classification (DICOM)", "HIPAA Compliance & Privacy", "Clinical Decision Support Systems"],
        keyDeliverables: ["FHIR-compliant patient telemetry API", "Medical imaging diagnostic assistance prototype", "Comprehensive life-science capstone project"]
      }
    ]
  },
  {
    id: "fintech-blockchain",
    title: "Fintech, Quantitative Systems & Blockchain",
    sector: "Financial Technology",
    icon: "account_balance",
    color: "from-yellow-600 to-amber-500",
    duration: "6 Months",
    difficulty: "Advanced",
    summary: "Build high-frequency trading algorithms, risk analytics models, and decentralized smart contracts.",
    milestones: [
      {
        phase: "Phase 1",
        timeline: "Month 1 - 2",
        title: "Financial Engineering & Quantitative Modeling",
        description: "Master financial mathematics, time-series forecasting, options pricing, and market microstructure.",
        skills: ["Python (QuantLib, Backtrader)", "Time Series Analysis (ARIMA, GARCH)", "Portfolio Optimization (Markowitz)", "Market Data APIs (WebSocket)"],
        keyDeliverables: ["Algorithmic trading backtesting framework", "Value at Risk (VaR) calculation engine", "Automated stock & options screener"]
      },
      {
        phase: "Phase 2",
        timeline: "Month 3 - 4",
        title: "High-Performance Transaction Systems",
        description: "Develop low-latency order execution systems, matching engines, and double-entry ledger databases.",
        skills: ["Go / Rust Foundations", "Event Sourcing & CQRS", "High-Throughput Order Book Design", "Financial Payment Protocols"],
        keyDeliverables: ["In-memory limit order book matching engine", "Tamper-evident double-entry accounting ledger", "Payment gateway integration with webhook validation"]
      },
      {
        phase: "Phase 3",
        timeline: "Month 5",
        title: "Smart Contracts & Decentralized Finance (DeFi)",
        description: "Author, audit, and deploy secure EVM smart contracts, liquidity pools, and decentralized tokens.",
        skills: ["Solidity", "Hardhat & Foundry", "OpenZeppelin Standards", "DeFi Protocols (Uniswap, Aave)", "Smart Contract Auditing"],
        keyDeliverables: ["ERC-20 / ERC-721 token contract with staking", "Automated Market Maker (AMM) pool simulation", "Security audit report using Slither"]
      },
      {
        phase: "Phase 4",
        timeline: "Month 6",
        title: "Regulatory Compliance, Anti-Fraud & Production",
        description: "Integrate fraud detection algorithms, KYC/AML compliance pipelines, and production deployments.",
        skills: ["Fraud Detection ML Models", "KYC / AML Regulatory Standards", "Zero-Knowledge Proofs (ZKPs)", "Production Cloud Deployment"],
        keyDeliverables: ["Real-time transaction anomaly detector", "Automated compliance audit dashboard", "Production fintech application capstone"]
      }
    ]
  }
];

// GET /api/roadmap/sectors (List all multi-sector roadmaps)
router.get('/sectors', async (req, res) => {
  res.json({
    success: true,
    sectors: SECTOR_ROADMAPS.map(({ milestones, ...s }) => ({
      ...s,
      totalMilestones: milestones.length,
      estimatedWeeks: milestones.length * 4
    }))
  });
});

// GET /api/roadmap/sectors/:id (Get full detailed roadmap with timeline & milestones)
router.get('/sectors/:id', async (req, res) => {
  const roadmap = SECTOR_ROADMAPS.find(r => r.id === req.params.id);
  if (!roadmap) {
    return res.status(404).json({ success: false, error: 'Roadmap not found.' });
  }
  res.json({
    success: true,
    roadmap
  });
});

// POST /api/roadmap/customize (LangGraph Failover: Modify roadmap based on user prompt)
router.post('/customize', async (req, res) => {
  try {
    const { roadmapId, currentRoadmap, userPrompt } = req.body || {};
    const baseRoadmap = currentRoadmap || SECTOR_ROADMAPS.find(r => r.id === roadmapId) || SECTOR_ROADMAPS[0];

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return res.status(400).json({ success: false, error: 'Please specify the changes you would like to make.' });
    }

    const aiPrompt = `Given the base roadmap below:
Title: ${baseRoadmap.title}
Sector: ${baseRoadmap.sector}
Duration: ${baseRoadmap.duration}
Existing Milestones: ${JSON.stringify(baseRoadmap.milestones || [])}

The student requests the following customization changes:
"${userPrompt.trim()}"

Generate an updated customized career roadmap that integrates the student's prompt into the timeline and milestones.
You MUST reply with ONLY a valid JSON object matching this exact schema:
{
  "id": "custom-${Date.now().toString(36)}",
  "title": "Customized Roadmap Title",
  "sector": "${baseRoadmap.sector}",
  "duration": "Custom Duration (e.g. 6 Months)",
  "difficulty": "Custom Difficulty",
  "summary": "2-3 sentence overview of this customized progression path.",
  "userPrompt": "${userPrompt.replace(/"/g, "'")}",
  "milestones": [
    {
      "phase": "Phase 1",
      "timeline": "Months 1-2",
      "title": "Milestone Title",
      "description": "Clear milestone description incorporating user request.",
      "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
      "keyDeliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"]
    }
  ]
}`;

    const aiResult = await generateWithFailover({
      prompt: aiPrompt,
      systemInstruction: 'You are an expert career roadmap architect. You MUST return ONLY a valid JSON object without markdown code fences.',
      temperature: 0.3,
      jsonMode: true
    });

    if (aiResult && aiResult.text) {
      let clean = aiResult.text.trim();
      if (clean.startsWith('```json')) clean = clean.slice(7);
      if (clean.startsWith('```')) clean = clean.slice(3);
      if (clean.endsWith('```')) clean = clean.slice(0, -3);
      clean = clean.trim();

      const customized = JSON.parse(clean);
      if (customized.title && Array.isArray(customized.milestones) && customized.milestones.length > 0) {
        return res.json({
          success: true,
          provider: aiResult.provider,
          roadmap: customized
        });
      }
    }

    return res.status(500).json({ success: false, error: 'Could not generate custom roadmap with the requested prompt.' });
  } catch (err) {
    console.error('[Roadmap Customize Error]:', err);
    res.status(500).json({ success: false, error: 'Failed to customize roadmap: ' + err.message });
  }
});

// Helper to get or initialize a student's in-memory roadmap
function getStudentRoadmap(studentId) {
  if (!DB.student_roadmaps) {
    DB.student_roadmaps = {};
  }
  if (!DB.student_roadmaps[studentId]) {
    // Clone default template with clean initial state for student
    const roadmap = JSON.parse(JSON.stringify(DB.student_roadmap));
    roadmap.userId = studentId;
    roadmap.totalXp = 0;
    roadmap.streakDays = 0;
    roadmap.currentLevel = "Level 1 - Aspiring Scholar";
    if (Array.isArray(roadmap.phases)) {
      roadmap.phases.forEach(p => {
        if (Array.isArray(p.tasks)) {
          p.tasks.forEach(t => t.completed = false);
        }
      });
    }
    DB.student_roadmaps[studentId] = roadmap;
  }
  return DB.student_roadmaps[studentId];
}

// GET /api/roadmap, /api/roadmap/get, /api/roadmap/state
router.get(['/', '/get', '/state'], async (req, res) => {
  const studentId = req.user?.id || req.user?.email;

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('student_roadmaps')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (!error && data) {
        return res.json(data);
      }
    } catch (err) {
      console.warn('[Roadmap GET] Supabase warning:', err.message);
    }
  }

  res.json(getStudentRoadmap(studentId));
});

// GET /api/roadmap/get (alias)
router.get('/get', async (req, res) => {
  const studentId = req.user?.id || req.user?.email;

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('student_roadmaps')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (!error && data) {
        return res.json(data);
      }
    } catch (err) {
      console.warn('[Roadmap get] Supabase warning:', err.message);
    }
  }

  res.json(getStudentRoadmap(studentId));
});

// GET /api/roadmap/peer-benchmarking (Idea #2)
router.get('/peer-benchmarking', async (req, res) => {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('peer_benchmarking').select('*').limit(1).maybeSingle();
      if (!error && data) {
        return res.json(data);
      }
    } catch (err) {
      console.warn('[Peer benchmarking] Supabase warning:', err.message);
    }
  }
  res.json(DB.peerBenchmarking);
});

// POST /api/roadmap/toggle-task
router.post('/toggle-task', async (req, res) => {
  const { taskId, phaseIdx } = req.body || {};
  const studentId = req.user?.id || req.user?.email;
  const rm = getStudentRoadmap(studentId);
  let updated = false;
  let xpGained = 0;

  const pIdx = parseInt(phaseIdx, 10);
  if (rm.phases) {
    // Find phase either by index or by searching inside phases
    let targetPhase = !isNaN(pIdx) && rm.phases[pIdx] ? rm.phases[pIdx] : null;
    if (!targetPhase && taskId) {
      targetPhase = rm.phases.find(p => p.tasks && p.tasks.some(t => t.id === taskId));
    }

    if (targetPhase && targetPhase.tasks) {
      const task = targetPhase.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        updated = true;
        const taskXp = task.xp || 50;
        if (task.completed) {
          xpGained = taskXp;
          rm.totalXp = (rm.totalXp || 0) + xpGained;
        } else {
          xpGained = -taskXp;
          rm.totalXp = Math.max(0, (rm.totalXp || 0) - taskXp);
        }
      }
    }
  }

  if (isConfigured && supabase && updated) {
    try {
      await supabase
        .from('student_roadmaps')
        .update({ total_xp: rm.totalXp, phases: rm.phases })
        .eq('student_id', studentId);
    } catch (err) {
      console.warn('[Toggle task] Supabase sync warning:', err.message);
    }
  }

  res.json({
    success: updated,
    xpGained,
    newTotalXp: rm.totalXp,
    roadmap: rm
  });
});

// POST /api/roadmap/check-in (Anti-decay freeze)
router.post('/check-in', async (req, res) => {
  const studentId = req.user?.id || req.user?.email;
  const rm = getStudentRoadmap(studentId);

  rm.streakDays = (typeof rm.streakDays === 'number' ? rm.streakDays : 0) + 1;
  rm.totalXp = (typeof rm.totalXp === 'number' ? rm.totalXp : 0) + 50;
  rm.decayStatus = 'Active - Decay Frozen for 72 hrs';
  rm.decayFrozenUntil = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

  if (isConfigured && supabase) {
    try {
      await supabase
        .from('student_roadmaps')
        .update({
          streak_days: rm.streakDays,
          total_xp: rm.totalXp,
          decay_status: rm.decayStatus
        })
        .eq('student_id', studentId);
    } catch (err) {
      console.warn('[Check-in] Supabase sync warning:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'Daily Check-in recorded! +50 XP awarded, Streak incremented, and Point Decay frozen for 72 hours.',
    streak: rm.streakDays,
    totalXp: rm.totalXp,
    decayFrozenUntil: rm.decayFrozenUntil
  });
});

// POST /api/roadmap/update-level
router.post('/update-level', async (req, res) => {
  const { level } = req.body || {};
  const studentId = req.user?.id || req.user?.email;
  const rm = getStudentRoadmap(studentId);

  if (level) {
    rm.currentLevel = level;
  }

  if (isConfigured && supabase) {
    try {
      await supabase
        .from('student_roadmaps')
        .update({ current_level: rm.currentLevel })
        .eq('student_id', studentId);
    } catch (err) {
      console.warn('[Update-level] Supabase sync warning:', err.message);
    }
  }

  res.json({
    success: true,
    message: `Career milestone level updated to "${rm.currentLevel}"!`,
    currentLevel: rm.currentLevel,
    roadmap: rm
  });
});

module.exports = router;
