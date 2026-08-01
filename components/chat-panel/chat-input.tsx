'use client'
import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ChatInput({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('')
  function submit() {
    const t = value.trim()
    if (!t || disabled) return
    onSend(t); setValue('')
  }
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
        <textarea
          rows={1} value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          placeholder="Ask about this resume…" aria-label="Chat message"
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-32"
        />
        <button onClick={submit} disabled={disabled || !value.trim()} aria-label="Send message"
          className="rounded-lg bg-primary text-primary-foreground p-1.5 disabled:opacity-30 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}