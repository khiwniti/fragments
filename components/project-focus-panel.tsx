'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import {
  useAgent,
  UseAgentUpdate,
  useCopilotKit,
  useConfigureSuggestions,
  CopilotChat,
  CopilotSidebar,
} from '@copilotkit/react-core/v2'
import { CopilotKit } from '@copilotkit/react-core/v2'
import '@copilotkit/react-core/v2/styles.css'
import { ArrowLeft, ExternalLink, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ProjectData {
  name: string
  description: string
  tag: string
  url: string
}

interface ProjectFocusState {
  project: ProjectData & {
    analysis: string
    improvements: string[]
  }
}

const INITIAL_PROJECT_STATE: ProjectData & { analysis: string; improvements: string[] } = {
  name: '',
  description: '',
  tag: '',
  url: '',
  analysis: '',
  improvements: [],
}

/**
 * Subscribe to a CSS media query. Implemented via `useSyncExternalStore` so
 * the initial value is read on first render (avoids the
 * react-hooks/set-state-in-effect anti-pattern that `useEffect`-based
 * matchMedia wrappers trigger under eslint-config-next@16).
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false, // SSR fallback — assume desktop
  )
}

function ProjectFocusInner({ project }: { project: ProjectData }) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { agent } = useAgent({
    agentId: 'project-focus',
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  })
  const { copilotkit } = useCopilotKit()

  const [state, setState] = useState<ProjectData & { analysis: string; improvements: string[] }>({
    ...INITIAL_PROJECT_STATE,
    name: project.name,
    description: project.description,
    tag: project.tag,
    url: project.url,
  })
  const [changedKeys, setChangedKeys] = useState<string[]>([])
  const [showChat, setShowChat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLoading = agent.isRunning

  // --- Mobile drawer: Escape key + body scroll lock ---
  useEffect(() => {
    if (!isMobile || !showChat) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowChat(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [isMobile, showChat])

  useConfigureSuggestions({
    suggestions: [
      { title: 'Analyze this project', message: `Analyze the project ${project.name} in detail.` },
      { title: 'Suggest improvements', message: `What improvements can be made to ${project.name}?` },
      { title: 'Tech stack fit', message: `How does this project fit my tech stack?` },
      { title: 'Knowledge graph context', message: `Find related projects and context for ${project.name}.` },
    ],
    available: 'always',
  })

  // Sync agent state -> local. The AGUI snapshot IS the external system;
  // setState here is the documented bridge, not a derived-state anti-pattern
  // (matches the convention in app/chat/page.tsx:167).
  const agentState = agent.state as ProjectFocusState | undefined

  useEffect(() => {
    if (agentState?.project) {
      const p = agentState.project
      const next = {
        ...state,
        analysis: p.analysis ?? state.analysis,
        improvements: p.improvements ?? state.improvements,
      }
      const keys: string[] = []
      if (p.analysis && p.analysis !== state.analysis) keys.push('analysis')
      if (p.improvements && JSON.stringify(p.improvements) !== JSON.stringify(state.improvements)) keys.push('improvements')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (keys.length) setChangedKeys(prev => [...new Set([...prev, ...keys])])
      else setChangedKeys([])
      setState(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentState, isLoading])

  const setAgentState = (s: typeof state) => {
    if ('setState' in agent && typeof agent.setState === 'function') {
      ;(agent.setState as (s: unknown) => void)({ project: s })
    }
  }

  // Set initial state on mount — intentionally one-shot, so no deps.
  useEffect(() => {
    if (!agentState?.project) {
      setAgentState(state)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImprove = useCallback(async () => {
    if (isLoading) return
    setError(null)
    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: `Improve the project "${project.name}". Analyze its strengths, suggest concrete improvements, and relate it to my overall portfolio.`,
    })
    try {
      await copilotkit.runAgent({ agent })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get AI suggestions')
    }
  }, [agent, copilotkit, isLoading, project.name])

  const updateField = (field: string, value: string) => {
    const next = { ...state, [field]: value }
    setState(next)
    setAgentState(next)
  }

  const addImprovement = () => {
    const idea = prompt('Enter an improvement idea:')
    if (idea?.trim()) {
      const next = { ...state, improvements: [...state.improvements, idea.trim()] }
      setState(next)
      setAgentState(next)
    }
  }

  const removeImprovement = (index: number) => {
    const next = { ...state, improvements: state.improvements.filter((_, i) => i !== index) }
    setState(next)
    setAgentState(next)
  }

  return (
    <>
      {/* Main content */}
      <div className="flex-1 overflow-y-auto print:p-0 pb-20 md:pb-0">
        <div className="form-card-container mx-auto max-w-[750px] px-4 pt-4 pb-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portfolio
          </Link>

          <div className="form-card">
            {/* Project Header */}
            <div className="recipe-header">
              <input
                type="text"
                value={state.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="recipe-title-input"
                placeholder="Project name"
              />
              <div className="recipe-meta">
                <div className="meta-item">
                  <span className="meta-icon">🏷️</span>
                  <input
                    type="text"
                    value={state.tag}
                    onChange={(e) => updateField('tag', e.target.value)}
                    className="meta-text bg-transparent border-none outline-none w-24"
                    placeholder="Tag"
                  />
                </div>
                <div className="meta-item">
                  <span className="meta-icon">🔗</span>
                  <input
                    type="url"
                    value={state.url}
                    onChange={(e) => updateField('url', e.target.value)}
                    className="meta-text bg-transparent border-none outline-none w-32 text-primary"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="section-container relative">
              {changedKeys.includes('analysis') && <Ping />}
              <h2 className="section-title">Description & Analysis</h2>
              <textarea
                value={state.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="instruction-textarea w-full"
                rows={4}
                placeholder="Project description..."
              />
              {state.analysis && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">AI Analysis:</span>
                  <br />
                  {state.analysis}
                </div>
              )}
            </div>

            {/* Improvements */}
            <div className="section-container relative">
              {changedKeys.includes('improvements') && <Ping />}
              <div className="section-header">
                <h2 className="section-title">Improvements</h2>
                <button type="button" className="add-button" onClick={addImprovement}>
                  + Add Idea
                </button>
              </div>
              {state.improvements.length === 0 ? (
                <p className="text-sm text-muted-foreground/70 italic">
                  Ask the AI to suggest improvements, or add your own.
                </p>
              ) : (
                <div className="ingredients-container">
                  {state.improvements.map((improvement, index) => (
                    <div key={index} className="ingredient-card" style={{ width: '100%' }}>
                      <div className="ingredient-icon" style={{ fontSize: '14px', background: 'transparent' }}>
                        {index + 1}
                      </div>
                      <div className="ingredient-content">
                        <span className="text-sm">{improvement}</span>
                      </div>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeImprovement(index)}
                        aria-label="Remove improvement"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Improve with AI Button */}
            {/* Error banner */}
            {error && (
              <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground" role="alert">
                {error}
              </div>
            )}

            <div className="action-container">
              <button
                data-testid="improve-button"
                className={isLoading ? 'improve-button loading' : 'improve-button'}
                type="button"
                onClick={handleImprove}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Please Wait...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Improve with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: chat toggle */}
      {isMobile && (
        <>
          {/* Chat toggle button */}
          <button
            onClick={() => setShowChat(true)}
            aria-label="Open chat"
            className="md:hidden fixed bottom-4 right-4 z-40 rounded-full bg-primary text-primary-foreground p-3 shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>

          {/* Mobile chat drawer */}
          {showChat && (
            <>
              <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setShowChat(false)} aria-hidden="true" />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Chat about this project"
                className="fixed inset-x-0 bottom-0 z-40 bg-background rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col"
                style={{ height: '70vh' }}>
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
                </div>

                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex-shrink-0 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{project.name}</h3>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Close chat"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* CopilotChat */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CopilotChat agentId="project-focus" className="h-full flex flex-col" />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Desktop: CopilotSidebar */}
      {!isMobile && (
        <CopilotSidebar
          agentId="project-focus"
          defaultOpen
          labels={{
            modalHeaderTitle: `${project.name} AI`,
            chatInputPlaceholder: `Ask about ${project.name}...`,
          }}
        />
      )}
    </>
  )
}

function Ping() {
  return (
    <span className="ping-animation">
      <span className="ping-circle" />
      <span className="ping-dot" />
    </span>
  )
}

export function ProjectFocusProvider({ project }: { project: ProjectData }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit-project" agent="project-focus">
      <div className="min-h-screen w-full bg-background flex">
        <ProjectFocusInner project={project} />
      </div>
    </CopilotKit>
  )
}
