'use client'

import { useState, useEffect } from 'react'
import { useAgent, UseAgentUpdate, useCopilotKit } from '@copilotkit/react-core/v2'
import { profile } from '@/lib/profile'
import { Sparkles, Loader2 } from 'lucide-react'

interface ResumeFormState {
  summary: string
  headline: string
  skills: string[]
}

const INITIAL_STATE: ResumeFormState = {
  summary: profile.summary,
  headline: profile.headline,
  skills: [...profile.topSkills],
}

export function ResumeForm() {
  const { agent } = useAgent({
    agentId: 'resume',
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  })
  const { copilotkit } = useCopilotKit()

  const [state, setState] = useState<ResumeFormState>(INITIAL_STATE)
  const [changedKeys, setChangedKeys] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLoading = agent.isRunning

  // Sync agent state -> local state. The AGUI snapshot IS the external system;
  // setState here is the documented bridge, not a derived-state anti-pattern
  // (matches the convention in app/chat/page.tsx:167).
  const agentState = agent.state as { resume?: { summary?: string; headline?: string; sections?: { title?: string; items?: { label?: string }[] }[] } } | undefined

  useEffect(() => {
    if (agentState?.resume) {
      const r = agentState.resume
      const next: ResumeFormState = {
        summary: r.summary ?? state.summary,
        headline: r.headline ?? state.headline,
        skills: state.skills,
      }
      // Check for changes
      const keys: string[] = []
      if (r.summary && r.summary !== state.summary) keys.push('summary')
      if (r.headline && r.headline !== state.headline) keys.push('headline')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (keys.length) setChangedKeys(prev => [...new Set([...prev, ...keys])])
      else setChangedKeys([])

      setState(prev => ({
        summary: r.summary ?? prev.summary,
        headline: r.headline ?? prev.headline,
        skills: prev.skills,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentState, isLoading])

  const setAgentState = (s: ResumeFormState) => {
    if ('setState' in agent && typeof agent.setState === 'function') {
      ;(agent.setState as (s: unknown) => void)({ resume: s })
    }
  }

  const handleImprove = async () => {
    if (isLoading) return
    setError(null)
    agent.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Improve the resume summary and headline. Make them more compelling.',
    })
    try {
      await copilotkit.runAgent({ agent })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get AI suggestions')
    }
  }

  const updateField = (field: keyof ResumeFormState, value: string | string[]) => {
    const next = { ...state, [field]: value }
    setState(next)
    setAgentState(next)
  }

  const addSkill = () => {
    if (!newSkill.trim()) return
    const next = { ...state, skills: [...state.skills, newSkill.trim()] }
    setState(next)
    setAgentState(next)
    setNewSkill('')
  }

  const removeSkill = (index: number) => {
    const next = { ...state, skills: state.skills.filter((_, i) => i !== index) }
    setState(next)
    setAgentState(next)
  }

  return (
    <div className="form-card relative">
      {/* Toggle button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="absolute top-3 right-3 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
      >
        {showForm ? 'View Preview' : 'Edit Resume'}
      </button>

      {!showForm ? (
        /* Preview mode - show current state summary */
        <div className="space-y-3">
          <div className="text-lg font-bold text-foreground">{state.headline}</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{state.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {state.skills.map((skill, i) => (
              <span key={i} className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-secondary text-secondary-foreground">{skill}</span>
            ))}
          </div>
        </div>
      ) : (
        /* Edit mode - Recipe-style form */
        <div className="space-y-5">
          {/* Headline */}
          <div className="relative">
            {changedKeys.includes('headline') && <Ping />}
            <div className="form-section-header">
              <h3 className="form-section-title">Headline</h3>
            </div>
            <input
              type="text"
              value={state.headline}
              onChange={(e) => updateField('headline', e.target.value)}
              className="form-title-input"
              placeholder="Your professional headline"
            />
          </div>

          {/* Summary */}
          <div className="relative">
            {changedKeys.includes('summary') && <Ping />}
            <div className="form-section-header">
              <h3 className="form-section-title">Summary</h3>
            </div>
            <textarea
              value={state.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              className="form-instruction-textarea"
              rows={5}
              placeholder="Professional summary..."
            />
          </div>

          {/* Skills */}
          <div className="relative">
            <div className="form-section-header">
              <h3 className="form-section-title">Top Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {state.skills.map((skill, index) => (
                <div key={index} className="form-checkbox-label" style={{ paddingRight: '0.25rem' }}>
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="form-remove-btn"
                    style={{ width: '1.25rem', height: '1.25rem', fontSize: '0.875rem' }}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {/* Inline skill input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                placeholder="Add a skill…"
                aria-label="New skill name"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={!newSkill.trim()}
                className="form-add-btn"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground" role="alert">
          {error}
        </div>
      )}

      {/* AI Improve Button */}
      <button
        type="button"
        className={`form-improve-btn ${isLoading ? 'loading' : ''}`}
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
  )
}

function Ping() {
  return (
    <span className="absolute -left-2 top-1/2 -translate-y-1/2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
    </span>
  )
}
