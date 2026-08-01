'use client'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles } from 'lucide-react'
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
                  : <div className="prose prose-sm max-w-none text-foreground [&_code]:text-primary [&_*]:text-inherit"><ReactMarkdown>{text}</ReactMarkdown></div>}
              </div>
            )}
            {tools.map(tc => <ToolRender key={tc.id} toolCall={tc} />)}
          </div>
        )
      })}
      {isRunning && (
        <div className="self-start w-full max-w-[90%] space-y-3 animate-fade-in motion-reduce:animate-none" role="status">
          {/* Animated status bar */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary/70" />
              <span className="font-medium">AI is analyzing your resume</span>
              <span className="inline-flex gap-0.5" aria-hidden="true">
                <span className="animate-bounce motion-reduce:animate-none" style={{ animationDelay: '0ms', animationDuration: '1.2s' }}>.</span>
                <span className="animate-bounce motion-reduce:animate-none" style={{ animationDelay: '200ms', animationDuration: '1.2s' }}>.</span>
                <span className="animate-bounce motion-reduce:animate-none" style={{ animationDelay: '400ms', animationDuration: '1.2s' }}>.</span>
              </span>
            </span>
          </div>
          {/* Skeleton placeholder for the incoming response */}
          <div className="space-y-2 px-4 py-3 rounded-2xl bg-secondary/50 border border-border/50">
            <div className="h-3 w-full rounded-full bg-muted-foreground/10 animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-4/5 rounded-full bg-muted-foreground/10 animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-3/5 rounded-full bg-muted-foreground/10 animate-pulse motion-reduce:animate-none" />
          </div>
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