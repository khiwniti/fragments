'use client'

import { useEffect, useMemo, useReducer, useRef } from 'react'
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
} from './resume/a4-blocks'

/**
 * Interactive shared-state resume canvas.
 *
 * Renders the CopilotKit `resume` agent's shared state as print-ready A4
 * sheets. Clicking a section heading or item sends a drill-down message to
 * the agent; ids in `state.highlights` get a warning/gold ping after each turn.
 *
 * State writes come from the model (AGUISendStateSnapshot) and are
 * prompt-enforced only, so the state is safe-parsed on every render and the
 * last good snapshot is kept in a ref — a malformed snapshot never blanks
 * the resume.
 */
export function ResumeCanvas() {
  const { agent } = useAgent({
    agentId: 'resume',
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  })
  const { copilotkit } = useCopilotKit()

  // Safe-parse the (model-written) state; fall back to last good snapshot.
  // agent.state is an external data source (CopilotKit AGUI snapshot). We use
  // a reducer (not a ref, not state-in-effect) to keep "last good" — the
  // reducer pattern is allowed to be invoked during render and won't trigger
  // a synchronous re-render unless the dispatched value is referentially new.
  const [lastGood, recordGood] = useReducer<
    (_prev: ResumeAgentState | null, next: ResumeAgentState) => ResumeAgentState | null
  >(
    (_prev, next) => next,
    null,
  )
  const parsed = resumeAgentStateSchema.safeParse(agent.state)
  if (parsed.success) recordGood(parsed.data)
  const state = parsed.success ? parsed.data : lastGood

  const bootstrapped = useRef(false)

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

  // Auto-create on first load (fresh session every refresh).
  const hasSections = Boolean(state?.resume?.sections?.length)
  useEffect(() => {
    if (bootstrapped.current || hasSections) return
    bootstrapped.current = true
    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Create my resume with all necessary information.',
    })
    copilotkit.runAgent({ agent })
  }, [agent, copilotkit, hasSections])

  const ask = (id: string, label: string) => {
    if (agent.isRunning) return
    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: `Tell me more about "${label}". Expand it in the resume with sub-details.`,
    })
    copilotkit.runAgent({ agent })
  }

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
      out.push({
        key: `${section.id}-heading`,
        kind: 'heading',
        element: (
          <SectionHeadingBlock
            title={section.title}
            id={section.id}
            onSelect={ask}
            highlighted={highlights.has(section.id)}
          />
        ),
      })
      section.items.forEach((item, ii) => {
        out.push({
          key: `${section.id}-item-${item.id ?? ii}`,
          kind: 'item',
          element: (
            <SectionItemBlock
              item={item}
              onSelect={ask}
              highlighted={highlights.has(item.id ?? item.label)}
              highlightedIds={highlights}
            />
          ),
        })
      })
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.resume?.sections, highlights, agent, copilotkit])

  if (!state?.resume?.sections?.length) {
    return <ResumeSkeleton />
  }

  return (
    <div id="resume-print-root" className="mx-auto w-full max-w-[210mm]">
      <A4Pager blocks={blocks} />
    </div>
  )
}

/** Pulse skeleton shown while the agent generates the first snapshot. */
function ResumeSkeleton() {
  return (
    <div
      id="resume-print-root"
      className="mx-auto w-full max-w-[210mm] rounded-md border border-slate-200 bg-white p-8"
    >
      <p className="text-sm text-slate-500 mb-6">Generating your resume…</p>
      <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  )
}
