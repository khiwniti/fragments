'use client'
import { useCallback, useState } from 'react'
import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { Suggestions } from './suggestions'
import { MessageSquare, X } from 'lucide-react'

export function ChatPanel() {
  const { agent } = useAgent({ agentId: 'resume' })
  const { copilotkit } = useCopilotKit()
  const [error, setError] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isRunning = agent.isRunning

  const send = useCallback(async (text: string) => {
    if (!text || isRunning) return
    setError(null)
    agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: text })
    try { await copilotkit.runAgent({ agent }) }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong') }
  }, [agent, copilotkit, isRunning])

  const retry = useCallback(() => {
    setError(null)
    copilotkit.runAgent({ agent }).catch(e =>
      setError(e instanceof Error ? e.message : 'Something went wrong'))
  }, [agent, copilotkit])

  const panel = (
    <div className="flex h-full w-full flex-col bg-card">
      <MessageList messages={agent.messages ?? []} isRunning={isRunning} error={error} onRetry={retry} />
      <Suggestions visible={(agent.messages ?? []).length === 0} onPick={send} />
      <ChatInput onSend={send} disabled={isRunning} />
    </div>
  )

  return (
    <>
      {/* Desktop: fixed right column */}
      <aside className="hidden md:flex w-[380px] shrink-0 border-l border-border h-dvh sticky top-0">{panel}</aside>
      {/* Mobile: slide-over */}
      <button onClick={() => setMobileOpen(true)} aria-label="Open chat"
        className="md:hidden fixed bottom-4 right-4 z-40 rounded-full bg-primary text-primary-foreground p-3 shadow-lg focus-visible:ring-2 focus-visible:ring-ring">
        <MessageSquare className="w-5 h-5" />
      </button>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-background/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="w-[88%] max-w-[380px] border-l border-border relative">
            <button onClick={() => setMobileOpen(false)} aria-label="Close chat"
              className="absolute top-3 right-3 z-10 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              <X className="w-4 h-4" />
            </button>
            {panel}
          </div>
        </div>
      )}
    </>
  )
}