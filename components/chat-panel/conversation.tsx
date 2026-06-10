'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAgent, useCopilotKit } from '@copilotkit/react-core/v2'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { Suggestions } from './suggestions'

/**
 * Headless chat body shared by the desktop column (ChatPanel) and the mobile
 * drawer (PullUpChat). Both render inside the same <CopilotKit> provider, so
 * `useAgent({ agentId })` returns the SAME agent instance on each surface —
 * messages and run-state stay in sync without any prop drilling.
 *
 * Built entirely on the key-free v2 primitive (`useAgent` + `copilotkit.runAgent`),
 * the same path CopilotKit's own React-Native CopilotChat uses internally — not
 * the premium `useCopilotChatHeadless_c`, which no-ops without a Cloud key.
 */
/**
 * Module-level guard: Conversation mounts on BOTH the desktop column and the
 * mobile drawer at once (they share one agent). Without this, a `?prompt=`
 * deep-link from the landing page would auto-send twice. The first instance to
 * mount consumes the prompt; the other sees the flag set and skips.
 */
let consumedPrompt: string | null = null
let consumedDefaultPrompt = false

export function Conversation({ agentId = 'resume', initialPrompt }: { agentId?: string; initialPrompt?: string }) {
  const { agent } = useAgent({ agentId })
  const { copilotkit } = useCopilotKit()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const autoSent = useRef(false)
  const defaultSent = useRef(false)
  const isRunning = agent.isRunning
  const messages = agent.messages ?? []

  const send = useCallback(
    async (text: string) => {
      if (!text || isRunning) return
      setError(null)
      agent.addMessage({ id: crypto.randomUUID(), role: 'user', content: text })
      try {
        await copilotkit.runAgent({ agent })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    },
    [agent, copilotkit, isRunning],
  )

  const retry = useCallback(() => {
    setError(null)
    copilotkit
      .runAgent({ agent })
      .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
  }, [agent, copilotkit])

  // Auto-send a `?prompt=` deep-link from the landing page, exactly once.
  // `autoSent` guards this instance; `consumedPrompt` guards across the two
  // instances (desktop column + mobile drawer) that share one agent.
  useEffect(() => {
    if (autoSent.current) return
    const prompt = searchParams.get('prompt')?.trim()
    if (!prompt || prompt === consumedPrompt) return
    if (messages.length > 0 || isRunning) return
    autoSent.current = true
    consumedPrompt = prompt
    send(prompt)
  }, [searchParams, send, messages.length, isRunning])

  // Auto-send the initial prompt on mount when no messages exist.
  // This makes the resume page auto-start the chat without requiring
  // a URL param or user action. The module-level guard prevents double-fire
  // across the desktop + mobile surfaces.
  useEffect(() => {
    if (defaultSent.current) return
    if (!initialPrompt || consumedDefaultPrompt) return
    if (messages.length > 0 || isRunning) return
    // Also skip if a ?prompt= was already consumed
    if (consumedPrompt !== null) return
    defaultSent.current = true
    consumedDefaultPrompt = true
    send(initialPrompt)
  }, [initialPrompt, send, messages.length, isRunning])

  return (
    <div className="flex h-full w-full flex-col bg-card">
      <MessageList messages={messages} isRunning={isRunning} error={error} onRetry={retry} />
      <Suggestions visible={messages.length === 0} onPick={send} />
      <ChatInput onSend={send} disabled={isRunning} />
    </div>
  )
}
