import { GraphNode, GraphEdge, GraphEvidence, NodeType, EdgeType } from './types'
import { buildIndex, GraphIndex } from './graph'

export interface RetrievalResult {
  skill_name: string
  category: string
  confidence: number
  source: 'graph' | 'vector' | 'hybrid'
  evidence?: string
  projects: string[]
  score: number
}

export interface NarrativeResult {
  project_id: string
  project_name: string
  narrative_text: string
  period_start?: string
  period_end?: string
  mentioned_skills: string[]
  mentioned_technologies: string[]
}

export interface CareerStoryResult {
  projects: Array<Record<string, unknown>>
  skills: Array<Record<string, unknown>>
  narratives: Array<Record<string, unknown>>
}

export interface GraphStats {
  nodes_total: number
  edges_total: number
  evidence_total: number
  [key: string]: number
}

function nodeLabel(idx: GraphIndex, id: string): string {
  const n = idx.nodesById.get(id)
  return n?.label || id
}

export async function getStats(): Promise<GraphStats> {
  const idx = await buildIndex()
  const counts: Record<string, number> = {}
  for (const [type, list] of idx.nodesByType.entries()) {
    counts[`node:${type}`] = list.length
  }
  counts.nodes_total = idx.nodesById.size
  counts.edges_total = Array.from(idx.edgesByKey.values()).length
  counts.evidence_total = idx.evidenceById.size
  return counts as GraphStats
}

export async function listSkills(minConfidence = 0): Promise<RetrievalResult[]> {
  const idx = await buildIndex()
  const skills = idx.nodesByType.get('skill') || []
  const techs = idx.nodesByType.get('technology') || []
  const all = [...skills, ...techs]

  // Count incoming USES / EVIDENCES / IMPLEMENTS as usage count
  const results: RetrievalResult[] = []
  for (const n of all) {
    if (n.confidence < minConfidence) continue
    const inEdges = idx.inEdges.get(n.id) || []
    const projectSet = new Set<string>()
    for (const e of inEdges) {
      if (['USES', 'EVIDENCES', 'IMPLEMENTS'].includes(e.type)) {
        const src = idx.nodesById.get(e.from)
        if (src?.type === 'project' || src?.type === 'repo') {
          projectSet.add(src.label)
        }
      }
    }
    results.push({
      skill_name: n.label,
      category: n.type === 'technology' ? 'technology' : (n.properties.category as string) || 'skill',
      confidence: n.confidence,
      source: 'graph',
      evidence: projectSet.size > 0 ? `Used in ${projectSet.size} project(s)` : undefined,
      projects: Array.from(projectSet),
      score: n.confidence,
    })
  }
  results.sort((a, b) => b.confidence - a.confidence)
  return results
}

export async function searchSkills(query: string, limit = 10): Promise<RetrievalResult[]> {
  const all = await listSkills(0)
  const q = query.toLowerCase()
  const filtered = all.filter(
    (s) =>
      s.skill_name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
  )
  return filtered.slice(0, limit)
}

export async function getSkillEvidence(skillName: string): Promise<Array<Record<string, unknown>>> {
  const idx = await buildIndex()
  const skill = Array.from(idx.nodesById.values()).find(
    (n) => n.label.toLowerCase() === skillName.toLowerCase() && (n.type === 'skill' || n.type === 'technology')
  )
  if (!skill) return []

  const inEdges = idx.inEdges.get(skill.id) || []
  return inEdges
    .filter((e) => ['HAS_SKILL', 'REQUIRES_SKILL', 'EVIDENCES', 'USES', 'IMPLEMENTS'].includes(e.type))
    .map((e) => {
      const src = idx.nodesById.get(e.from)
      return {
        skill_name: skill.label,
        category: skill.type,
        confidence: e.weight,
        source: src?.label || e.from,
        edge_type: e.type,
        evidence: e.evidence.length > 0 ? e.evidence.join(', ') : undefined,
      }
    })
}

