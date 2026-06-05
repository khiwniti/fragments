import { GraphNode, GraphEdge, GraphEvidence, NodeType, EdgeType } from './types'
import { runCypher } from './neo4j'

/** Build lookup maps for fast queries */
export interface GraphIndex {
  nodesById: Map<string, GraphNode>
  edgesByKey: Map<string, GraphEdge>
  evidenceById: Map<string, GraphEvidence>
  nodesByType: Map<string, GraphNode[]>
  outEdges: Map<string, GraphEdge[]>
  inEdges: Map<string, GraphEdge[]>
}

let _index: GraphIndex | null = null

const RESERVED_NODE_KEYS = new Set([
  'id','type','label','slug','tags','confidence','career_value',
  'provider','created','updated','nodeId','node_id','nodeType','node_type','name','title'
])

function neoNodeToGraphNode(n: Record<string, unknown>): GraphNode {
  // Neo4j RETURN n { .* } returns flattened properties.
  // If a `properties` map exists (from JSON round-trip), use it.
  // Otherwise, collect all non-reserved keys into properties.
  let props: Record<string, unknown> = {}
  if (n.properties && typeof n.properties === 'object' && !Array.isArray(n.properties)) {
    props = n.properties as Record<string, unknown>
  }
  // Also merge any top-level fields not in the reserved set
  for (const [key, value] of Object.entries(n)) {
    if (!RESERVED_NODE_KEYS.has(key)) {
      props[key] = value
    }
  }

  const rawType = String(n.type || n.nodeType || n.node_type || 'unknown')
  const rawLabel = String(n.label || n.name || n.title || n.id || '')

  return {
    id: String(n.id || n.nodeId || n.node_id || ''),
    type: rawType as NodeType,
    label: rawLabel,
    slug: n.slug ? String(n.slug) : undefined,
    properties: props,
    tags: Array.isArray(n.tags) ? n.tags.map(String) : [],
    confidence: typeof n.confidence === 'number' ? n.confidence : 1,
    career_value: typeof n.career_value === 'number' ? n.career_value : undefined,
    provider: n.provider ? String(n.provider) : undefined,
    created: n.created ? String(n.created) : undefined,
    updated: n.updated ? String(n.updated) : undefined,
  }
}

const RESERVED_REL_KEYS = new Set([
  'source','from','from_id','startNode',
  'target','to','to_id','endNode',
  'relationshipType','type','weight','properties','evidence','r'
])

function neoEdgeToGraphEdge(r: Record<string, unknown>): GraphEdge {
  const rel = (r.relationship || r.r || r) as Record<string, unknown>

  let props: Record<string, unknown> = {}
  if (rel.properties && typeof rel.properties === 'object' && !Array.isArray(rel.properties)) {
    props = rel.properties as Record<string, unknown>
  }
  for (const [key, value] of Object.entries(rel)) {
    if (!RESERVED_REL_KEYS.has(key)) {
      props[key] = value
    }
  }

  const rawType = String(rel.relationshipType || rel.type || 'RELATED_TO')

  return {
    from: String(rel.source || rel.from || rel.from_id || rel.startNode || ''),
    to: String(rel.target || rel.to || rel.to_id || rel.endNode || ''),
    type: rawType as EdgeType,
    weight: typeof rel.weight === 'number' ? rel.weight : 1,
    properties: props,
    evidence: Array.isArray(rel.evidence) ? rel.evidence.map(String) : [],
  }
}

export async function buildIndex(): Promise<GraphIndex> {
  if (_index) return _index

  // Fetch all nodes with an id property
  const nodeRows = await runCypher<{ node: Record<string, unknown> }>(
    `MATCH (n) WHERE n.id IS NOT NULL RETURN n { .* } AS node`
  )
  const nodes = nodeRows.map((row) => neoNodeToGraphNode(row.node))

  // Fetch all relationships with type
  const edgeRows = await runCypher<{ relationship: Record<string, unknown> }>(
    `MATCH (a)-[r]->(b) WHERE a.id IS NOT NULL AND b.id IS NOT NULL
     RETURN { source: a.id, target: b.id, type: type(r), weight: r.weight, properties: r { .* }, evidence: r.evidence } AS relationship`
  )
  const edges = edgeRows.map((row) => neoEdgeToGraphEdge(row.relationship))

  // Fetch evidence nodes (generic: try :Evidence label first, then nodes with evidence_type property)
  const evidenceRows = await runCypher<{ evidence: Record<string, unknown> }>(
    `MATCH (e) WHERE e.id IS NOT NULL AND (e:Evidence OR e.evidence_type IS NOT NULL)
     RETURN e { .* } AS evidence`
  )
  const evidence = evidenceRows.map((row) => {
    const ev = row.evidence
    return {
      id: String(ev.id || ev.evidence_id || ''),
      evidence_type: String(ev.evidence_type || ev.type || ''),
      source_node_id: String(ev.source_node_id || ev.source || ''),
      locator: String(ev.locator || ev.url || ev.path || ''),
      excerpt: String(ev.excerpt || ev.text || ev.summary || ''),
      confidence: typeof ev.confidence === 'number' ? ev.confidence : undefined,
      extra: (ev.extra as Record<string, unknown>) || {},
    } as GraphEvidence
  })

  const nodesById = new Map<string, GraphNode>()
  const nodesByType = new Map<string, GraphNode[]>()
  for (const n of nodes) {
    nodesById.set(n.id, n)
    const list = nodesByType.get(n.type) || []
    list.push(n)
    nodesByType.set(n.type, list)
  }

  const edgesByKey = new Map<string, GraphEdge>()
  const outEdges = new Map<string, GraphEdge[]>()
  const inEdges = new Map<string, GraphEdge[]>()
  for (const e of edges) {
    const key = `${e.from}|${e.type}|${e.to}`
    edgesByKey.set(key, e)

    const outList = outEdges.get(e.from) || []
    outList.push(e)
    outEdges.set(e.from, outList)

    const inList = inEdges.get(e.to) || []
    inList.push(e)
    inEdges.set(e.to, inList)
  }

  const evidenceById = new Map<string, GraphEvidence>()
  for (const ev of evidence) {
    evidenceById.set(ev.id, ev)
  }

  _index = {
    nodesById,
    edgesByKey,
    evidenceById,
    nodesByType,
    outEdges,
    inEdges,
  }
  return _index
}

export function clearGraphCache() {
  _index = null
}
