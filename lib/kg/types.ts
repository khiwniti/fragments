export type NodeType =
  | 'person'
  | 'organization'
  | 'project'
  | 'repo'
  | 'deployment'
  | 'domain'
  | 'route'
  | 'file'
  | 'module'
  | 'class'
  | 'function'
  | 'commit'
  | 'pull_request'
  | 'issue'
  | 'branch'
  | 'release'
  | 'document'
  | 'section'
  | 'conversation'
  | 'artifact'
  | 'skill'
  | 'technology'
  | 'concept'
  | 'methodology'
  | 'knowledge_domain'
  | 'timeline_event'
  | 'career_phase'

export type EdgeType =
  | 'AUTHORED'
  | 'CONTRIBUTED_TO'
  | 'OWNS'
  | 'CONTAINS'
  | 'HAS_MEMBER'
  | 'DEFINES'
  | 'IMPORTS'
  | 'CALLS'
  | 'INHERITS'
  | 'MODIFIES'
  | 'MERGED_VIA'
  | 'CLOSED_BY'
  | 'USES'
  | 'IMPLEMENTS'
  | 'EVIDENCES'
  | 'BELONGS_TO_DOMAIN'
  | 'RELATED_TO'
  | 'DEPLOYS_TO'
  | 'SERVES'
  | 'CONFIGURED_BY'
  | 'DOCUMENTS'
  | 'MENTIONS'
  | 'LINKS_TO'
  | 'OCCURRED_DURING'
  | 'PRECEDES'
  | 'EVOLVED_INTO'
  | 'TAGGED_WITH'
  | 'HAS_SKILL'
  | 'REQUIRES_SKILL'
  | 'DESCRIBED_BY'

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  slug?: string
  properties: Record<string, unknown>
  tags: string[]
  confidence: number
  career_value?: number
  provider?: string
  created?: string
  updated?: string
}

export interface GraphEdge {
  from: string
  to: string
  type: EdgeType
  weight: number
  properties: Record<string, unknown>
  evidence: string[]
}

export interface GraphEvidence {
  id: string
  evidence_type: string
  source_node_id: string
  locator: string
  excerpt: string
  confidence?: number
  extra?: Record<string, unknown>
}

export interface UniversalGraphData {
  schema_version: string
  generated_at: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  evidence?: GraphEvidence[]
  metadata?: Record<string, unknown>
}
