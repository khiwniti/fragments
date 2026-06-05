/**
 * Static knowledge context for the resume agent.
 *
 * This module builds a compact, token-efficient context string from the
 * hand-curated facts in the linkedin-knowladge.md knowledge graph.
 * It is designed to be injected into the system prompt on every chat turn
 * so the model grounds its answers in real data without needing a live
 * backend.
 */

export interface ExperienceEntry {
  role: string
  org: string
  type: string
  start: string
  end: string
  duration: string
  location: string
  highlights: string[]
}

export interface ProjectEntry {
  name: string
  url?: string
  description: string
  tech: string[]
  period?: string
}

export interface SkillEntry {
  name: string
  category: string
  level?: string
}

export const experiences: ExperienceEntry[] = [
  {
    role: 'Lead Data & AI Engineer (Freelance)',
    org: 'Libralytics',
    type: 'Part-time · Remote',
    start: 'Nov 2024',
    end: 'Present',
    duration: '~1 year 7 months',
    location: 'Bangkok',
    highlights: [
      'Built BiteBase (bitebase.app) — restaurant BI platform with AI agents for market analysis, menu engineering, and sentiment analysis.',
      'Full-stack data engineering: scraping, Neo4j graph DB, vector DB, PostgreSQL, Apache Airflow ETL.',
      'MLOps infrastructure with Docker + Kubernetes for scalable AI agent deployment.',
      'FastAPI backend with auth, AI agent communication, automated report generation.',
      'Next.js + Tailwind CSS frontend, LLM-powered chatbot integration.',
      'LangGraph multi-agent orchestration for café/restaurant business model analysis.',
    ],
  },
  {
    role: 'Associate Solution Architect',
    org: 'Bangkok Silicon (BKS)',
    type: 'Full-time · Hybrid',
    start: 'Oct 2025',
    end: 'Apr 2026',
    duration: '7 months',
    location: 'Bangkok',
    highlights: [
      'CarbonBIM — AI-powered embodied carbon calculator (IFC/BIM + 104+ TGO factors, EN 15978 lifecycle).',
      'GDAS Disaster Watch — DDPM multi-hazard platform (14 hazard types, CAP v1.2, 76 provinces).',
      'NDWC Smart Alert — Thai Flood Risk Score with 48–72h lead time across 77 provinces.',
      'EarthCast AI — FourCastNet + PINNs + CesiumJS 3D weather platform.',
      '44 Vercel deployments, 51 Cloudflare Workers, government client delivery.',
    ],
  },
  {
    role: 'Data Engineer',
    org: 'Tipco Asphalt Public Company Limited',
    type: 'Contract · On-site',
    start: 'Jun 2025',
    end: 'Aug 2025',
    duration: '3 months',
    location: 'Bangkok',
    highlights: [
      'Azure Data Factory + Azure Synapse Analytics pipeline design and implementation.',
      'Oracle → cloud data storage migration with cleansing and enrichment.',
      'LLM integration into data workflows for NLP automation.',
      'Cross-functional data architecture aligned with business objectives.',
    ],
  },
  {
    role: 'Career Break — Deliberate Pivot to Data/AI',
    org: 'Self-directed',
    type: 'Career transition',
    start: 'Jun 2023',
    end: 'May 2024',
    duration: '1 year',
    location: 'Bangkok',
    highlights: [
      'Intentional investment period: SQL, Python, LLM, Machine Learning, cloud platforms.',
      'Certifications: Applied CFD (Siemens/Coursera), Generative AI API (Codio/Coursera), Prompt Engineering (Vanderbilt/Coursera), Computer Vision with OpenCV (Educative).',
      'Built kidpen.org — free STEM education platform for Thai students (Next.js, FastAPI, Qwen3).',
      'Launched AI portfolio playground on Cloudflare Workers AI with sub-2s global load times.',
    ],
  },
  {
    role: 'Service Development Specialist',
    org: 'Q-CHANG',
    type: 'Full-time · Hybrid',
    start: 'Apr 2023',
    end: 'Jul 2023',
    duration: '4 months',
    location: 'Bangkok',
    highlights: [
      'Designed SOPs and work instructions for home-service platform operations.',
      'GMV forecasting using regression techniques for business partners.',
      'Python data cleaning + text sentiment analysis for service categorization and clustering.',
      'Led air-aeration service project from proposal to new standards.',
      'Selected new assurance provider using 3 years of historical data.',
    ],
  },
  {
    role: 'Future Leader Developing Program (FLP #12)',
    org: 'Charoen Pokphand Group',
    type: 'Contract · On-site',
    start: 'Sep 2022',
    end: 'Mar 2023',
    duration: '7 months',
    location: 'Samut Prakan, Thailand',
    highlights: [
      'Optimized 24-cavity stack mold to 300,000 pieces/day capacity; focused on OEE.',
      'Sales increase +2.9M THB, cost reduction 3M THB, gross profit 2.9M THB.',
      'Python + Google Maps API tele-sales strategy for market observation.',
      'Power BI dashboard for Food Packaging Business Unit reporting at CPLI global events.',
      'Reported directly to C.P. Shareman Executive.',
    ],
  },
  {
    role: 'Operational Nuclear Engineer',
    org: 'Thailand Institute of Nuclear Technology (TINT)',
    type: 'Full-time · On-site',
    start: 'Nov 2021',
    end: 'Jul 2022',
    duration: '9 months',
    location: 'Bangkok',
    highlights: [
      'Developed maintenance systems for radiopharmaceutical production (I-131 capsule drug synthesizer).',
      'ISO 9001 and GMP compliance; WFI/PW system maintenance.',
      'Data science for proactive preventive maintenance and outlier/fraud detection.',
      'HVAC and cleanroom parameter monitoring per ASHRAE + GMP.',
    ],
  },
  {
    role: 'Mechanical Design Engineer',
    org: 'Arçelik Hitachi Home Appliances',
    type: 'Full-time · On-site',
    start: 'Jan 2021',
    end: 'Jul 2021',
    duration: '7 months',
    location: 'Kabin Buri, Prachin Buri, Thailand',
    highlights: [
      'Redesigned vacuum compartment for HITACHI FBF640 → FBF720 transition.',
      'ANSYS stress/fatigue analysis and Moldex3D injection process simulation.',
      'Prototype testing coordination with Japan laboratory.',
      'Pareto-based production cost reduction projects.',
    ],
  },
  {
    role: 'Mechanical Engineer',
    org: 'MACS',
    type: 'Full-time · On-site',
    start: 'Jun 2019',
    end: 'Jan 2021',
    duration: '1 year 8 months',
    location: 'Nonthaburi, Thailand',
    highlights: [
      'EPC project at Bangchack Refinery — post-bidding documentation, piping categorization.',
      'QC Welding Engineer per ASME Section IX; WPS/WPQ management.',
      '3D pipeline as-built drawings using AutoCAD Plant 3D.',
      'Project schedule oversight ensuring on-time completion.',
    ],
  },
]

