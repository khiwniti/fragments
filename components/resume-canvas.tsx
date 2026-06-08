'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useAgent,
  UseAgentUpdate,
  useCopilotKit,
  useConfigureSuggestions,
} from '@copilotkit/react-core/v2'
import { resumeAgentStateSchema, type ResumeAgentState } from '@/lib/schema'
import { A4Pager, PagerBlock } from './resume/a4-pager'
import {
  ResumeHeaderBlock,
  SectionHeadingBlock,
  SectionItemBlock,
  TechFilterBar,
  EvidencePopover,
  type EvidenceState,
} from './resume/a4-blocks'
import { TechRadar, deriveRadarAxes } from './resume/tech-radar'
import {
  ArchitectureExplorer,
  AI_RESUME_ARCH,
  GRAPH_RAG_ARCH,
} from './resume/architecture-explorer'
import { ContributionHeatmap } from './resume/contribution-heatmap'
import { LanguageChart } from './resume/language-chart'

/**
 * Interactive shared-state resume canvas.
 *
 * Renders the CopilotKit `resume` agent's shared state with rich interactions:
 *
 * Cross-section tech highlighting:
 *   Hover/focus any tech badge → highlights matching items across all sections.
 *
 * Evidence popover:
 *   Click the provenance anchor on any fact claim → shows source details.
 *
 * Collapsible children:
 *   Items with sub-details show an expand/collapse affordance.
 *
 * Per-section Ask AI:
 *   Each section heading has an "Ask" button for section-scoped queries.
 *
 * Tech filtering:
 *   Filter experience/projects by technology tag.
 *
 * Click → chat drill-down:
 *   Click any section/item heading to send an expand message to the agent.
 */
