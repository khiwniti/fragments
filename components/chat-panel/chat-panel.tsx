'use client'

import { Conversation } from './conversation'

/**
 * Desktop right-hand chat column. Mobile is handled separately by PullUpChat
 * (a drag-to-resize drawer that shares the same headless <Conversation/> body).
 * Both surfaces sit inside the same <CopilotKit> provider, so they bind to one
 * shared agent instance.
 */
export function ChatPanel({ agentId = 'resume', initialPrompt }: { agentId?: string; initialPrompt?: string }) {
  return (
    <aside className="hidden md:flex w-[380px] shrink-0 border-l border-border h-dvh sticky top-0">
      <Conversation agentId={agentId} initialPrompt={initialPrompt} />
    </aside>
  )
}
