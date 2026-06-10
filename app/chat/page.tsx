'use client'

import { useEffect, useState } from 'react'
import { CopilotKit } from '@copilotkit/react-core/v2'
import { CopilotSidebar } from '@copilotkit/react-core/v2'
import '@copilotkit/react-core/v2/styles.css'
import { ResumeCanvas } from '@/components/resume-canvas'
import { ResumeForm } from '@/components/resume-form'
import { PullUpChat } from '@/components/pull-up-chat'
import { useConfigureSuggestions } from '@copilotkit/react-core/v2'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

function Suggestions() {
  useConfigureSuggestions({
    suggestions: [
      { title: 'Summarize my resume', message: 'Give me a professional summary of my resume.' },
      { title: 'Highlight experience', message: 'Highlight my most relevant experience for a lead role.' },
      { title: 'Suggest improvements', message: 'Suggest improvements to my resume.' },
      { title: 'Top skills', message: 'What are my top skills and how do they rank?' },
    ],
    available: 'always',
  })
  return null
}

export default function ChatPage() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [view, setView] = useState<'resume' | 'edit'>('resume')
  const agentId = 'resume'

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={agentId}>
      <Suggestions />
      <div className="flex min-h-dvh w-full bg-background">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto print:p-0 pb-20 md:pb-0">
          {/* View toggle */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border print:hidden">
            <div className="mx-auto max-w-[210mm] flex items-center gap-1 px-4 py-2">
              <button
                onClick={() => setView('resume')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  view === 'resume'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Resume Preview
              </button>
              <button
                onClick={() => setView('edit')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  view === 'edit'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Edit Resume
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-[210mm] pt-4 pb-8">
            {view === 'resume' ? <ResumeCanvas /> : <ResumeForm />}
          </div>
        </main>

        {/* Desktop: CopilotSidebar */}
        {!isMobile && (
          <CopilotSidebar
            agentId={agentId}
            defaultOpen
            labels={{
              modalHeaderTitle: 'Resume AI Chat',
              chatInputPlaceholder: 'Ask about experience, skills, or projects...',
              welcomeMessageText: 'Ask me anything about my experience, skills, or projects.',
            }}
          />
        )}

        {/* Mobile: pull-up chat drawer */}
        {isMobile && (
          <PullUpChat
            agentId={agentId}
            title="Resume AI Chat"
            description="Ask me anything about my experience"
          />
        )}
      </div>
    </CopilotKit>
  )
}
