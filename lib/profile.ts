export interface Profile {
  fullName: string
  displayName: string
  headline: string
  location: string
  email: string
  phone: string
  portfolio: string
  linkedin: string
  github: string
  summary: string
  openToWork: boolean
  workPreferences: string
  topSkills: string[]
  languages: { name: string; level: string }[]
}

export const profile: Profile = {
  fullName: 'Khiw (Ikkyu) Nitithadachot',
  displayName: 'Ikkyu N.',
  headline:
    'MVP AI-Augmented Full Stack Developer | Freelance AI & Data Engineer Team Lead',
  location: 'Bangkok, Thailand',
  email: 'kiw.brw@gmail.com',
  phone: '+66-82-997-1887',
  portfolio: 'https://khiw.dev',
  linkedin: 'https://www.linkedin.com/in/getintheq/',
  github: 'https://github.com/getintheQ',
  summary:
    'Full-stack AI/data engineer with a unique engineering-meets-AI trajectory. Started in mechanical engineering (CFD/FEA, nuclear, manufacturing) and pivoted into data/AI in 2023. Seven years of freelance simulation work run in parallel with an accelerating AI engineering practice: LLM agents, knowledge graphs, FastAPI/Next.js full-stack, cloud-native MLOps, and physics-informed neural networks. Proven delivery across government digital transformation (DDPM, TPQI, NDWC), climate-tech (CarbonBIM), and restaurant BI (BiteBase). C2 English, comfortable leading cross-functional teams, and deeply embedded in the Thai AI ecosystem.',
  openToWork: true,
  workPreferences: 'Bangkok · Hybrid · Remote',
  topSkills: [
    'Python',
    'LangGraph',
    'Next.js / TypeScript',
    'FastAPI',
    'PostgreSQL / pgvector',
    'Docker / Kubernetes',
    'Cloudflare Workers',
    'Neo4j / Knowledge Graphs',
    'ANSYS Fluent / CFD',
    'PINNs / Physics-Informed AI',
  ],
  languages: [
    { name: 'Thai', level: 'Native' },
    { name: 'English', level: 'C2 Proficient (EF SET 72/100)' },
  ],
}

export interface StarterChip {
  label: string
  prompt: string
}

export const starterChips: StarterChip[] = [
  {
    label: 'Cloud architecture experience',
    prompt: 'What is your cloud architecture and MLOps experience?',
  },
  {
    label: 'Production AI projects',
    prompt: 'Show me your production AI projects and what you shipped.',
  },
  {
    label: 'Leadership & team scope',
    prompt: 'Tell me about your leadership experience and team scope.',
  },
  {
    label: 'TypeScript / Next.js depth',
    prompt: 'How deep is your TypeScript and Next.js experience?',
  },
  {
    label: 'Recent 2024–2025 work',
    prompt: 'What did you ship in 2024–2025?',
  },
  {
    label: 'Knowledge graph approach',
    prompt: 'How do you approach building and querying knowledge graphs?',
  },
  {
    label: 'Career pivot story',
    prompt: 'Tell me about your career pivot from engineering to AI.',
  },
]
