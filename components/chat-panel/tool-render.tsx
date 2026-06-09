'use client'
import type { Message } from '@copilotkit/react-core/v2'

type ToolCall = { id: string; function: { name: string; arguments: string } }

export function ToolRender({ toolCall }: { toolCall: ToolCall }) {
  let args: Record<string, unknown> = {}
  try { args = JSON.parse(toolCall.function.arguments || '{}') } catch {}
  return (
    <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-mono text-muted-foreground animate-fade-in">
      <span className="text-primary">{toolCall.function.name}</span>
      {Object.keys(args).length > 0 && (
        <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] opacity-80">{JSON.stringify(args, null, 2)}</pre>
      )}
    </div>
  )
}

export function extractToolCalls(m: Message): ToolCall[] {
  return ((m as { toolCalls?: ToolCall[] }).toolCalls ?? [])
}