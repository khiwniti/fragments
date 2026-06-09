'use client'

import { CopilotKit } from '@copilotkit/react-core/v2'
import { ResumeCanvas } from '@/components/resume-canvas'
import { ChatPanel } from '@/components/chat-panel/chat-panel'

export default function ChatPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="resume">
      <div className="flex min-h-dvh w-full bg-background">
        <div className="flex-1 overflow-y-auto print:p-0">
          <div className="mx-auto max-w-[210mm] pt-4 pb-8">
            <ResumeCanvas />
          </div>
        </div>
        <ChatPanel />
      </div>
    </CopilotKit>
  )
}