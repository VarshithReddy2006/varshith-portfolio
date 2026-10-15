/**
 * Single source of truth for all portfolio copy and links.
 *
 * Links marked `verified: true` were checked to resolve to the expected
 * public GitHub repository. Anything marked `PLACEHOLDER` must be replaced
 * before relying on it (see README → "Replacing placeholders").
 */

export const profile = {
  name: 'Shavva Varshith Reddy',
  firstName: 'Shavva',
  lastName: 'Varshith Reddy',
  initials: 'SVR',
  roles: ['Computer Science Engineer', 'Developer', 'Problem Solver'],
  tagline: 'I build AI systems, developer tools, and real products that solve meaningful problems.',
  email: 'shavvavarshithreddy@gmail.com',
  phone: '+91 9948255529',
  phoneHref: 'tel:+919948255529',
  location: 'Hyderabad, India',
  resumeUrl: '/resume.pdf',
  resumeDownloadFilename: 'Shavva_Varshith_Reddy_Resume.pdf',
  /** Real-photo placeholders. Replace the files, never generate a portrait. */
  portraitHero: '/images/portrait-hero.jpg',
  portraitAbout: '/images/portrait-about.jpg',
  /**
   * Optional intro video (e.g. YouTube embed URL or /intro.mp4).
   * PLACEHOLDER: null shows the code-built highlight reel instead.
   */
  introVideoUrl: null as string | null,
} as const;

export type SocialId = 'linkedin' | 'github' | 'leetcode' | 'codeforces';

export const socials: { id: SocialId; label: string; handle: string; href: string }[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'shavva-varshith-reddy',
    href: 'https://www.linkedin.com/in/shavva-varshith-reddy-401b59366/',
  },
  { id: 'github', label: 'GitHub', handle: 'VarshithReddy2006', href: 'https://github.com/VarshithReddy2006' },
  { id: 'leetcode', label: 'LeetCode', handle: 'Varshithreddy8044', href: 'https://leetcode.com/u/Varshithreddy8044/' },
  {
    id: 'codeforces',
    label: 'Codeforces',
    handle: 'varshithreddy6147',
    href: 'https://codeforces.com/profile/varshithreddy6147',
  },
];

export const socialHref = (id: SocialId) => socials.find((s) => s.id === id)!.href;

export const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof navLinks)[number]['id'] | 'skills';

export const heroStats = [
  { value: '400+', label: 'DSA Problems Solved', icon: 'code' },
  { value: 'Top 8.46%', label: 'LeetCode Rating 1798', icon: 'trophy' },
  { value: 'Open Source', label: 'OpenMRS Core Contributor', icon: 'pr' },
  { value: '4', label: 'Major Projects', icon: 'layers' },
] as const;

export const competitiveStats = [
  { value: '408', label: 'Problems Solved' },
  { value: '1798', label: 'Contest Rating' },
  { value: 'Top 8.46%', label: 'Global Percentile' },
] as const;

export const about = {
  title: 'The Engineer Behind the Code',
  description:
    'A Computer Science student at CVR College of Engineering, passionate about building scalable systems, open source, and solving real-world problems with AI.',
  facts: [
    { label: 'Location', value: 'Hyderabad, India', icon: 'pin' },
    { label: 'Degree', value: 'B.Tech CSE', sub: 'CVR College of Engineering', icon: 'grad' },
    { label: 'CGPA', value: '8.49/10', icon: 'gauge' },
    { label: 'Timeline', value: '2024–Present', icon: 'calendar' },
  ],
  quote: 'Build. Learn. Contribute. Repeat.',
} as const;

export type Evidence = 'verified' | 'reported' | 'target' | 'architecture';

export const evidenceLabels: Record<Evidence, string> = {
  verified: 'Verified in repo',
  reported: 'Reported in docs',
  target: 'Design target',
  architecture: 'Architecture',
};

