'use client'

import { useState, useMemo, useId, useRef, useLayoutEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Sparkles,
  Server,
  Database,
  Globe,
  Cpu,
  Layers,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

export interface ArchNode {
  id: string
  label: string
  subtitle?: string
  layer: number // 0=frontend, 1=api, 2=database, 3=infra
  tech?: string // for cross-highlighting
  icon?: 'globe' | 'server' | 'database' | 'cpu' | 'layers'
  description?: string
}

export interface ArchEdge {
  from: string
  to: string
  label?: string
}

export interface ArchMetric {
  label: string
  value: string
  detail?: string
  source?: string
}

export interface ArchDecision {
  problem: string
  solution: string
  result: string
}

export interface ProjectArchitecture {
  nodes: ArchNode[]
  edges: ArchEdge[]
  metrics: ArchMetric[]
  decisions: ArchDecision[]
}

export interface ArchitectureExplorerProps {
  architecture: ProjectArchitecture
  /** Called when user clicks a node to drill down. */
  onSelectNode?: (nodeId: string, label: string) => void
  /** Called when user clicks a tech tag. */
  onTechFocus?: (tech: string | null) => void
  /** Highlighted tech from cross-section context. */
  activeTech?: string | null
  /** Evidence popover trigger. */
  onEvidence?: (claim: string, detail: string) => void
}

// ── Default project architectures ────────────────────────────────────────
// Seeded for the two projects in the resume.

export const AI_RESUME_ARCH: ProjectArchitecture = {
  nodes: [
    { id: 'nextjs', label: 'Next.js', subtitle: 'Frontend', layer: 0, tech: 'Next.js', icon: 'globe' },
    { id: 'copilotkit', label: 'CopilotKit', subtitle: 'Agent Runtime', layer: 1, tech: 'CopilotKit', icon: 'layers' },
    { id: 'nvidia-llm', label: 'NVIDIA LLM', subtitle: 'llama-4-maverick', layer: 1, tech: 'NVIDIA', icon: 'cpu' },
    { id: 'a4-render', label: 'A4 Renderer', subtitle: 'CSS Print', layer: 0, tech: 'CSS', icon: 'layers' },
    { id: 'shared-state', label: 'AG-UI State', subtitle: 'Shared State Bus', layer: 1, tech: 'React', icon: 'server' },
    { id: 'pgvector', label: 'pgvector', subtitle: 'Vector Search', layer: 2, tech: 'PostgreSQL', icon: 'database' },
    { id: 'github-actions', label: 'GitHub Actions', subtitle: 'CI/CD', layer: 3, tech: 'DevOps', icon: 'cpu' },
  ],
  edges: [
    { from: 'nextjs', to: 'copilotkit', label: 'useAgent()' },
    { from: 'copilotkit', to: 'nvidia-llm', label: 'chat()' },
    { from: 'copilotkit', to: 'shared-state', label: 'setState()' },
    { from: 'shared-state', to: 'nextjs', label: 'OnStateChanged' },
    { from: 'copilotkit', to: 'pgvector', label: 'query_knowledge_graph' },
    { from: 'nvidia-llm', to: 'shared-state', label: 'AGUISendStateSnapshot' },
    { from: 'nextjs', to: 'a4-render', label: 'CSS @media print' },
    { from: 'github-actions', to: 'nextjs', label: 'deploy' },
  ],
  metrics: [
    { label: 'Zero console errors', value: '♻️ All 4 routes', detail: '/, /chat, /blog, /admin/login all return 200 with no runtime errors', source: 'Verified via browser + server logs' },
    { label: 'Interactive hierarchy', value: '5 sections × 3 levels', detail: 'Summary, Experience, Projects, Skills, Education — each with collapsible children, evidence popovers, and cross-section highlighting', source: 'ActiveTech state + CollapsibleChildren' },
    { label: 'Live agent state', value: '<500ms state sync', detail: 'CopilotKit AG-UI shared state propagates from agent to UI in under 500ms via OnStateChanged', source: 'AGUISendStateSnapshot architecture' },
  ],
  decisions: [
    { problem: 'NVIDIA model tool-call format incompatible with AI SDK v6', solution: 'Switched from qwen3-next to llama-4-maverick which emits properly structured tool calls', result: 'Stable agent execution, no more "Expected function.name to be a string" errors' },
    { problem: 'Initial resume generation hanging for 80+ seconds', solution: 'Seeded resume state via agent.setState() on page load instead of waiting for agent generation', result: 'Instant content render on load; agent available for refinement via chat' },
    { problem: 'Browser console errors across all four routes', solution: 'Added GET /threads handler, .maybeSingle() for anonymous users, error handling in blog client', result: 'Zero console errors on all routes (verified)' },
  ],
}

export const GRAPH_RAG_ARCH: ProjectArchitecture = {
  nodes: [
    { id: 'fastapi', label: 'FastAPI', subtitle: 'API Server', layer: 1, tech: 'Python', icon: 'server' },
    { id: 'neo4j', label: 'Neo4j', subtitle: 'Knowledge Graph', layer: 2, tech: 'Neo4j', icon: 'database' },
    { id: 'pgvector-2', label: 'pgvector', subtitle: 'Vector DB', layer: 2, tech: 'PostgreSQL', icon: 'database' },
    { id: 'langchain', label: 'LangChain', subtitle: 'RAG Pipeline', layer: 1, tech: 'Python', icon: 'cpu' },
    { id: 'nextjs-client', label: 'Next.js', subtitle: 'Chat UI', layer: 0, tech: 'Next.js', icon: 'globe' },
    { id: 'docker', label: 'Docker', subtitle: 'Containerization', layer: 3, tech: 'Docker', icon: 'layers' },
  ],
  edges: [
    { from: 'nextjs-client', to: 'fastapi', label: 'REST + SSE' },
    { from: 'fastapi', to: 'langchain', label: 'retrieve + generate' },
    { from: 'langchain', to: 'neo4j', label: 'graph query (Cypher)' },
    { from: 'langchain', to: 'pgvector-2', label: 'vector similarity' },
    { from: 'neo4j', to: 'pgvector-2', label: 'hybrid retrieval' },
    { from: 'docker', to: 'fastapi', label: 'container' },
    { from: 'docker', to: 'neo4j', label: 'container' },
    { from: 'docker', to: 'pgvector-2', label: 'container' },
  ],
  metrics: [
    { label: 'Context-aware responses', value: 'Graph + vector hybrid', detail: 'Combines knowledge graph traversal (Cypher) with vector similarity search (pgvector) for accurate, context-rich RAG', source: 'Hybrid retrieval architecture' },
    { label: 'Containerized deployment', value: '4 Docker services', detail: 'FastAPI, Neo4j, pgvector, and Next.js frontend each in their own container with docker-compose orchestration', source: 'docker-compose.yml' },
  ],
  decisions: [
    { problem: 'Pure vector search loses relationship context', solution: 'Added Neo4j knowledge graph for entity relationships alongside pgvector for semantic similarity', result: 'Hybrid retrieval captures both semantic meaning and relationship context' },
    { problem: 'LLM hallucinates portfolio facts', solution: 'Implemented RAG with graph context — all responses grounded in the knowledge graph', result: 'Verified facts, no hallucination' },
  ],
}

// ── Icon resolver ────────────────────────────────────────────────────────

function NodeIcon({ icon }: { icon?: string }) {
  const size = 14
  switch (icon) {
    case 'globe':
      return <Globe className="h-3.5 w-3.5" />
    case 'server':
      return <Server className="h-3.5 w-3.5" />
    case 'database':
      return <Database className="h-3.5 w-3.5" />
    case 'cpu':
      return <Cpu className="h-3.5 w-3.5" />
    case 'layers':
      return <Layers className="h-3.5 w-3.5" />
    default:
      return <Server className="h-3.5 w-3.5" />
  }
}

// ── Colors per layer ─────────────────────────────────────────────────────
// LAYER PALETTE — fixed by design.
// Architecture diagrams need categorical color to differentiate frontend /
// api / database / infra layers at a glance. Mapping all four to --primary
// erases the layer distinction the diagram exists to convey. Documented
// exception to the "one accent" rule, parallel to the A4-sheet print palette
// and the GitHub heatmap palette documented in DESIGN.md.

const LAYER_COLORS = [
  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' }, // 0 frontend — blue
  { bg: '#f0fdf4', border: '#86efac', text: '#166534' }, // 1 api — green
  { bg: '#fefce8', border: '#fde68a', text: '#854d0e' }, // 2 database — yellow
  { bg: '#f5f3ff', border: '#c4b5fd', text: '#5b21b6' }, // 3 infra — purple
]

// ── Main component ───────────────────────────────────────────────────────

export function ArchitectureExplorer({
  architecture,
  onSelectNode,
  onTechFocus,
  activeTech,
  onEvidence,
}: ArchitectureExplorerProps) {
  const uid = useId()
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [expandedDecision, setExpandedDecision] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  const { nodes, edges, metrics, decisions } = architecture

  const { svgWidth, svgHeight, nodePositions, layers } = useMemo(() => {
    const L = 252, P = 16, NY = 26, NODE_W = 80, NODE_H = 22
    const grouped: Record<number, ArchNode[]> = {}
    for (const n of nodes) {
      if (!grouped[n.layer]) grouped[n.layer] = []
      grouped[n.layer].push(n)
    }
    const layerKeys = Object.keys(grouped).map(Number).sort()
    const totalLayers = layerKeys.length
    const svgHeight = totalLayers * NY + 32
    const svgWidth = L

    const positions: Record<string, { x: number; y: number }> = {}
    for (const li of layerKeys) {
      const layerNodes = grouped[li]
      const totalW = layerNodes.length * NODE_W + (layerNodes.length - 1) * P
      const startX = (svgWidth - totalW) / 2
      for (let j = 0; j < layerNodes.length; j++) {
        positions[layerNodes[j].id] = {
          x: startX + j * (NODE_W + P),
          y: li * NY + 10,
        }
      }
    }
    return { svgWidth, svgHeight, nodePositions: positions, layers: layerKeys }
  }, [nodes])

  // ── SVG positions helper ───────────────────────────────────────────────
  const NODE_W = 80,
    NODE_H = 22

  const getAnchor = (id: string, side: 'bottom' | 'top'): [number, number] => {
    const p = nodePositions[id]
    if (!p) return [0, 0]
    return side === 'bottom'
      ? [p.x + NODE_W / 2, p.y + NODE_H]
      : [p.x + NODE_W / 2, p.y]
  }

  // ── Responsive SVG wrapper ───────────────────────────────────────────
  const svgRef = useRef<HTMLDivElement>(null)
  const [renderWidth, setRenderWidth] = useState(svgWidth)

  useLayoutEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setRenderWidth(Math.min(svgWidth, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [svgWidth])

  return (
    <div ref={svgRef} className="w-full max-w-full">
      <div className="border border-border rounded-md bg-card overflow-hidden print:border-black">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors print:bg-transparent print:hover:bg-transparent"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-primary" />
          Architecture Explorer
        </span>
        {isVisible ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground-dim" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground-dim" />
        )}
      </button>

      {!isVisible ? null : (
        <div className="px-3 pb-3 space-y-3">
          {/* ── SVG Architecture Diagram ─────────────────────────────── */}
          <svg
            width={renderWidth}
            height={(renderWidth / svgWidth) * svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="max-w-full h-auto overflow-visible"
            role="img"
            aria-label={`Architecture diagram with ${nodes.length} components`}
          >
            {/* Layer background strips */}
            {layers.map((li) => {
              const c = LAYER_COLORS[li] ?? LAYER_COLORS[0]
              return (
                <rect
                  key={`layer-bg-${li}`}
                  x={0}
                  y={li * 26}
                  width={svgWidth}
                  height={26}
                  fill={c.bg}
                  rx={2}
                  opacity={0.35}
                />
              )
            })}

            {/* Edges */}
            {edges.map((e, i) => {
              const from = getAnchor(e.from, 'bottom')
              const to = getAnchor(e.to, 'top')
              const isHighlighted =
                hoveredNode === e.from || hoveredNode === e.to
              return (
                <g key={`edge-${i}`}>
                  <line
                    x1={from[0]}
                    y1={from[1]}
                    x2={to[0]}
                    y2={to[1]}
                    stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                    strokeWidth={isHighlighted ? 1.5 : 0.75}
                    className="transition-all duration-150"
                  />
                  {e.label && (
                    <text
                      x={(from[0] + to[0]) / 2}
                      y={(from[1] + to[1]) / 2 - 3}
                      textAnchor="middle"
                      fill={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                      fontSize={6}
                      fontFamily="sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const pos = nodePositions[n.id]
              if (!pos) return null
              const isHovered = hoveredNode === n.id
              const isHighlightedTech =
                activeTech &&
                n.tech?.toLowerCase().includes(activeTech.toLowerCase())
              const isActive = isHovered || isHighlightedTech
              const lc = LAYER_COLORS[n.layer] ?? LAYER_COLORS[0]

              return (
                <g
                  key={`node-${n.id}`}
                  className="cursor-pointer"
                  onClick={() => onSelectNode?.(n.id, n.label)}
                  onMouseEnter={() => {
                    setHoveredNode(n.id)
                    onTechFocus?.(n.tech ?? n.label)
                  }}
                  onMouseLeave={() => {
                    setHoveredNode(null)
                    onTechFocus?.(null)
                  }}
                  onFocus={() => {
                    setHoveredNode(n.id)
                    onTechFocus?.(n.tech ?? n.label)
                  }}
                  onBlur={() => {
                    setHoveredNode(null)
                    onTechFocus?.(null)
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${n.label}${n.subtitle ? `: ${n.subtitle}` : ''}${n.description ? `. ${n.description}` : ''}`}
                >
                  {/* Node rect */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={4}
                    fill={isActive ? lc.bg : 'hsl(var(--card))'}
                    stroke={isActive ? lc.border : 'hsl(var(--border))'}
                    strokeWidth={isActive ? 2 : 1}
                    className="transition-all duration-150"
                  />
                  {/* Node label */}
                  <text
                    x={pos.x + NODE_W / 2}
                    y={pos.y + NODE_H / 2 + 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isActive ? lc.text : 'hsl(var(--foreground))'}
                    fontSize={7.5}
                    fontWeight={isActive ? 600 : 400}
                    fontFamily="sans-serif"
                    className="pointer-events-none select-none transition-all duration-150"
                  >
                    {n.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* ── Outcome Metrics ──────────────────────────────────────── */}
          {metrics.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-warning" />
                Impact Metrics
              </h4>
              <div className="grid gap-1.5">
                {metrics.map((m, i) => (
                  <div
                    key={`metric-${i}`}
                    className="flex items-start gap-2 rounded border border-border bg-muted/50 px-2 py-1.5 print:bg-transparent print:border-black/10"
                  >
                    <span className="shrink-0 text-[11px] font-bold text-primary leading-tight min-w-[100px]">
                      {m.value}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight flex-1">
                      {m.label}
                    </span>
                    {onEvidence && m.source && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEvidence(m.label, m.detail ?? '')
                        }}
                        className="shrink-0 text-warning hover:text-warning transition-colors print:hidden"
                        title="View provenance"
                      >
                        <FileText className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tech Decisions ────────────────────────────────────────── */}
          {decisions.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                <ExternalLink className="h-2.5 w-2.5 text-muted-foreground-dim" />
                Technical Decisions
              </h4>
              <div className="space-y-1">
                {decisions.map((d, i) => {
                  const isExpanded = expandedDecision === i
                  return (
                    <div
                      key={`decision-${i}`}
                      className="rounded border border-border bg-card print:border-black/10"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDecision(isExpanded ? null : i)
                        }
                        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-[10px] font-medium text-foreground hover:bg-muted transition-colors print:hover:bg-transparent"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground-dim" />
                        ) : (
                          <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground-dim" />
                        )}
                        <span className="leading-tight">{d.problem}</span>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-2 space-y-0.5">
                          <p className="text-[9px] text-muted-foreground">
                            <span className="font-semibold text-muted-foreground">
                              Solution:
                            </span>{' '}
                            {d.solution}
                          </p>
                          <p className="text-[9px] text-primary">
                            <span className="font-semibold text-primary">
                              Result:
                            </span>{' '}
                            {d.result}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  )
}
