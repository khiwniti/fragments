'use client'

import { Suspense, useState } from 'react'
import { CopilotKit } from '@copilotkit/react-core/v2'
import { ResumeCanvas } from '@/components/resume-canvas'
import { ResumeForm } from '@/components/resume-form'
import { PullUpChat } from '@/components/pull-up-chat'
import { ChatPanel } from '@/components/chat-panel/chat-panel'

const AUTO_START_PROMPT = 'Give me a professional summary of my resume, highlighting my key strengths, experience, and projects.'

export default function ChatPage() {
  const [view, setView] = useState<'resume' | 'edit'>('resume')
  const agentId = 'resume'

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={agentId}>
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

        {/* Chat surfaces wrapped in Suspense for useSearchParams */}
        <Suspense fallback={null}>
          {/* Desktop: headless chat column */}
          <ChatPanel agentId={agentId} initialPrompt={AUTO_START_PROMPT} />

          {/* Mobile: headless pull-up drawer */}
          <PullUpChat
            agentId={agentId}
            title="Resume AI Chat"
            description="Ask me anything about my experience"
            initialPrompt={AUTO_START_PROMPT}
          />
        </Suspense>
      </div>
    </CopilotKit>
  )
}