export interface Project {
  id: 'aria' | 'devtrack' | 'stratify' | 'phishing';
  name: string;
  subtitle: string;
  dates: string;
  summary: string;
  leadDescription: string;
  highlights: string[];
  details: string[];
  /**
   * Evidence behind each figure, from a read-only audit of the local project repositories:
   *  verified     counted in the source code or data
   *  reported     stated in the project's own docs, no artifact to confirm it
   *  target       a design goal that has not been benchmarked
   *  architecture describes how the system is built
   */
  proofPoints: { label: string; value: string; type: Evidence; source?: string }[];
  metrics: { value: string; label: string; evidence: Evidence; note?: string }[];
  tech: string[];
  /** public: false hides the link (the repository returned 404 when checked). */
  repo: { href: string; verified: boolean; public: boolean; note?: string };
  categoryBadge: string;
}

export const projects: Project[] = [
  {
    id: 'aria',
    name: 'ARIA',
    subtitle: 'Repository Intelligence Agent',
    dates: 'June 2026 – Present',
    categoryBadge: 'Featured · Structural Code Intelligence',
    summary:
      'Understand unfamiliar codebases before changing them. A structural code intelligence platform combining AST parsing, dependency and call graphs, and hybrid semantic retrieval grounded in repository architecture.',
    leadDescription:
      'ARIA moves beyond structurally blind text-only RAG by building an architectural foundation first: parsing source trees into ASTs, resolving call hierarchies and import topologies, and serving grounded answers through a 20-class chat intent taxonomy and a stateless MCP adapter.',
    highlights: [
      'AST-based parsing with Tree-sitter',
      'Symbol indexing & reference resolution',
      'Dependency graphs & semantic call graphs',
      'API surface & contract analysis',
      'Change impact & blast-radius analysis',
      'Git churn & coupling analysis',
      'Hybrid semantic retrieval (Qdrant + ChromaDB)',
      'Repository chat with structural context',
      'Stateless MCP adapter (17 tools)',
      'IDE integration & Prometheus observability',
    ],
    details: [
      'AST Parsing & Symbol Index: Tree-sitter parsers extract functions, classes, and methods with exact byte spans, feeding an O(1) in-memory symbol lookup and cross-file reference resolver.',
      'Directed Dependency & Call Graphs: NetworkX builds directed import topologies and multi-stage semantic call graphs resolving method receivers, inheritance hierarchies, and import aliases.',
      'API Surface & Contract Analysis: Discovers public routes and exported interfaces, flagging uncalled endpoints and estimating breaking change risks before merge.',
      'Confidence-Aware Impact Analysis: Traces transitive caller chains and estimates PR blast radius, categorizing predicted impacts into calibrated HIGH, MEDIUM, and LOW confidence tiers.',
      'Hybrid Vector Retrieval: Combines dense ONNX INT8 embeddings (BAAI/bge-small-en-v1.5) in Qdrant (with local ChromaDB fallback) with structural graph context.',
      'Stateless MCP Server: A 17-tool FastMCP adapter (stdio and SSE transports) that calls the ARIA REST API, letting Cursor, Claude Desktop, and VS Code MCP clients inspect symbols, dependencies, and blast radius.',
      'Resilient LLM Failover: Routes requests through Gemini 3.1 Flash Lite with automated circuit-breaker cascades to DeepSeek V4 Flash, NVIDIA NIM, and deterministic no-LLM graph renderers.',
      'Quality & Observability: The README reports 3,360 automated tests passing (2,967 pytest backend, 393 Node test-runner frontend), with Prometheus metric collection.',
    ],
    proofPoints: [
      { label: 'Automated tests', value: '3,360 passing', type: 'reported', source: 'README test summary; ~2,700 test functions found statically' },
      { label: 'MCP assistant tools', value: '17 tools', type: 'verified', source: '17 @server.tool() registrations in mcp/tools/' },
      { label: 'Chat intent classes', value: '19 + unknown', type: 'verified', source: 'Intent enum in services/chat/intent_detector.py' },
      { label: 'Incremental rebuild', value: '< 2 s goal', type: 'target', source: 'Design goal; the repo notes it is not yet benchmarked' },
    ],
    metrics: [
      { value: '3,360', label: 'Tests (README)', evidence: 'reported' },
      { value: '17', label: 'MCP tools', evidence: 'verified' },
      { value: '19', label: 'Chat intent classes', evidence: 'verified' },
    ],
    tech: ['Python', 'FastAPI', 'Tree-sitter', 'NetworkX', 'Qdrant', 'ChromaDB', 'React', 'Astro', 'TypeScript', 'Docker', 'MCP'],
    repo: { href: 'https://github.com/VarshithReddy2006/ARIA', verified: true, public: true },
  },
  {
    id: 'devtrack',
    name: 'DevTrack',
    subtitle: 'Developer Productivity & Career Readiness OS',
    dates: 'April 2026 – May 2026',
    categoryBadge: 'Monorepo OS · Developer Workflows',
    summary:
      'A unified workspace that turns developer activity into actionable learning and career-readiness workflows, coupling deep resume intelligence with telemetry and gamification.',
    leadDescription:
      'Engineered as a monorepo with 23 mounted route modules and 62 Mongoose models, DevTrack ingests developer activity from LeetCode (GraphQL), Codeforces (REST), CodeChef (scraping), and GitHub to drive career readiness, resume scoring, and background tasks.',
    highlights: [
      'DSA tracking and analytics',
      'LeetCode, Codeforces, CodeChef & GitHub integrations',
      'Project and task management',
      'Resume intelligence and ATS scoring',
      'Career roadmaps and skill-gap analysis',
      'Daily missions, XP, levels, and streaks',
      'Background processing through BullMQ',
      'Real-time dashboard and updates through SSE',
    ],
    details: [
      'Unified Activity Telemetry: Ingests and aggregates coding statistics and contest ratings across LeetCode, Codeforces, CodeChef, and GitHub in unified dashboards.',
      'Resume Intelligence & Evidence Claims: Evaluates resume ATS keywords and verifies claimed competencies against real GitHub commit evidence and repository contributions.',
      'Closed-Loop Growth Engine: Continuous loop (Roadmap → Focus → Evolution → Recalculation) dynamically adjusts recommended skill paths based on target company tiers.',
      'Mission Control & Focus Timers: Organizes daily engineering sprints with persistent task checklists, stopwatch / Pomodoro timers, and streak maintenance.',
      'Monorepo Architecture: Built on React 19, Express 5, MongoDB via Mongoose, and Redis, organized into 23 mounted route modules, 62 Mongoose models, and 74 schema definitions.',
      'Distributed Asynchronous Workers: Redis-backed BullMQ workers across 6 core queue types (platform-sync, system-maintenance, xp-processing, streak-recalc, notifications, profile-rebuild) handle heavy background tasks with simulated ATS integration.',
    ],
    proofPoints: [
      { label: 'API route modules', value: '23 mounted', type: 'verified', source: 'routes/index.ts on the readiness-growth branch (main has 18)' },
      { label: 'Database models', value: '62 Mongoose', type: 'verified', source: 'Counted on the readiness-growth branch (main has 31)' },
      { label: 'Core worker queues', value: '6 BullMQ', type: 'verified', source: 'QueueNames core block, plus ~14 domain workers' },
      { label: 'Platform coverage', value: '4 platforms', type: 'architecture' },
    ],
    metrics: [
      { value: '23', label: 'Route modules', evidence: 'verified' },
      { value: '62', label: 'Mongoose models', evidence: 'verified' },
      { value: '6', label: 'Core worker types', evidence: 'verified' },
    ],
    tech: ['React', 'TypeScript', 'Express.js', 'MongoDB', 'Redis', 'BullMQ', 'Vite', 'Docker', 'Zustand', 'TanStack Query'],
    repo: {
      href: 'https://github.com/VarshithReddy2006/DevTrack',
      verified: true,
      public: true,
      note: 'Public repo resolves; the 23/62 counts come from the feature/readiness-growth-system branch.',
    },
  },
  {
    id: 'stratify',
    name: 'Stratify',
    subtitle: 'AI-Powered Trade Intelligence Operating System',
    dates: 'July 2026 – August 2026',
    categoryBadge: 'Trade Intelligence · Document Compliance',
    summary:
      'Intelligent, auditable infrastructure for document processing, customs compliance, and trade decisions across global supply chains.',
    leadDescription:
      'Stratify combines layout-aware OCR, deterministic mathematical compliance validation, HS tariff classification, and pgvector hybrid retrieval into an auditable modular monolith, providing verifiable decision proposals with immutable audit traceability.',
    highlights: [
      'Multi-page OCR & structured document extraction',
      'Invoice and shipping-document reconciliation',
      'Deterministic validation of financial values & compliance',
      'HS tariff classification and customs duty estimation',
      'Incoterm verification and trade risk scoring',
      'Knowledge graph & hybrid retrieval using PostgreSQL with pgvector',
      'Multi-provider AI gateway with configurable fallback',
      'Human-in-the-loop review for uncertain or high-risk decisions',
      'Tenant isolation, audit traceability & 5-tier RBAC',
      'Asynchronous OCR and inference processing with Celery',
    ],
    details: [
      'Document Intelligence & OCR: Ingests Commercial Invoices, Bills of Lading, and Packing Lists via layout-aware PaddleOCR, demonstrated in test suites with sample document fixtures.',
      'Deterministic Compliance Validation: High-stakes calculations (math checks, currency normalization, unit consistency) are evaluated through programmatic, deterministic services rather than generative LLMs.',
      'HS Tariff Classification & Duties: Recommends Harmonized System tariff codes and calculates ad valorem, specific, and compound customs duties with landed-cost projections.',
      'Hybrid Retrieval & Knowledge Graph: Connects trade entities (Shipper, Carrier, Port, Commodity, HS Code) in a structured graph alongside pgvector HNSW semantic vector indexes.',
      'Enterprise AI Gateway: Enforces tenant token budgets, in-flight PII redaction, semantic caching, and dynamic failover across OpenAI, Claude, Gemini, DeepSeek, and local Ollama.',
      'Human-in-the-Loop Governance: Unresolved anomalies or low-confidence determinations route to dedicated side-by-side review consoles before committing immutable audit ledgers.',
      'Asynchronous Worker Pipeline: Celery task workers backed by Redis priority queues isolate compute-intensive document extraction and model inference from web requests.',
    ],
    proofPoints: [
      { label: 'Role-based access', value: '5-tier RBAC', type: 'verified', source: 'UserRole enum in backend/app/auth' },
      { label: 'Vector indexing', value: 'pgvector HNSW', type: 'verified', source: 'knowledge/vectorstore/pgvector.py' },
      { label: 'Task distribution', value: 'Celery + Redis', type: 'verified', source: 'app/tasks and compose workers' },
      { label: 'Decision auditability', value: 'Audit ledger', type: 'architecture' },
    ],
    metrics: [
      { value: '5-Tier', label: 'RBAC isolation', evidence: 'verified' },
      { value: 'pgvector', label: 'Hybrid search', evidence: 'verified' },
      { value: 'Celery', label: 'Async OCR queue', evidence: 'verified' },
    ],
    tech: ['Python', 'FastAPI', 'Next.js', 'React', 'TypeScript', 'PostgreSQL', 'pgvector', 'Redis', 'Celery', 'Docker', 'PaddleOCR'],
    repo: {
      href: 'https://github.com/VarshithReddy2006/Stratify',
      verified: false,
      public: false,
      note: 'Returned 404 when checked (private or not yet published).',
    },
  },
  {
    id: 'phishing',
    name: 'PhishGuard AI',
    subtitle: 'Real-Time Phishing Website Detection',
    dates: 'January 2026 – April 2026',
    categoryBadge: 'Cybersecurity · Local-First ML',
    summary:
      'A local-first phishing detection system that evaluates URL structure using machine learning, scoring 58 lexical and structural features on localhost with zero cloud queries.',
    leadDescription:
      'Operating entirely on the client machine via a Chrome Extension (Manifest V3) and local Flask REST API, PhishGuard AI extracts 58 structural and lexical URL features and runs Gradient Boosting inference locally, designed for under 15 ms per request without cloud queries.',
    highlights: [
      'Extraction of 58 structural and lexical URL features',
      'Flask REST API and local browser dashboard',
      'Chrome Extension using Manifest V3',
      'Local-first: zero third-party threat-intelligence lookups',
      'Background feedback collection and model retraining',
      'Atomic model replacement and in-memory hot-reloading',
      'Risk escalation for low-confidence legitimate predictions',
    ],
    details: [
      '58-Dimension Feature Engineering: Extracts lexical signals, brand tokens, character entropy, TLD risk scores, and Punycode homograph indicators (designed for under 2 ms).',
      'Localhost ML Inference: Evaluates URLs with a Gradient Boosting Classifier on consumer CPUs, targeting under 10 ms inference and under 100 MB memory (not yet benchmarked).',
      'Privacy-First Architecture: Inferences run exclusively on localhost (127.0.0.1) without transmitting browsing history or URLs to external threat-intelligence services.',
      'Continuous Feedback & Retraining: Appends user corrections to local flat-file datasets, running automated retraining loops that validate candidate accuracy before promotion.',
      'Zero-Downtime Hot-Reloading: Model weights are atomically swapped in memory via watcher threads, updating classification models without service interruption.',
      'Probability Calibration: Applies Platt Scaling to map raw ensemble scores to calibrated probabilities and four discrete risk levels (Legitimate, Suspicious, Phishing, Unknown).',
    ],
    proofPoints: [
      { label: 'Validation accuracy', value: '90.83%', type: 'reported', source: 'README; no saved metrics artifact yet' },
      { label: 'Training dataset', value: '11,438 URLs', type: 'verified', source: 'Rows in Backend/dataset.csv' },
      { label: 'URL features', value: '58 features', type: 'verified', source: 'FEATURE_COLUMNS in the feature extractor' },
      { label: 'Request latency', value: '< 15 ms goal', type: 'target', source: 'Latency profiling is still open on the roadmap' },
    ],
    metrics: [
      { value: '58', label: 'URL features', evidence: 'verified' },
      { value: '11,438', label: 'Dataset URLs', evidence: 'verified' },
      { value: '90.83%', label: 'Accuracy (README)', evidence: 'reported', note: 'Hold-out accuracy stated in the README' },
    ],
    tech: ['Python', 'Flask', 'Scikit-learn', 'Pandas', 'NumPy', 'JavaScript', 'HTML', 'CSS', 'Chrome Extension API'],
    repo: {
      href: 'https://github.com/VarshithReddy2006/PhishingWebsite_Detection',
      verified: true,
      public: true,
      note: 'Redirects to github.com/karthikey-boda/PhishingWebsite_Detection.',
    },
  },
];