export const projects: ProjectEntry[] = [
  {
    name: 'CarbonBIM',
    url: 'https://bim.getintheq.space',
    description:
      'AI carbon calculator for construction — IFC/BIM upload, 104+ TGO emission factors, EN 15978 lifecycle assessment.',
    tech: ['Next.js', 'IfcOpenShell', 'LangGraph', 'Claude Sonnet', 'Cloudflare'],
  },
  {
    name: 'EarthCast AI',
    url: 'https://earthcast-ai.vercel.app',
    description:
      'AI weather forecasting platform — FourCastNet + PINNs + CesiumJS 3D earth visualization.',
    tech: ['Python', 'DeepXDE', 'FourCastNet', 'CesiumJS', 'Vercel'],
  },
  {
    name: 'NDWC Smart Alert',
    url: 'https://ndwc-smart-alert.vercel.app',
    description:
      'Thai government flood risk platform — 5-dimension risk score, 48–72h lead time, 77 provinces.',
    tech: ['Next.js', 'FastAPI', 'PostgreSQL', 'NOAA GHCN', 'Vercel'],
  },
  {
    name: 'GDAS Disaster Watch',
    url: 'https://gdas-ai-disaster-watch.vercel.app',
    description:
      'DDPM multi-hazard platform — 14 hazard types, CAP v1.2 protocol, 76 provinces.',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
  },
  {
    name: 'BiteBase',
    url: 'https://bitebase.app',
    description:
      'Restaurant BI with AI agents — market analysis, menu engineering, sentiment analysis, competitor tracking.',
    tech: ['Next.js', 'FastAPI', 'LangGraph', 'PostgreSQL', 'Docker', 'Kubernetes'],
  },
  {
    name: 'kidpen.org',
    url: 'https://kidpen.org',
    description:
      'Free STEM education platform for Thai students (ม.1+), Brilliant.org-inspired with interactive exercises.',
    tech: ['Next.js', 'FastAPI', 'Qwen3', 'JSXGraph', 'pyBKT'],
  },
  {
    name: 'Facility Manager',
    url: 'https://facility-management-app-mocha.vercel.app',
    description:
      '3D building management system — xeokit BIM viewer + asset management + maintenance workflows.',
    tech: ['Next.js', 'xeokit', 'Three.js', 'FastAPI'],
  },
]