export async function listProjects(): Promise<Array<Record<string, unknown>>> {
  const idx = await buildIndex()
  const repos = idx.nodesByType.get('repo') || []
  const deployments = idx.nodesByType.get('deployment') || []
  const projects = idx.nodesByType.get('project') || []
  const all = [...repos, ...deployments, ...projects]

  const out = all.map((n) => {
    const props = n.properties || {}
    return {
      id: n.id,
      name: n.label,
      description: props.description || props.summary || props.llm_summary || '',
      source: n.provider || (n.type === 'repo' ? 'github' : n.type === 'deployment' ? 'deployment' : 'project'),
      url: props.url || props.html_url || props.production_url || '',
      pushed_at: props.pushed_at || props.updated_at || props.updated || '',
      tags: n.tags,
      type: n.type,
    }
  })
  out.sort((a, b) => {
    const da = (a.pushed_at as string) || ''
    const db = (b.pushed_at as string) || ''
    return db.localeCompare(da)
  })
  return out
}

export async function retrieve(query: string, topK = 5): Promise<RetrievalResult[]> {
  const q = query.toLowerCase()
  const tokens = q.split(/\s+/).filter((t) => t.length > 2 && !stopwords.has(t))

  // Try skills first
  const skills = await searchSkills(query, topK * 2)

  // Also search projects/repos
  const idx = await buildIndex()
  const projects = idx.nodesByType.get('project') || []
  const repos = idx.nodesByType.get('repo') || []
  const allProjects = [...projects, ...repos]

  const projectMatches: RetrievalResult[] = []
  for (const n of allProjects) {
    const label = n.label.toLowerCase()
    const desc = String(n.properties.description || n.properties.summary || '').toLowerCase()
    let score = 0
    if (tokens.some((t) => label.includes(t))) score += 3
    if (tokens.some((t) => desc.includes(t))) score += 2
    if (q.includes('project') || q.includes('repo')) score += 1
    if (score > 0) {
      projectMatches.push({
        skill_name: n.label,
        category: n.type,
        confidence: Math.min(1, score / 5),
        source: 'graph',
        projects: [],
        score,
      })
    }
  }
  projectMatches.sort((a, b) => b.score - a.score)

  // Combine and dedupe
  const seen = new Set<string>()
  const combined: RetrievalResult[] = []
  for (const r of [...skills, ...projectMatches]) {
    const key = `${r.skill_name.toLowerCase()}:${r.category}`
    if (!seen.has(key)) {
      seen.add(key)
      combined.push(r)
    }
  }
  combined.sort((a, b) => b.confidence - a.confidence)
  return combined.slice(0, topK)
}

export async function retrieveNarratives(query = '', topK = 5): Promise<NarrativeResult[]> {
  const idx = await buildIndex()
  const narratives = idx.nodesByType.get('document') || []
  const q = query.toLowerCase()

  const results: NarrativeResult[] = []
  for (const n of narratives) {
    const text = String(n.properties.text || n.properties.body || n.properties.summary || n.label).toLowerCase()
    if (q && !text.includes(q)) continue
    // Find linked project via DESCRIBED_BY / DOCUMENTS edge
    const inEdges = idx.inEdges.get(n.id) || []
    const projEdge = inEdges.find((e) => e.type === 'DESCRIBED_BY' || e.type === 'DOCUMENTS')
    const proj = projEdge ? idx.nodesById.get(projEdge.from) : undefined

    results.push({
      project_id: proj?.id || n.id,
      project_name: proj?.label || 'Unknown',
      narrative_text: String(n.properties.text || n.properties.body || n.label),
      period_start: n.properties.period_start as string,
      period_end: n.properties.period_end as string,
      mentioned_skills: [],
      mentioned_technologies: [],
    })
    if (results.length >= topK) break
  }
  return results
}

