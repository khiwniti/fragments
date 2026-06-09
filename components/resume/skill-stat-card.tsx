'use client'

import { useMemo, useState, useId } from 'react'
import { FileText, ExternalLink, Calendar, BarChart3 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

export interface SkillStat {
  name: string
  /** Years of experience (display value). */
  years: string
  /** Number of projects using this skill. */
  projectCount: number
  /** Evidence count. */
  evidenceCount: number
  /** 3-axis radar values (0-100). */
  radar: { breadth: number; depth: number; impact: number }
  /** Related project names for cross-navigation. */
  relatedProjects: { id: string; name: string }[]
  /** Evidence source. */
  source?: string
}

export interface SkillStatCardProps {
  stat: SkillStat
  /** Called when user clicks a project link to navigate. */
  onNavigateProject?: (projectId: string) => void
  /** Called when user clicks evidence anchor. */
  onEvidence?: (claim: string, detail: string) => void
}

// ── Pre-built stats for seeded skills ───────────────────────────────────

export function skillStatsFor(label: string): SkillStat | undefined {
  return SKILL_STATS[label]
}

const SKILL_STATS: Record<string, SkillStat> = {
  'TypeScript / JavaScript': {
    name: 'TypeScript / JavaScript',
    years: '8+',
    projectCount: 12,
    evidenceCount: 14,
    radar: { breadth: 85, depth: 90, impact: 88 },
    relatedProjects: [
      { id: 'proj-resume-agent', name: 'AI Resume Assistant' },
    ],
    source:
      '8+ years across frontend, backend, and full-stack projects. Expert in TypeScript type system, generics, and framework development.',
  },
  Python: {
    name: 'Python',
    years: '6+',
    projectCount: 10,
    evidenceCount: 11,
    radar: { breadth: 80, depth: 85, impact: 82 },
    relatedProjects: [
      { id: 'proj-graph-rag', name: 'Graph RAG Knowledge Base' },
    ],
    source:
      '6+ years in data engineering, API development (FastAPI), ML pipelines, and LLM agent frameworks.',
  },
  'React / Next.js': {
    name: 'React / Next.js',
    years: '7+',
    projectCount: 9,
    evidenceCount: 10,
    radar: { breadth: 82, depth: 88, impact: 85 },
    relatedProjects: [
      { id: 'proj-resume-agent', name: 'AI Resume Assistant' },
    ],
    source:
      '7+ years building production React apps. Expert in Next.js App Router, server components, and CopilotKit integration.',
  },
  'AI/ML & LLMs': {
    name: 'AI/ML & LLMs',
    years: '3+',
    projectCount: 7,
    evidenceCount: 9,
    radar: { breadth: 75, depth: 78, impact: 80 },
    relatedProjects: [
      { id: 'proj-resume-agent', name: 'AI Resume Assistant' },
      { id: 'proj-graph-rag', name: 'Graph RAG Knowledge Base' },
    ],
    source:
      '3+ years focused on LLM agents, RAG pipelines, LangChain, vector search, and CopilotKit integration.',
  },
  'Cloud (AWS/GCP)': {
    name: 'Cloud (AWS/GCP)',
    years: '5+',
    projectCount: 6,
    evidenceCount: 7,
    radar: { breadth: 72, depth: 70, impact: 75 },
    relatedProjects: [],
    source:
      '5+ years with AWS (Lambda, ECS, RDS) and GCP. Kubernetes, Terraform, Docker, and Cloudflare Workers.',
  },
  Databases: {
    name: 'Databases',
    years: '6+',
    projectCount: 8,
    evidenceCount: 8,
    radar: { breadth: 78, depth: 80, impact: 76 },
    relatedProjects: [
      { id: 'proj-graph-rag', name: 'Graph RAG Knowledge Base' },
    ],
    source:
      '6+ years with PostgreSQL (pgvector), Redis, MongoDB, Neo4j. Schema design, query optimization, and migration planning.',
  },
}

// ── Mini Radar (3-axis) ──────────────────────────────────────────────────

function MiniRadar({
  values,
  size = 48,
}: {
  values: { breadth: number; depth: number; impact: number }
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - 6
  const angles = [
    -Math.PI / 2, // top — Breadth
    Math.PI / 6, // bottom-right — Depth
    (5 * Math.PI) / 6, // bottom-left — Impact
  ]
  const labels = ['Breadth', 'Depth', 'Impact']
  const vals = [values.breadth, values.depth, values.impact]
  const color = '#6366f1' // indigo

  const gridFractions = [0.25, 0.5, 0.75, 1.0]
  const gridPolys = gridFractions.map((f) => {
    const pts = angles.map((a) => {
      const [x, y] = [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)]
      return `${x},${y}`
    })
    return pts.join(' ')
  })

  const userPoly = vals
    .map((v, i) => {
      const [x, y] = [cx + R * (v / 100) * Math.cos(angles[i]), cy + R * (v / 100) * Math.sin(angles[i])]
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={size + 4}
      height={size + 4}
      viewBox={`0 0 ${size + 4} ${size + 4}`}
      role="img"
      aria-label={`Mini skill radar: Breadth ${values.breadth}%, Depth ${values.depth}%, Impact ${values.impact}%`}
    >
      <g transform="translate(2,2)">
        {/* Grid */}
        {gridPolys.map((pts, gi) => (
          <polygon
            key={`g-${gi}`}
            points={pts}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {angles.map((a, i) => {
          const [x, y] = [cx + R * Math.cos(a), cy + R * Math.sin(a)]
          return (
            <line
              key={`a-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth={0.5}
            />
          )
        })}

        {/* Data polygon */}
        <polygon points={userPoly} fill="rgba(99,102,241,0.12)" stroke={color} strokeWidth={1.2} />

        {/* Vertex dots */}
        {vals.map((v, i) => {
          const [x, y] = [cx + R * (v / 100) * Math.cos(angles[i]), cy + R * (v / 100) * Math.sin(angles[i])]
          return <circle key={`d-${i}`} cx={x} cy={y} r={2} fill={color} />
        })}

        {/* Labels */}
        {labels.map((l, i) => {
          const lr = R + 10
          const [lx, ly] = [cx + lr * Math.cos(angles[i]), cy + lr * Math.sin(angles[i])]
          return (
            <text
              key={`l-${i}`}
              x={lx}
              y={ly + 1.5}
              textAnchor="middle"
              fill="#64748b"
              fontSize={5.5}
              fontFamily="sans-serif"
              className="select-none"
            >
              {l}
            </text>
          )
        })}

        <circle cx={cx} cy={cy} r={1} fill="#cbd5e1" />
      </g>
    </svg>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

export function SkillStatCard({
  stat,
  onNavigateProject,
  onEvidence,
}: SkillStatCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="mt-1 mb-1 border border-slate-200 rounded-md bg-white overflow-hidden print:border-black/20">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        aria-expanded={isVisible}
        aria-controls="skill-stat-details"
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors print:hover:bg-transparent"
      >
        <span className="flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-indigo-500" />
          {stat.name}
        </span>
        <span className="text-[10px] font-normal text-slate-400">
          {isVisible ? 'Hide details' : 'Show details'}
        </span>
      </button>

      {isVisible && (
        <div id="skill-stat-details" className="px-3 pb-3 space-y-2.5">
          {/* Radar + Key Metrics row */}
          <div className="flex items-start gap-4">
            <MiniRadar values={stat.radar} />
            <div className="space-y-1 flex-1 min-w-0">
              {/* Experience */}
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">{stat.years}</span>
                <span>years of experience</span>
                {onEvidence && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEvidence?.(
                        `${stat.years}+ years ${stat.name}`,
                        stat.source ?? '',
                      )
                    }}
                    className="text-amber-500 hover:text-amber-700 transition-colors print:hidden"
                    title="View provenance"
                  >
                    <FileText className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              {/* Projects */}
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">
                  {stat.projectCount}
                </span>
                <span>projects</span>
              </div>
              {/* Evidence */}
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">
                  {stat.evidenceCount}
                </span>
                <span>evidence sources</span>
              </div>
            </div>
          </div>

          {/* Related Projects */}
          {stat.relatedProjects.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-600 mb-1">
                Related Projects
              </p>
              <div className="flex flex-wrap gap-1.5">
                {stat.relatedProjects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => onNavigateProject?.(proj.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[9px] font-medium text-indigo-600 hover:bg-indigo-100 transition-colors print:border-black/20 print:bg-transparent print:text-black"
                  >
                    <ExternalLink className="h-2 w-2" />
                    {proj.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
