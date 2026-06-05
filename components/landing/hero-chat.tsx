'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { resumeContentSchema, type ResumeContentSchema } from '@/lib/schema'
import { Message, toAISDKMessages } from '@/lib/messages'
import { starterChips } from '@/lib/profile'
import { ArrowUp, LoaderIcon, Square } from 'lucide-react'

export function HeroChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/resume-chat',
    schema: resumeContentSchema,
    onError: (err) => {
      console.error('Hero chat error:', err)
    },
  })

  useEffect(() => {
    if (object) {
      const content: Message['content'] = [
        { type: 'text', text: (object as ResumeContentSchema).commentary || '' },
      ]
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content, object }]
        }
        return [...prev, { role: 'assistant', content, object }]
      })
    }
  }, [object])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const sendMessages = useCallback((updatedMessages: Message[]) => {
    const aiMessages = toAISDKMessages(updatedMessages)
    submit({
      messages: aiMessages,
      model: { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
    })
  }, [submit])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const newMessage: Message = {
      role: 'user',
      content: [{ type: 'text', text: input }],
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    sendMessages(updatedMessages)
    setInput('')
  }

  function handleChipClick(prompt: string) {
    const newMessage: Message = {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    sendMessages(updatedMessages)
  }

  const showChips = messages.length === 0 && !isLoading

  return (
    <section className="relative min-h-screen flex flex-col px-4 md:px-6">
      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'rgba(52,211,153,0.02)', filter: 'blur(120px)' }}
      />

      <div className="flex-1 flex flex-col max-w-[700px] mx-auto w-full pt-20 pb-4">
        {/* Chat Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin"
        >
          {showChips && (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="text-center space-y-3 mb-8">
                <h1 className="font-bold leading-[1.1]" style={{ fontSize: 'clamp(28px,5vw,48px)' }}>
                  Ask me anything
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Hi, I&apos;m Ikkyu — an AI-Augmented Full-Stack Developer.
                  Ask about my experience, projects, or skills.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-[500px]">
                {starterChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chip.prompt)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-accent/50 text-accent-foreground hover:bg-accent hover:border-primary/30 hover:text-foreground transition-all duration-200"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="pt-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-gradient-to-b from-black/5 to-black/10 dark:from-white/10 dark:to-white/5 border border-border'
                        : 'bg-accent dark:bg-white/5 border border-border'
                    }`}
                  >
                    {message.content.map((content, id) => {
                      if (content.type === 'text') {
                        return <p key={id}>{content.text}</p>
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-accent dark:bg-white/5 border border-border rounded-2xl px-4 py-3">
                    <LoaderIcon className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto w-full max-w-[600px] mb-2 px-4 py-2 rounded-xl bg-red-400/10 text-red-400 text-xs text-center">
            Something went wrong. Please try again.
          </div>
        )}

        {/* Input */}
        <div className="mx-auto w-full max-w-[600px] mt-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 bg-background border border-border rounded-2xl px-4 py-2 shadow-md focus-within:border-primary/50 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about experience, skills, or projects..."
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none text-sm py-1.5 max-h-32 scrollbar-thin"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
                  }
                }}
                disabled={isLoading}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="shrink-0 w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="shrink-0 w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
              Ask about Khiw (Ikkyu) Nitithadachot — AI-Augmented Full-Stack Developer
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
