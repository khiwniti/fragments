'use client'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { LoaderIcon } from 'lucide-react'
import type { Message } from '@copilotkit/react-core/v2'
import { ToolRender, extractToolCalls } from './tool-render'

export function MessageList({ messages, isRunning, error, onRetry }: {
  messages: Message[]; isRunning: boolean; error: string | null; onRetry: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }) }, [messages.length, isRunning])
  return (
    <div ref={ref} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" role="log" aria-live="polite" aria-label="Chat messages">
      {messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => {
        const isUser = m.role === 'user'
        const text = typeof m.content === 'string' ? m.content : ''
        const tools = isUser ? [] : extractToolCalls(m)
        return (
          <div key={m.id} className={`flex flex-col gap-2 max-w-[90%] ${isUser ? 'self-end' : 'self-start'}`}>
            {text && (
              <div className={`px-4 py-3 rounded-2xl text-sm ${isUser
                ? 'bg-primary/10 text-foreground border border-primary/20'
                : 'bg-secondary text-secondary-foreground border border-border'}`}>
                {isUser ? <span className="whitespace-pre-wrap break-words">{text}</span>
                  : <div className="prose prose-sm prose-invert max-w-none [&_code]:text-primary"><ReactMarkdown>{text}</ReactMarkdown></div>}
              </div>
            )}
            {tools.map(tc => <ToolRender key={tc.id} toolCall={tc} />)}
          </div>
        )
      })}
      {isRunning && (
        <div className="flex items-center gap-2 self-start text-sm text-muted-foreground" role="status">
          <LoaderIcon className="w-4 h-4 animate-spin motion-reduce:animate-none" /><span>Thinking…</span>
        </div>
      )}
      {error && (
        <div className="self-stretch rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground">
          {error}
          <button onClick={onRetry} className="ml-2 underline decoration-dotted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded">Retry</button>
        </div>
      )}
    </div>
  )
}