export const skills: SkillEntry[] = [
  // AI / ML
  { name: 'LangGraph', category: 'AI / ML' },
  { name: 'Claude Sonnet', category: 'AI / ML' },
  { name: 'Qwen3', category: 'AI / ML' },
  { name: 'MCP Protocol', category: 'AI / ML' },
  { name: 'PINNs', category: 'AI / ML' },
  { name: 'Generative AI', category: 'AI / ML' },
  { name: 'Prompt Engineering', category: 'AI / ML' },
  { name: 'RAG', category: 'AI / ML' },
  { name: 'OpenAI API', category: 'AI / ML' },
  { name: 'Machine Learning', category: 'AI / ML' },
  { name: 'Computer Vision / OpenCV', category: 'AI / ML' },
  { name: 'Python', category: 'AI / ML' },

  // Full-Stack
  { name: 'Next.js', category: 'Full-Stack' },
  { name: 'React', category: 'Full-Stack' },
  { name: 'TypeScript', category: 'Full-Stack' },
  { name: 'Tailwind CSS', category: 'Full-Stack' },
  { name: 'FastAPI', category: 'Full-Stack' },
  { name: 'Express.js', category: 'Full-Stack' },
  { name: 'shadcn/ui', category: 'Full-Stack' },
  { name: 'Cloudflare Workers', category: 'Full-Stack' },
  { name: 'Cloudflare Workers AI', category: 'Full-Stack' },

  // Data & Cloud
  { name: 'PostgreSQL', category: 'Data & Cloud' },
  { name: 'Supabase', category: 'Data & Cloud' },
  { name: 'pgvector', category: 'Data & Cloud' },
  { name: 'Neo4j', category: 'Data & Cloud' },
  { name: 'MongoDB', category: 'Data & Cloud' },
  { name: 'Azure Data Factory', category: 'Data & Cloud' },
  { name: 'Azure Synapse', category: 'Data & Cloud' },
  { name: 'Oracle', category: 'Data & Cloud' },
  { name: 'Apache Airflow', category: 'Data & Cloud' },
  { name: 'Docker', category: 'Data & Cloud' },
  { name: 'Kubernetes', category: 'Data & Cloud' },
  { name: 'Pandas', category: 'Data & Cloud' },
  { name: 'Power BI', category: 'Data & Cloud' },
  { name: 'SQL', category: 'Data & Cloud' },

  // Engineering Simulation
  { name: 'ANSYS Fluent / CFX / FEA', category: 'Engineering Simulation' },
  { name: 'COMSOL Multiphysics', category: 'Engineering Simulation' },
  { name: 'OpenFOAM', category: 'Engineering Simulation' },
  { name: 'Moldex3D', category: 'Engineering Simulation' },
  { name: 'SolidWorks / SpaceClaim', category: 'Engineering Simulation' },
  { name: 'AutoCAD Plant 3D', category: 'Engineering Simulation' },
  { name: 'CFD Analysis', category: 'Engineering Simulation' },
  { name: 'FEA Analysis', category: 'Engineering Simulation' },
  { name: 'Aerodynamics', category: 'Engineering Simulation' },
  { name: 'Heat Transfer', category: 'Engineering Simulation' },
  { name: 'HVAC Engineering', category: 'Engineering Simulation' },

  // Specialized
  { name: 'IFC / BIM', category: 'Specialized' },
  { name: 'IfcOpenShell', category: 'Specialized' },
  { name: 'EN 15978 Carbon LCA', category: 'Specialized' },
  { name: 'TGO Emission Factors', category: 'Specialized' },
  { name: 'CAP v1.2 Alerting', category: 'Specialized' },
  { name: 'NOAA GHCN', category: 'Specialized' },
  { name: 'CesiumJS', category: 'Specialized' },
  { name: 'Three.js / xeokit', category: 'Specialized' },
  { name: 'ASME Section IX', category: 'Specialized' },
  { name: 'ISO 9001', category: 'Specialized' },
  { name: 'GMP', category: 'Specialized' },
  { name: 'Radiation Safety', category: 'Specialized' },
]