export async function retrieveCareerStory(
  periodStart?: string,
  periodEnd?: string,
  topic = '',
  topK = 5
): Promise<CareerStoryResult> {
  const idx = await buildIndex()
  const projects = idx.nodesByType.get('repo') || []
  const q = topic.toLowerCase()

  const matchedProjects = projects
    .filter((p) => {
      const pushed = String(p.properties.pushed_at || '')
      if (periodStart && pushed && pushed < periodStart) return false
      if (periodEnd && pushed && pushed > periodEnd) return false
      if (q) {
        const label = p.label.toLowerCase()
        const desc = String(p.properties.description || '').toLowerCase()
        return label.includes(q) || desc.includes(q)
      }
      return true
    })
    .slice(0, topK)

  const projData = matchedProjects.map((p) => ({
    id: p.id,
    name: p.label,
    description: p.properties.description || '',
    pushed_at: p.properties.pushed_at || '',
    source: p.provider || 'github',
  }))

  // Gather skills for matched projects
  const skillSet = new Map<string, string>()
  for (const p of matchedProjects) {
    const outEdges = idx.outEdges.get(p.id) || []
    for (const e of outEdges) {
      if (e.type === 'USES' || e.type === 'REQUIRES_SKILL') {
        const target = idx.nodesById.get(e.to)
        if (target) skillSet.set(target.label, target.type)
      }
    }
  }

  const skills = Array.from(skillSet.entries()).map(([name, category]) => ({ name, category }))

  // Gather narratives
  const narratives = (await retrieveNarratives(topic, topK)).map((n) => ({
    project_id: n.project_id,
    text: n.narrative_text,
    period_start: n.period_start,
    period_end: n.period_end,
  }))

  return { projects: projData, skills, narratives }
}

export async function getTimeline(year?: number, limit = 20): Promise<Array<Record<string, unknown>>> {
  const all = await listProjects()
  let out = all
  if (year) {
    const prefix = String(year)
    out = all.filter((p) => {
      const pushed = String(p.pushed_at || p.created_at || '')
      return pushed.startsWith(prefix)
    })
  }
  return out.slice(0, limit)
}

export async function mcpContext(
  query?: string,
  nodeId?: string,
  sectionHint: 'project_card' | 'skill_panel' | 'repo_deep_dive' | 'timeline' | 'concept_map' | 'auto' = 'auto',
  limitNodes = 30,
  limitEdges = 60,
  hops = 2
) {
  const idx = await buildIndex()

  // Pick focal node
  let focal: GraphNode | undefined
  if (nodeId) focal = idx.nodesById.get(nodeId)
  if (!focal && query) {
    const q = query.toLowerCase()
    const typeBias = mcpTypeBias(sectionHint)
    let bestScore = -1
    for (const n of idx.nodesById.values()) {
      if (!typeBias.has(n.type)) continue
      const score = nodeMatchScore(n, q)
      if (score > bestScore) {
        bestScore = score
        focal = n
      }
    }
  }
  if (!focal) {
    // Fallback: highest-degree repo/project
    focal = topNodeByDegree(idx, new Set(['repo', 'project', 'person']))
  }
  if (!focal) throw new Error('No focal node found')

  // BFS subgraph
  const visited = new Set<string>([focal.id])
  const outNodes: GraphNode[] = [focal]
  const outEdges: GraphEdge[] = []
  const queue: Array<{ id: string; depth: number }> = [{ id: focal.id, depth: 0 }]

  const preferred = preferredEdgesFor(sectionHint)

  while (queue.length && outNodes.length < limitNodes && outEdges.length < limitEdges) {
    const { id, depth } = queue.shift()!
    if (depth >= hops) continue

    const edges = [
      ...(idx.outEdges.get(id) || []),
      ...(idx.inEdges.get(id) || []),
    ]
    edges.sort((a, b) => {
      const pa = preferred.has(a.type) ? 0 : 1
      const pb = preferred.has(b.type) ? 0 : 1
      if (pa !== pb) return pa - pb
      return b.weight - a.weight
    })

    for (const e of edges) {
      if (outEdges.length >= limitEdges) break
      const other = e.from === id ? e.to : e.from
      if (!visited.has(other) && outNodes.length < limitNodes) {
        const node = idx.nodesById.get(other)
        if (node) {
          outNodes.push(node)
          visited.add(other)
          queue.push({ id: other, depth: depth + 1 })
        }
      }
      if (visited.has(other)) {
        outEdges.push(e)
      }
    }
  }

  // Auto section
  const section = sectionHint === 'auto' ? autoSection(focal) : sectionHint
  const { markdown, summary } = renderMarkdown(section, focal, outNodes, outEdges, idx)

  // Evidence
  const evIds = new Set<string>()
  for (const e of outEdges) {
    for (const ev of e.evidence) evIds.add(ev)
  }
  const evidence = Array.from(evIds)
    .slice(0, 50)
    .map((id) => idx.evidenceById.get(id))
    .filter(Boolean)
    .map((ev) => ({
      id: ev!.id,
      evidence_type: ev!.evidence_type,
      locator: ev!.locator,
      excerpt: ev!.excerpt,
      confidence: ev!.confidence || 0,
    }))

  return {
    primary_node_id: focal.id,
    section_hint: section,
    nodes: outNodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      slug: n.slug || '',
      tags: n.tags,
      confidence: n.confidence,
      provider: n.provider,
      properties: n.properties,
    })),
    edges: outEdges.map((e) => ({
      from: e.from,
      to: e.to,
      type: e.type,
      weight: e.weight,
      evidence: e.evidence,
    })),
    evidence,
    rendered_markdown: markdown,
    summary,
    stats: { nodes: outNodes.length, edges: outEdges.length, evidence: evidence.length },
  }
}

