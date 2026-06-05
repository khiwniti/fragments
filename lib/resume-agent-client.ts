/**
 * Live resume-agent backend client.
 *
 * When RESUME_AGENT_URL is configured, calls the graph-rag-resume-agent
 * backend endpoints to pull real-time graph data scoped to the recruiter's
 * question. Falls back to static getKnowledgeContext() on any error or when
 * the backend is not configured.
 */

import { getKnowledgeContext } from './knowledge'

const RESUME_AGENT_URL = process.env.RESUME_AGENT_URL
const FETCH_TIMEOUT_MS = 8000

/* ────────────────────────────────────────────────────────────────
   MCP /context endpoint types
   ────────────────────────────────────────────────────────────── */
interface MCPContextRequest {
  query?: string
  node_id?: string
  section_hint: 'project_card' | 'skill_panel' | 'repo_deep_dive' | 'timeline' | 'concept_map' | 'auto'
  limit_nodes: number
  limit_edges: number
  hops: number
}

interface MCPNodeOut {
  id: string
  type: string
  label: string
  slug: string
  tags: string[]
  confidence: number
  provider?: string | null
  properties: Record<string, unknown>
}

interface MCPEdgeOut {
  from: string
  to: string
  type: string
  weight: number
  evidence: string[]
}

interface MCPEvidenceOut {
  id: string
  evidence_type: string
  locator: string
  excerpt: string
  confidence: number
}

interface MCPContextResponse {
  primary_node_id: string | null
  section_hint: string
  nodes: MCPNodeOut[]
  edges: MCPEdgeOut[]
  evidence: MCPEvidenceOut[]
  rendered_markdown: string
  summary: string
  stats: Record<string, number>
}

/* ────────────────────────────────────────────────────────────────
   New endpoint response types
   ────────────────────────────────────────────────────────────── */
interface SkillItem {
  skill?: string
  name?: string
  category?: string
  confidence?: number
  [key: string]: unknown
}

interface SkillResponse {
  skills: SkillItem[]
  total: number
}

interface ProjectItem {
  id?: string
  name?: string
  description?: string
  source?: string
  url?: string
  tech?: string[]
  pushed_at?: string
  created_at?: string
  [key: string]: unknown
}

interface ProjectResponse {
  projects: ProjectItem[]
  total: number
}

interface CareerStoryResponse {
  projects: ProjectItem[]
  skills: SkillItem[]
  narratives: Array<Record<string, unknown>>
  period_start?: string | null
  period_end?: string | null
}

interface NarrativeItem {
  id?: string
  text?: string
  period_start?: string
  period_end?: string
  project_id?: string
  project_name?: string
  [key: string]: unknown
}

interface NarrativeResponse {
  narratives: NarrativeItem[]
  total: number
}

interface TimelineResponse {
  projects: ProjectItem[]
  total: number
}

/* ────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */
function isBackendConfigured(): boolean {
  return Boolean(RESUME_AGENT_URL && RESUME_AGENT_URL.startsWith('http'))
}

function getBaseUrl(): string {
  return RESUME_AGENT_URL!.replace(/\/$/, '')
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

async function safeFetch<T>(
  name: string,
  url: string,
  init: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, init, FETCH_TIMEOUT_MS)
    if (!res.ok) {
      console.warn(`[resume-agent] ${name} returned ${res.status} — skipping`)
      return null
    }
    return (await res.json()) as T
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn(`[resume-agent] ${name} timed out — skipping`)
    } else {
      console.warn(`[resume-agent] ${name} fetch failed:`, err.message || err)
    }
    return null
  }
}

/* ────────────────────────────────────────────────────────────────
   /api/mcp/context
   ────────────────────────────────────────────────────────────── */
async function fetchMCPContext(question: string): Promise<string | null> {
  if (!isBackendConfigured()) return null

  const url = `${getBaseUrl()}/api/mcp/context`
  const body: MCPContextRequest = {
    query: question,
    section_hint: 'auto',
    limit_nodes: 30,
    limit_edges: 60,
    hops: 2,
  }

  const data = await safeFetch<MCPContextResponse>('MCP context', url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!data) return null
  return formatMCPContext(data)
}