export const education = {
  institution: 'Naresuan University',
  degree: "Bachelor's degree",
  field: 'Mechanical Engineering',
  start: 'Aug 2015',
  end: 'Apr 2019',
  gpa: '3.50',
  honors: 'First Class Honors (1st Honors)',
  thesis:
    'Effect of antibiotic in bone cement on pull-out strength between bone cement and Ti-4V-Al fixture screws',
}

export const certifications = [
  { name: 'Mastering Computer Vision in Python with OpenCV', issuer: 'Educative', issued: 'Apr 2024' },
  { name: 'EF SET English Certificate 72/100 (C2 Proficient)', issuer: 'EF SET', issued: 'Mar 2023' },
  { name: 'Applied Computational Fluid Dynamics', issuer: 'Siemens via Coursera', issued: '2024' },
  { name: 'Getting Started with Generative AI API Specialization', issuer: 'Codio via Coursera', issued: '2024' },
  { name: 'Prompt Engineering Specialization', issuer: 'Vanderbilt University via Coursera', issued: '2024' },
]

function formatExperience(exp: ExperienceEntry): string {
  const lines = [
    `ROLE: ${exp.role} at ${exp.org} (${exp.type})`,
    `  ${exp.start} – ${exp.end} · ${exp.duration} · ${exp.location}`,
    ...exp.highlights.map((h) => `  • ${h}`),
  ]
  return lines.join('\n')
}

function formatProject(p: ProjectEntry): string {
  const lines = [
    `PROJECT: ${p.name}${p.url ? ` (${p.url})` : ''}`,
    `  ${p.description}`,
    `  Tech: ${p.tech.join(', ')}`,
  ]
  return lines.join('\n')
}

function formatSkillsByCategory(): string {
  const byCat: Record<string, string[]> = {}
  for (const s of skills) {
    byCat[s.category] = byCat[s.category] || []
    byCat[s.category].push(s.name)
  }
  return Object.entries(byCat)
    .map(([cat, names]) => `  ${cat}: ${names.join(', ')}`)
    .join('\n')
}

/**
 * Build a compact context string tailored to a recruiter question.
 * If a question is provided, we bias toward relevant experience/projects/skills
 * by simple keyword matching. Otherwise returns a full overview.
 */
export function getKnowledgeContext(question?: string): string {
  const q = (question || '').toLowerCase()
  const keywords = q.split(/\s+/).filter((w) => w.length > 2)

  // Score relevance of an entry against keywords
  function score(text: string): number {
    const t = text.toLowerCase()
    return keywords.reduce((sum, k) => sum + (t.includes(k) ? 1 : 0), 0)
  }

  function isRelevant(text: string): boolean {
    if (!q || keywords.length === 0) return true
    return score(text) > 0
  }

  const relevantExps = experiences.filter((e) =>
    isRelevant(`${e.role} ${e.org} ${e.highlights.join(' ')}`)
  )
  const relevantProjects = projects.filter((p) =>
    isRelevant(`${p.name} ${p.description} ${p.tech.join(' ')}`)
  )
  const relevantSkills = skills.filter((s) => isRelevant(`${s.name} ${s.category}`))

  const parts: string[] = []

  parts.push('=== EXPERIENCE ===')
  if (relevantExps.length > 0) {
    relevantExps.forEach((e) => parts.push(formatExperience(e)))
  } else {
    experiences.slice(0, 3).forEach((e) => parts.push(formatExperience(e)))
  }

  parts.push('\n=== PROJECTS ===')
  if (relevantProjects.length > 0) {
    relevantProjects.forEach((p) => parts.push(formatProject(p)))
  } else {
    projects.slice(0, 3).forEach((p) => parts.push(formatProject(p)))
  }

  parts.push('\n=== SKILLS ===')
  if (relevantSkills.length > 0) {
    const byCat: Record<string, string[]> = {}
    for (const s of relevantSkills) {
      byCat[s.category] = byCat[s.category] || []
      byCat[s.category].push(s.name)
    }
    for (const [cat, names] of Object.entries(byCat)) {
      parts.push(`  ${cat}: ${names.join(', ')}`)
    }
  } else {
    parts.push(formatSkillsByCategory())
  }

  parts.push('\n=== EDUCATION ===')
  parts.push(
    `${education.degree}, ${education.field} — ${education.institution} (${education.start}–${education.end}) · GPA ${education.gpa} · ${education.honors}`
  )
  parts.push(`Thesis: ${education.thesis}`)

  parts.push('\n=== CERTIFICATIONS ===')
  certifications.forEach((c) => parts.push(`  ${c.name} — ${c.issuer} (${c.issued})`))

  return parts.join('\n')
}