function nodeMatchScore(n: GraphNode, q: string): number {
  let score = 0
  const label = n.label.toLowerCase()
  if (q === label) score += 5
  else if (q.includes(label) || label.includes(q)) score += 3
  for (const tag of n.tags) {
    const t = tag.toLowerCase()
    if (q === t) score += 2
    else if (t.includes(q)) score += 1
  }
  const desc = String(n.properties.description || '').toLowerCase()
  if (desc.includes(q)) score += 1.5
  const summary = String(n.properties.llm_summary || '').toLowerCase()
  if (summary.includes(q)) score += 1
  if (score > 0) score *= Math.max(0.5, n.confidence)
  return score
}

function topNodeByDegree(idx: GraphIndex, types: Set<string>): GraphNode | undefined {
  let best: GraphNode | undefined
  let bestDeg = -1
  for (const n of idx.nodesById.values()) {
    if (!types.has(n.type)) continue
    const deg = (idx.outEdges.get(n.id)?.length || 0) + (idx.inEdges.get(n.id)?.length || 0)
    if (deg > bestDeg) {
      bestDeg = deg
      best = n
    }
  }
  return best
}

function mcpTypeBias(hint: string): Set<string> {
  switch (hint) {
    case 'project_card':
      return new Set(['project', 'repo'])
    case 'skill_panel':
      return new Set(['skill', 'technology'])
    case 'repo_deep_dive':
      return new Set(['repo'])
    case 'timeline':
      return new Set(['career_phase', 'timeline_event', 'repo'])
    case 'concept_map':
      return new Set(['concept', 'methodology', 'knowledge_domain'])
    default:
      return new Set([
        'person', 'organization', 'project', 'repo', 'deployment', 'skill',
        'technology', 'concept', 'methodology', 'knowledge_domain',
        'career_phase', 'timeline_event', 'file', 'function', 'class',
      ])
  }
}

function preferredEdgesFor(hint: string): Set<string> {
  switch (hint) {
    case 'project_card':
      return new Set(['USES', 'IMPLEMENTS', 'DEPLOYS_TO', 'CONTAINS', 'AUTHORED', 'DOCUMENTS'])
    case 'skill_panel':
      return new Set(['EVIDENCES', 'USES', 'IMPLEMENTS', 'BELONGS_TO_DOMAIN'])
    case 'repo_deep_dive':
      return new Set(['CONTAINS', 'DEFINES', 'IMPORTS', 'CALLS', 'USES', 'DOCUMENTS'])
    case 'timeline':
      return new Set(['OCCURRED_DURING', 'PRECEDES', 'EVOLVED_INTO', 'AUTHORED'])
    case 'concept_map':
      return new Set(['IMPLEMENTS', 'RELATED_TO', 'BELONGS_TO_DOMAIN', 'MENTIONS'])
    default:
      return new Set(['USES', 'IMPLEMENTS', 'CONTAINS', 'EVIDENCES'])
  }
}

function autoSection(n: GraphNode): string {
  switch (n.type) {
    case 'repo':
      return 'repo_deep_dive'
    case 'project':
      return 'project_card'
    case 'skill':
    case 'technology':
      return 'skill_panel'
    case 'concept':
    case 'methodology':
    case 'knowledge_domain':
      return 'concept_map'
    case 'career_phase':
    case 'timeline_event':
      return 'timeline'
    default:
      return 'project_card'
  }
}