export const experience = {
  org: 'OpenMRS Core',
  role: 'Backend Contributor',
  dates: 'March 2026 – April 2026',
  points: [
    'Refactored archiveVoidedObs using bulk SQL operations, eliminating N+1 queries.',
    'Implemented idempotent, retry-safe archiving using NOT EXISTS guards and safe deletion logic.',
  ],
  /** Lists merged/open PRs by the author in openmrs-core. Swap for a specific PR URL if preferred. */
  href: 'https://github.com/openmrs/openmrs-core/pulls?q=is%3Apr+author%3AVarshithReddy2006',
} as const;

export const skills = [
  { group: 'Languages', items: ['Java', 'Python', 'JavaScript', 'TypeScript', 'SQL'] },
  { group: 'Frontend', items: ['React', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap'] },
  { group: 'Backend', items: ['Node.js', 'Express.js', 'FastAPI', 'REST APIs'] },
  { group: 'Databases', items: ['MongoDB', 'Redis', 'SQLite', 'ChromaDB'] },
  { group: 'Tools & Platforms', items: ['Docker', 'Git', 'GitHub Actions', 'CI/CD', 'BullMQ', 'scikit-learn'] },
  {
    group: 'Core CS',
    items: [
      'Data Structures & Algorithms',
      'OOP',
      'System Design',
      'Database Design',
      'Database Optimization',
      'Operating Systems',
    ],
  },
] as const;

export const achievements = [
  {
    id: 'leetcode',
    title: 'Top 8.46% Globally on LeetCode',
    body: '408 problems solved across Easy, Medium, and Hard. Contest rating 1798, ranked 73,582 globally.',
    icon: 'trophy',
  },
  {
    id: 'gssoc',
    title: 'Top 1% Contributor — GSSoC 2026',
    body: 'GirlScript Summer of Code 2026.',
    icon: 'star',
  },
  {
    id: 'openmrs',
    title: 'OpenMRS Core',
    body: 'Production Contributor to the OpenMRS Core backend.',
    icon: 'pr',
  },
  {
    id: 'oracle',
    title: 'Oracle Certified Foundations Associate',
    body: 'Agentic AI — Oracle University, August 2026.',
    icon: 'award',
  },
] as const;

export const contact = {
  heading: 'Let’s Build Something Amazing Together.',
  description:
    "I'm always open to discussing new opportunities, interesting projects, or just having a chat about technology and ideas.",
} as const;