function formatMCPContext(data: MCPContextResponse): string {
  const lines: string[] = []

  lines.push(`=== LIVE GRAPH CONTEXT (focal: ${data.primary_node_id || 'auto'}) ===`)
  lines.push(`Summary: ${data.summary}`)

  if (data.rendered_markdown) {
    lines.push('\n--- Rendered Markdown ---')
    lines.push(data.rendered_markdown)
  }

  if (data.nodes.length > 0) {
    lines.push('\n--- Nodes ---')
    for (const n of data.nodes.slice(0, 20)) {
      const props = Object.entries(n.properties)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${String(v).slice(0, 80)}`)
        .join(', ')
      lines.push(
        `  [${n.type}] ${n.label} (conf: ${n.confidence.toFixed(2)})` +
          (props ? ` {${props}}` : '') +
          (n.tags.length ? ` tags: ${n.tags.join(', ')}` : ''),
      )
    }
  }

  if (data.edges.length > 0) {
    lines.push('\n--- Relationships ---')
    for (const e of data.edges.slice(0, 20)) {
      lines.push(`  ${e.from} --[${e.type}]→ ${e.to} (weight: ${e.weight.toFixed(2)})`)
    }
  }

  if (data.evidence.length > 0) {
    lines.push('\n--- Evidence ---')
    for (const ev of data.evidence.slice(0, 10)) {
      lines.push(`  [${ev.evidence_type}] ${ev.excerpt.slice(0, 120)}… (conf: ${ev.confidence.toFixed(2)})`)
    }
  }

  lines.push(`\nStats: ${JSON.stringify(data.stats)}`)

  return lines.join('\n')
}

/* ────────────────────────────────────────────────────────────────
   /career-story
   ────────────────────────────────────────────────────────────── */
async function fetchCareerStory(): Promise<string | null> {
  if (!isBackendConfigured()) return null

  const url = `${getBaseUrl()}/career-story?top_k=5`
  const data = await safeFetch<CareerStoryResponse>('career-story', url, {
    method: 'GET',
  })

  if (!data) return null

  const lines: string[] = ['=== CAREER STORY ===']

  if (data.projects?.length) {
    lines.push('\nProjects:')
    for (const p of data.projects) {
      lines.push(`  • ${p.name || p.id || 'Unnamed'}${p.description ? ` — ${String(p.description).slice(0, 120)}` : ''}`)
    }
  }

  if (data.skills?.length) {
    lines.push('\nSkills:')
    for (const s of data.skills) {
      lines.push(`  • ${s.skill || s.name || 'Unnamed'}${s.category ? ` (${s.category})` : ''}`)
    }
  }

  if (data.narratives?.length) {
    lines.push('\nNarratives:')
    for (const n of data.narratives) {
      const text = String(n.text || n.description || JSON.stringify(n)).slice(0, 140)
      lines.push(`  • ${text}…`)
    }
  }

  return lines.join('\n')
}

/* ────────────────────────────────────────────────────────────────
   /skills
   ────────────────────────────────────────────────────────────── */
async function fetchSkills(): Promise<string | null> {
  if (!isBackendConfigured()) return null

  const url = `${getBaseUrl()}/skills?limit=50&min_confidence=0.3`
  const data = await safeFetch<SkillResponse>('skills', url, {
    method: 'GET',
  })

  if (!data) return null

  const lines: string[] = ['=== SKILLS ===']
  for (const s of data.skills) {
    lines.push(`  • ${s.skill || s.name || 'Unnamed'}${s.category ? ` [${s.category}]` : ''}${typeof s.confidence === 'number' ? ` (conf: ${s.confidence.toFixed(2)})` : ''}`)
  }
  return lines.join('\n')
}

/* ────────────────────────────────────────────────────────────────
   /projects
   ────────────────────────────────────────────────────────────── */
async function fetchProjects(): Promise<string | null> {
  if (!isBackendConfigured()) return null

  const url = `${getBaseUrl()}/projects?limit=20`
  const data = await safeFetch<ProjectResponse>('projects', url, {
    method: 'GET',
  })

  if (!data) return null

  const lines: string[] = ['=== PROJECTS ===']
  for (const p of data.projects) {
    const tech = Array.isArray(p.tech) ? p.tech.join(', ') : ''
    lines.push(`  • ${p.name || p.id || 'Unnamed'}${p.source ? ` [${p.source}]` : ''}${p.description ? ` — ${String(p.description).slice(0, 120)}` : ''}${tech ? ` Tech: ${tech}` : ''}`)
  }
  return lines.join('\n')
}

/* ────────────────────────────────────────────────────────────────
   /narratives
   ────────────────────────────────────────────────────────────── */
async function fetchNarratives(): Promise<string | null> {
  if (!isBackendConfigured()) return null

  const url = `${getBaseUrl()}/narratives?limit=10`
  const data = await safeFetch<NarrativeResponse>('narratives', url, {
    method: 'GET',
  })

  if (!data) return null

  const lines: string[] = ['=== NARRATIVES ===']
  for (const n of data.narratives) {
    const text = n.text ? String(n.text).slice(0, 140) : ''
    lines.push(`  • ${text || n.id || 'Unnamed'}${n.project_name ? ` (project: ${n.project_name})` : ''}`)
  }
  return lines.join('\n')
}

/* ────────────────────────────────────────────────────────────────
   /timeline
   ────────────────────────────────────────────────────────────── */
async function fetchTimeline(): Promise<string | null> {
  if (!isBackendConfigured()) return null

  const url = `${getBaseUrl()}/timeline?limit=15`
  const data = await safeFetch<TimelineResponse>('timeline', url, {
    method: 'GET',
  })

  if (!data) return null

  const lines: string[] = ['=== TIMELINE ===']
  for (const p of data.projects) {
    lines.push(`  • ${p.name || p.id || 'Unnamed'}${p.pushed_at ? ` (pushed: ${p.pushed_at})` : ''}${p.created_at ? ` (created: ${p.created_at})` : ''}`)
  }
  return lines.join('\n')
}

/* ────────────────────────────────────────────────────────────────
   Keyword-based endpoint selector
   ────────────────────────────────────────────────────────────── */
function selectEndpoints(question: string): string[] {
  const q = question.toLowerCase()
  const endpoints: string[] = []

  // Always fetch these two — they are compact and high-signal
  endpoints.push('mcp')
  endpoints.push('career-story')

  // Conditionally fetch based on question domain
  if (/\b(skill|technology|stack|language|framework|tool|expertise|proficient|fluent in|familiar with)\b/.test(q)) {
    endpoints.push('skills')
  }
  if (/\b(project|product|built|shipped|deployed|repo|repository|app|platform|portfolio|demo|prototype)\b/.test(q)) {
    endpoints.push('projects')
  }
  if (/\b(timeline|when|chronology|history|date|period|duration|year|month|started|ended)\b/.test(q)) {
    endpoints.push('timeline')
  }
  if (/\b(narrative|story|description|overview|summary|detail|deep dive|elaborate)\b/.test(q)) {
    endpoints.push('narratives')
  }

  return endpoints
}

/* ────────────────────────────────────────────────────────────────
   Public API
   ────────────────────────────────────────────────────────────── */

/**
 * Get the best available knowledge context for a recruiter question.
 * Tries the live backend first; falls back to static data on any failure.
 * @deprecated Use {@link getEnrichedContext} for richer multi-endpoint data.
 */
export async function getLiveOrStaticContext(question?: string): Promise<string> {
  if (!isBackendConfigured()) {
    return getKnowledgeContext(question)
  }

  const live = await fetchMCPContext(question || '')
  if (live) {
    return live
  }

  return getKnowledgeContext(question)
}

/**
 * Fetch enriched context from multiple graph-rag-resume-agent endpoints.
 *
 * - Always calls /api/mcp/context (primary question-aware subgraph)
 *   and /career-story (compact career narrative).
 * - Conditionally calls /skills, /projects, /narratives, /timeline
 *   based on keywords in the recruiter question.
 * - Parallel fetches with independent error handling.
 * - Falls back to static knowledge data if backend is unreachable.
 */
export async function getEnrichedContext(question?: string): Promise<string> {
  if (!isBackendConfigured()) {
    return getKnowledgeContext(question)
  }

  const q = question || ''
  const endpoints = selectEndpoints(q)

  // Fire all selected fetches in parallel
  const fetchers: Record<string, () => Promise<string | null>> = {
    'mcp': () => fetchMCPContext(q),
    'career-story': () => fetchCareerStory(),
    'skills': () => fetchSkills(),
    'projects': () => fetchProjects(),
    'narratives': () => fetchNarratives(),
    'timeline': () => fetchTimeline(),
  }

  const promises = endpoints.map(async (name) => {
    const fetcher = fetchers[name]
    if (!fetcher) return null
    const result = await fetcher()
    return result
  })

  const results = await Promise.all(promises)

  // Combine successful results; if none succeed, fall back to static
  const successful = results.filter((r): r is string => r !== null)
  if (successful.length === 0) {
    console.warn('[resume-agent] All live endpoint fetches failed — falling back to static context')
    return getKnowledgeContext(question)
  }

  return successful.join('\n\n')
}