function renderMarkdown(
  section: string,
  focal: GraphNode,
  nodes: GraphNode[],
  edges: GraphEdge[],
  idx: GraphIndex
): { markdown: string; summary: string } {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const fmt = (id: string) => byId.get(id)?.label || idx.nodesById.get(id)?.label || id

  const edgesOf = (type: string, source: boolean) =>
    edges.filter((e) => e.type === type && (source ? e.from === focal.id : e.to === focal.id))

  const md: string[] = []
  let summaryBits: string[] = []

  if ((section === 'project_card' || section === 'auto') && (focal.type === 'repo' || focal.type === 'project')) {
    md.push(`## ${focal.label}`)
    const desc = focal.properties.description || focal.properties.llm_summary
    if (desc) md.push(String(desc))
    const techs = Array.from(new Set(edgesOf('USES', true).map((e) => fmt(e.to)))).sort()
    if (techs.length) md.push(`\n**Stack**: ${techs.slice(0, 12).join(', ')}`)
    const concepts = Array.from(new Set(edgesOf('IMPLEMENTS', true).map((e) => fmt(e.to)))).sort()
    if (concepts.length) md.push(`\n**Implements**: ${concepts.slice(0, 8).join(', ')}`)
    const deploys = edgesOf('DEPLOYS_TO', true).map((e) => fmt(e.to))
    if (deploys.length) md.push(`\n**Deployed to**: ${deploys.slice(0, 5).join(', ')}`)
    summaryBits = [focal.label, ...techs.slice(0, 5)]
  } else if (section === 'skill_panel' || focal.type === 'skill' || focal.type === 'technology') {
    md.push(`## ${focal.label}`)
    md.push(`**Confidence:** ${focal.confidence.toFixed(2)}`)
    const incoming = edges.filter((e) => e.to === focal.id)
    const backers = Array.from(new Set(incoming.map((e) => fmt(e.from)))).sort()
    if (backers.length) {
      md.push(`\n**Backed by:**`)
      for (const b of backers.slice(0, 15)) md.push(`- ${b}`)
    }
    summaryBits = [focal.label, `used in ${backers.length} project(s)`]
  } else if (section === 'repo_deep_dive' || focal.type === 'repo') {
    md.push(`## ${focal.label} — deep dive`)
    const files = edgesOf('CONTAINS', true)
      .map((e) => fmt(e.to))
      .filter((id) => byId.get(id)?.type === 'file' || idx.nodesById.get(id)?.type === 'file')
    if (files.length) md.push(`\n**Files** (${files.length} surfaced): ${files.slice(0, 15).join(', ')}`)
    const techs = Array.from(new Set(edgesOf('USES', true).map((e) => fmt(e.to)))).sort()
    if (techs.length) md.push(`\n**Stack**: ${techs.slice(0, 20).join(', ')}`)
    summaryBits = [focal.label, 'deep dive']
  } else if (section === 'concept_map' || ['concept', 'methodology', 'knowledge_domain'].includes(focal.type)) {
    md.push(`## ${focal.label}`)
    const related = edges
      .filter((e) => e.from === focal.id && e.type === 'RELATED_TO')
      .map((e) => fmt(e.to))
    const backers = edges.filter((e) => e.to === focal.id).map((e) => fmt(e.from))
    if (backers.length) {
      md.push(`\n**Where it shows up:**`)
      for (const b of Array.from(new Set(backers)).sort().slice(0, 12)) md.push(`- ${b}`)
    }
    if (related.length) md.push(`\n**Related concepts:** ${Array.from(new Set(related)).sort().slice(0, 10).join(', ')}`)
    summaryBits = [focal.label]
  } else {
    md.push(`## ${focal.label}`)
    md.push(`_Type: ${focal.type}_`)
    for (const e of edges.slice(0, 15)) {
      md.push(`- ${fmt(e.from)} —${e.type}→ ${fmt(e.to)}`)
    }
    summaryBits = [focal.label]
  }

  return { markdown: md.join('\n').trim(), summary: summaryBits.join(' · ') }
}

const stopwords = new Set([
  'how', 'have', 'you', 'the', 'and', 'for', 'with', 'your', 'from', 'this', 'that',
  'what', 'where', 'when', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'in',
  'on', 'to', 'of', 'a', 'an', 'my', 'me', 'used', 'use', 'i', 'am', 'can', 'tell',
  'about', 'show', 'list', 'all', 'many', 'much', 'some', 'any', 'or', 'not',
  'does', 'did', 'has', 'had', 'will', 'would', 'could', 'should',
])