export function ResumeCanvas() {
  const { agent } = useAgent({
    agentId: 'resume',
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  })
  const { copilotkit } = useCopilotKit()

  // Safe-parse the (model-written) state; fall back to last good snapshot.
  const lastGood = useRef<ResumeAgentState | undefined>(undefined)
  const parsed = resumeAgentStateSchema.safeParse(agent.state)
  if (parsed.success) lastGood.current = parsed.data
  const state = parsed.success ? parsed.data : lastGood.current

  const bootstrapped = useRef(false)

  // ── Interaction state ──────────────────────────────────────────────────
  const [activeTech, setActiveTech] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<EvidenceState | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useConfigureSuggestions({
    suggestions: [
      {
        title: 'Focus on AI projects',
        message: 'Rewrite the resume focused on AI/ML projects.',
      },
      {
        title: 'Make it one page',
        message: 'Condense the resume to one page.',
      },
      {
        title: 'Highlight leadership',
        message: 'Emphasize leadership and impact.',
      },
    ],
    available: 'always',
  })

  // ── Seed initial resume on first load ───────────────────────────────────
  const hasSections = Boolean(state?.resume?.sections?.length)
  useEffect(() => {
    if (bootstrapped.current || hasSections) return
    bootstrapped.current = true
    console.log('[resume] Seeding initial resume...')
    agent.setState({
      resume: {
        commentary:
          'Here is your resume. Chat with the assistant to refine it, or click any section to drill down.',
        focus: 'Full-stack & AI Engineer',
        sections: [
          {
            id: 'summary',
            type: 'summary',
            title: 'Professional Summary',
            items: [
              {
                id: 'summary-1',
                label: 'Summary',
                value:
                  'Full-stack engineer with expertise in AI/ML, cloud infrastructure, and building scalable applications. Passionate about creating intelligent systems that solve real-world problems.',
                tags: ['AI/ML', 'Full-stack', 'Cloud'],
              },
            ],
          },
          {
            id: 'experience',
            type: 'experience',
            title: 'Experience',
            items: [
              {
                id: 'exp-senior-engineer',
                label: 'Senior Software Engineer',
                value:
                  'Led development of AI-powered platform features, built real-time data pipelines, and mentored junior engineers.',
                detail:
                  'Architected and delivered 20+ production features including an AI-powered recommendation system and a real-time analytics dashboard. Reduced infrastructure costs by 40% through optimization.',
                tags: ['2022-Present', 'Python', 'React', 'AWS'],
                children: [
                  {
                    id: 'exp-senior-child-1',
                    label: 'AI Recommendation Engine',
                    value:
                      'Built production ML pipeline serving 100K+ daily predictions',
                    tags: ['MLflow', 'SageMaker', 'Redis'],
                  },
                  {
                    id: 'exp-senior-child-2',
                    label: 'Real-time Analytics',
                    value:
                      'Designed event-driven analytics with sub-second latency',
                    tags: ['Kafka', 'Flink', 'ClickHouse'],
                  },
                ],
              },
              {
                id: 'exp-fullstack',
                label: 'Full Stack Developer',
                value:
                  'Built customer-facing web applications with React, Node.js, and PostgreSQL.',
                detail:
                  'Developed and maintained 15+ microservices serving 500K+ monthly users. Implemented CI/CD pipelines and automated testing, reducing deployment time by 70%.',
                tags: ['2019-2022', 'React', 'Node.js', 'PostgreSQL'],
              },
            ],
          },
          {
            id: 'projects',
            type: 'projects',
            title: 'Projects',
            items: [
              {
                id: 'proj-resume-agent',
                label: 'AI Resume Assistant',
                value:
                  'Interactive resume builder with CopilotKit shared-state architecture',
                detail:
                  'Built with Next.js, CopilotKit, and NVIDIA LLM. Features real-time bidirectional state sync between agent and UI, generative content creation, and A4 export capabilities.',
                tags: ['Next.js', 'CopilotKit', 'NVIDIA'],
                url: '',
              },
              {
                id: 'proj-graph-rag',
                label: 'Graph RAG Knowledge Base',
                value:
                  'Knowledge graph with vector search for portfolio context',
                detail:
                  'Implements graph-based retrieval augmented generation for context-aware agent responses. Uses PostgreSQL + pgvector for similarity search.',
                tags: ['RAG', 'Graph DB', 'PostgreSQL'],
              },
            ],
          },
          {
            id: 'skills',
            type: 'skills',
            title: 'Skills & Technologies',
            items: [
              {
                id: 'skill-ts',
                label: 'TypeScript / JavaScript',
                value: 'Expert',
                tags: ['8+ years'],
              },
              {
                id: 'skill-py',
                label: 'Python',
                value: 'Advanced',
                tags: ['6+ years'],
              },
              {
                id: 'skill-react',
                label: 'React / Next.js',
                value: 'Expert',
                tags: ['7+ years'],
              },
              {
                id: 'skill-ai',
                label: 'AI/ML & LLMs',
                value: 'Advanced',
                tags: ['CopilotKit', 'LangChain', 'RAG'],
              },
              {
                id: 'skill-cloud',
                label: 'Cloud (AWS/GCP)',
                value: 'Advanced',
                tags: ['Kubernetes', 'Terraform'],
              },
              {
                id: 'skill-db',
                label: 'Databases',
                value: 'Advanced',
                tags: ['PostgreSQL', 'Redis', 'MongoDB'],
              },
            ],
          },
          {
            id: 'education',
            type: 'education',
            title: 'Education',
            items: [
              {
                id: 'edu-cs',
                label: 'B.S. Computer Science',
                value: 'Major University',
                tags: ['2015-2019', 'GPA: 3.8'],
                children: [
                  {
                    id: 'edu-cs-child-1',
                    label: 'Research: Distributed Systems',
                    value:
                      'Published paper on fault-tolerant microservice architecture',
                    tags: ['IEEE'],
                  },
                ],
              },
            ],
          },
        ],
      },
      highlights: [],
    })
  }, [agent, hasSections])

  // ── Interaction handlers ────────────────────────────────────────────────

  /** Drill-down: click a section/item to expand it in the chat agent. */
  const ask = useCallback(
    (id: string, label: string) => {
      if (agent.isRunning) return
      agent.addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: `Tell me more about "${label}". Expand it in the resume with sub-details.`,
      })
      copilotkit.runAgent({ agent })
    },
    [agent, copilotkit],
  )

  /** Tech focus: hover/focus on a tech badge highlights matching items. */
  const handleTechFocus = useCallback((tech: string | null) => {
    setActiveTech(tech)
  }, [])

  /** Section-scoped Ask AI: sends a focused question to the agent. */
  const askSection = useCallback(
    (sectionId: string, title: string) => {
      if (agent.isRunning) return
      agent.addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: `Regarding ${title}: provide a detailed breakdown of this section with all sub-items and evidence.`,
      })
      copilotkit.runAgent({ agent })
    },
    [agent, copilotkit],
  )

  /** Evidence popover: click the provenance anchor on a claim. */
  const handleEvidence = useCallback((claim: string, detail: string) => {
    setEvidence({ claim, detail, x: 0, y: 0 })
    // Position relative to the viewport — the anchor passes coordinates
    setTimeout(() => {
      const sel = document.activeElement
      if (sel) {
        const rect = sel.getBoundingClientRect()
        setEvidence((prev) =>
          prev
            ? { ...prev, x: rect.right + 8, y: rect.top }
            : prev,
        )
      }
    }, 10)
  }, [])

  const handleEvidenceWithCoords = useCallback(
    (claim: string, detail: string) => {
      setEvidence({ claim, detail, x: 0, y: 0 })
    },
    [],
  )

  /** Collect all tech tags from experience/projects sections for filtering. */
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    const sections = state?.resume?.sections ?? []
    for (const section of sections) {
      if (
        section?.type === 'experience' ||
        section?.type === 'projects'
      ) {
        for (const item of section.items ?? []) {
          for (const tag of item?.tags ?? []) {
            tags.add(tag)
          }
          for (const child of item?.children ?? []) {
            for (const tag of child?.tags ?? []) {
              tags.add(tag)
            }
          }
        }
      }
    }
    return [...tags]
  }, [state?.resume?.sections])

  // ── Build blocks for the pager ──────────────────────────────────────────
  const highlights = useMemo(
    () => new Set(state?.highlights ?? []),
    [state?.highlights],
  )

  const blocks: PagerBlock[] = useMemo(() => {
    const out: PagerBlock[] = [
      { key: 'header', kind: 'header', element: <ResumeHeaderBlock /> },
    ]

    const sections = (state?.resume?.sections ?? []).filter(
      (section) => section?.items && section.items.length > 0,
    )

    sections.forEach((section) => {
      // Add filter bar for experience/projects sections
      if (
        (section.type === 'experience' || section.type === 'projects') &&
        allTags.length > 0
      ) {
        out.push({
          key: `${section.id}-filter`,
          kind: 'heading',
          element: (
            <TechFilterBar
              allTags={allTags}
              activeFilter={activeFilter}
              onFilter={setActiveFilter}
            />
          ),
        })
      }

      out.push({
        key: `${section.id}-heading`,
        kind: 'heading',
        element: (
          <SectionHeadingBlock
            title={section.title}
            id={section.id}
            onSelect={ask}
            onAskSection={askSection}
            highlighted={highlights.has(section.id)}
            activeTech={activeTech}
            onTechFocus={handleTechFocus}
          />
        ),
      })

      const items = section.items ?? []
      items.forEach((item, ii) => {
        // Filter by active tech filter
        if (
          activeFilter &&
          !item?.tags?.some(
            (t) => t.toLowerCase() === activeFilter.toLowerCase(),
          )
        ) {
          // Also check children
          const hasMatchInChildren = item?.children?.some((c) =>
            c?.tags?.some(
              (t) => t.toLowerCase() === activeFilter.toLowerCase(),
            ),
          )
          if (!hasMatchInChildren) return
        }

        out.push({
          key: `${section.id}-item-${item?.id ?? ii}`,
          kind: 'item',
          element: (
            <SectionItemBlock
              item={item!}
              onSelect={ask}
              highlighted={highlights.has(item?.id ?? item?.label ?? '')}
              highlightedIds={highlights}
              activeTech={activeTech}
              onTechFocus={handleTechFocus}
              onEvidence={handleEvidenceWithCoords}
            />
          ),
        })

        // ── Architecture Explorer for project items ────────────────
        if (section.type === 'projects' && item?.id) {
          const archs: Record<string, typeof AI_RESUME_ARCH> = {
            'proj-resume-agent': AI_RESUME_ARCH,
            'proj-graph-rag': GRAPH_RAG_ARCH,
          }
          const arch = archs[item.id]
          if (arch) {
            out.push({
              key: `${section.id}-arch-${item.id}`,
              kind: 'heading',
              element: (
                <ArchitectureExplorer
                  architecture={arch}
                  onSelectNode={(id, label) => ask(`arch-${id}`, label)}
                  onTechFocus={handleTechFocus}
                  activeTech={activeTech}
                  onEvidence={handleEvidenceWithCoords}
                />
              ),
            })
          }
        }
      })
    })

    // ── Tech Radar block ────────────────────────────────────────────────
    // Add a skill radar chart after the skills section
    const skillsSection = sections.find((s) => s.type === 'skills')
    if (skillsSection?.items && skillsSection.items.length > 0) {
      const { axes, benchmark } = deriveRadarAxes(skillsSection.items)
      out.push({
        key: 'tech-radar',
        kind: 'heading',
        element: (
          <div className="pt-4 print:pt-4">
            <SectionHeadingBlock
              title="Skill Radar"
              id="tech-radar"
              onSelect={ask}
              onAskSection={(id) => {
                if (agent.isRunning) return
                agent.addMessage({
                  id: crypto.randomUUID(),
                  role: 'user',
                  content:
                    'Analyze my skill distribution across the radar axes and suggest areas for improvement.',
                })
                copilotkit.runAgent({ agent })
              }}
              highlighted={highlights.has('tech-radar')}
              activeTech={activeTech}
              onTechFocus={handleTechFocus}
            />
            <div className="flex flex-col gap-4 md:flex-row md:items-start justify-center py-4 print:py-3">
              <TechRadar
                axes={axes}
                comparison={{
                  label: 'Avg. Senior',
                  values: benchmark,
                }}
                onSelectAxis={(axis) =>
                  ask(`radar-${axis.label}`, `${axis.label} skills`)
                }
                onHoverAxis={(axis) =>
                  handleTechFocus(axis?.label ?? null)
                }
                activeTech={activeTech}
                onTechFocus={handleTechFocus}
              />
              <div className="flex flex-col items-center justify-center">
                <ContributionHeatmap />
              </div>
            </div>
          </div>
        ),
      })

      // ── Language Chart ────────────────────────────────────────────────
      out.push({
        key: 'language-chart',
        kind: 'heading',
        element: (
          <div className="pt-2 print:pt-2">
            <SectionHeadingBlock
              title="Language Distribution"
              id="language-chart"
              onSelect={ask}
              highlighted={highlights.has('language-chart')}
              activeTech={activeTech}
              onTechFocus={handleTechFocus}
            />
            <div className="flex justify-center py-3 print:py-2">
              <LanguageChart
                onHoverLanguage={(label) =>
                  handleTechFocus(label ?? null)
                }
                onClickLanguage={(label) => {
                  setActiveFilter(label)
                }}
                activeTech={activeTech}
                onTechFocus={handleTechFocus}
              />
            </div>
          </div>
        ),
      })
    }

    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state?.resume?.sections,
    highlights,
    activeTech,
    activeFilter,
    allTags,
    ask,
    askSection,
    handleTechFocus,
    handleEvidenceWithCoords,
    copilotkit,
    agent,
  ])

  // ── Render ─────────────────────────────────────────────────────────────
  if (!state?.resume?.sections?.length) {
    return (
      <div
        id="resume-print-root"
        className="mx-auto w-full max-w-[210mm] rounded-md border border-slate-200 bg-white p-12 text-center"
      >
        <div className="space-y-4">
          <p className="text-lg font-medium text-slate-600">
            Resume Assistant
          </p>
          <p className="text-sm text-slate-400">
            Use the assistant to build your resume interactively.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {evidence && (
        <EvidencePopover
          evidence={evidence}
          onClose={() => setEvidence(null)}
        />
      )}
      <div id="resume-print-root" className="mx-auto w-full max-w-[210mm]">
        <A4Pager blocks={blocks} />
        {allTags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 print:hidden">
            {allTags.slice(0, 8).map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors cursor-default ${
                  activeTech === tag
                    ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                }`}
                onMouseEnter={() => setActiveTech(tag)}
                onMouseLeave={() => setActiveTech(null)}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="improve-button inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              if (agent.isRunning) return
              agent.addMessage({
                id: crypto.randomUUID(),
                role: 'user',
                content:
                  'Improve the resume layout, content, and formatting. Make it professional and impactful.',
              })
              copilotkit.runAgent({ agent })
            }}
            disabled={agent.isRunning}
          >
            {agent.isRunning ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                Improving&hellip;
              </>
            ) : (
              <>
                <span className="text-lg">✨</span>
                Improve with AI
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
