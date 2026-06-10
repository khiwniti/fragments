'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { starterChips } from '@/lib/profile'
import { Sparkles, MessageSquare, ArrowUp } from 'lucide-react'

export function HeroChat() {
  const router = useRouter()
  const [input, setInput] = useState('')

  function navigateToChat(prompt: string) {
    if (!prompt.trim()) return
    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    navigateToChat(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      navigateToChat(input)
    }
  }

  return (
    <div className="min-h-screen bg-background max-w-[720px] mx-auto w-full relative px-4 md:px-6 flex flex-col items-center justify-center py-20">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.04] text-primary"
          style={{ background: 'radial-gradient(ellipse at center, currentColor 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
        {/* Header */}
        <div className="text-center space-y-4 mb-10">
          <div className="flex items-center justify-center gap-2 text-primary/70">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resume AI Chat</span>
          </div>
          <h1 className="font-bold leading-[1.1] tracking-tight" style={{ fontSize: 'clamp(26px,4.5vw,44px)' }}>
            Ask me anything
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Hi, I&apos;m Ikkyu — a Forward-Deployed Full Stack Developer.
            Ask about my experience, projects, or skills.
          </p>
        </div>

        {/* Starter chips — navigate to /chat with prompt */}
        <div className="flex flex-wrap justify-center gap-2.5 max-w-[520px] mb-8">
          {starterChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => navigateToChat(chip.prompt)}
              className="px-4 py-2 rounded-full text-xs font-medium border border-border/60 bg-accent/30 text-accent-foreground hover:bg-accent hover:border-primary/40 hover:text-foreground transition-all duration-200 active:scale-[0.97]"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input bar — type and submit navigates to /chat */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="shadow-sm rounded-2xl bg-background border border-border/60 focus-within:border-primary/40 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about experience, skills, or projects..."
              rows={1}
              className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none text-sm py-2.5 max-h-32 scrollbar-thin"
            />
            <div className="flex items-center px-3 pb-3 pt-1 gap-2">
              <div className="flex-1" />
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex items-center justify-center rounded-xl h-9 w-9 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        <p className="text-[10px] text-muted-foreground/40 text-center mt-3 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          No account required &middot; Sessions save automatically &middot; Full chat history
        </p>
      </div>
    </div>
  )
}
