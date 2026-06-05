'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { resumeContentSchema, type ResumeContentSchema } from '@/lib/schema'
import { Message, toAISDKMessages } from '@/lib/messages'
import { starterChips } from '@/lib/profile'
import { ResumeArtifactPanel } from '@/components/landing/resume-artifact-panel'
import { ArrowUp, LoaderIcon, Square, Sparkles, FileText, PanelRight, ArrowRight, MessageSquare } from 'lucide-react'
import {
  getOrCreateAnonId,
  persistSession,
} from '@/lib/storage'

export function HeroChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [resumeContent, setResumeContent] = useState<ResumeContentSchema | undefined>(undefined)
  const [showArtifactPanel, setShowArtifactPanel] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/resume-chat',
    schema: resumeContentSchema,
    onError: (err) => {
      console.error('Hero chat error:', err)
    },
  })

  // Ensure anonymous identity on mount
  useEffect(() => {
    getOrCreateAnonId()
  }, [])

  // When response arrives: update state and persist so /chat can restore
  useEffect(() => {
    if (object) {
      const resumeObj = object as ResumeContentSchema
      setResumeContent(resumeObj)
      setHasResponded(true)
      if (!showArtifactPanel) setShowArtifactPanel(true)
      const content: Message['content'] = [
        { type: 'text', text: resumeObj.commentary || '' },
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

  // Persist session when messages or resume change
  useEffect(() => {
    if (messages.length === 0) return
    const timer = setTimeout(() => {
      persistSession(messages, resumeContent)
    }, 1000)
    return () => clearTimeout(timer)
  }, [messages, resumeContent])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const sendMessages = useCallback(
    (updatedMessages: Message[]) => {
      const aiMessages = toAISDKMessages(updatedMessages)
      submit({ messages: aiMessages })
    },
    [submit],
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const newMessage: Message = {
      role: 'user',
      content: [{ type: 'text', text: input }],
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    if (!isSessionActive) setIsSessionActive(true)
    sendMessages(updatedMessages)
    setInput('')
  }

  function handleChipClick(prompt: string) {
    if (isLoading) return
    const newMessage: Message = {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    if (!isSessionActive) setIsSessionActive(true)
    sendMessages(updatedMessages)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      const form = (e.target as HTMLTextAreaElement).closest('form')
      if (form) form.requestSubmit()
    }
  }

  const showChips = messages.length === 0 && !isLoading
  const panelOpen = showArtifactPanel && resumeContent?.sections && resumeContent.sections.length > 0

  return (
    <div className={`${panelOpen ? 'grid md:grid-cols-2' : ''} min-h-screen bg-background`}>
      {/* Left column: Chat */}
      <div className={`flex flex-col ${panelOpen ? 'h-screen overflow-hidden max-w-full border-r border-border/20' : 'min-h-screen max-w-[720px] mx-auto w-full relative'}`}>
      {/* Subtle gradient background - only when full width */}
      {!panelOpen && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.015] dark:opacity-[0.03]"
            style={{ background: 'radial-gradient(ellipse at center, currentColor 0%, transparent 70%)' }}
          />
        </div>
      )}

      {/* Chat container */}
      <div className="flex-1 flex flex-col w-full px-4 md:px-6 relative z-10">
        {/* Header area */}
        <div className="pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary/70" />
            <span className="text-xs font-medium text-muted-foreground">
              {isSessionActive ? 'Resume Chat' : 'Ask me anything'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSessionActive && messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([])
                  setIsSessionActive(false)
                  setResumeContent(undefined)
                  setShowArtifactPanel(false)
                  setHasResponded(false)
                }}
                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50"
              >
                New chat
              </button>
            )}
          </div>
        </div>

        {/* Chat messages area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin"
        >
          {showChips ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[55vh] px-4 animate-in fade-in duration-500">
              <div className="text-center space-y-4 mb-10 max-w-lg">
                <h1 className="font-bold leading-[1.1] tracking-tight" style={{ fontSize: 'clamp(26px,4.5vw,44px)' }}>
                  Ask me anything
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hi, I&apos;m Ikkyu — an AI-Augmented Full-Stack Developer.
                  Ask about my experience, projects, or skills below.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5 max-w-[520px]">
                {starterChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chip.prompt)}
                    className="group relative px-4 py-2 rounded-full text-xs font-medium border border-border/60 bg-accent/30 text-accent-foreground hover:bg-accent hover:border-primary/40 hover:text-foreground transition-all duration-200 active:scale-[0.97]"
                  >
                    <span className="relative z-10">{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-6 pb-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-gradient-to-b from-black/5 to-black/10 dark:from-white/8 dark:to-white/3 border border-border/60 shadow-sm'
                        : 'bg-accent/40 dark:bg-white/[0.03] border border-border/40'
                    }`}
                  >
                    {message.content.map((content, id) => {
                      if (content.type === 'text') {
                        return (
                          <p key={id} className="whitespace-pre-wrap">
                            {content.text}
                          </p>
                        )
                      }
                      return null
                    })}

                    {/* Clickable artifact card */}
                    {message.role === 'assistant' && resumeContent?.sections && resumeContent.sections.length > 0 && index === messages.length - 1 && (
                      <button
                        onClick={() => setShowArtifactPanel(true)}
                        className="mt-3 w-full md:w-max flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-left hover:bg-accent/30 hover:border-primary/30 transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <FileText className="w-4 h-4 text-primary/70" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground">
                            {resumeContent.focus || 'Resume View'}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {resumeContent.sections.length} sections
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                          <PanelRight className="w-3 h-3" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Continue in full chat button */}
              {hasResponded && !isLoading && (
                <div className="flex justify-center animate-in fade-in duration-300">
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 hover:border-primary/30 transition-all duration-200 group"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Continue in full chat
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-accent/40 dark:bg-white/[0.03] border border-border/40 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <LoaderIcon className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground/70">Generating response...</span>
                    </div>
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

        {/* Input area */}
        <div className="pb-4 md:pb-6 mt-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="shadow-sm rounded-2xl bg-background border border-border/60 focus-within:border-primary/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about experience, skills, or projects..."
                rows={1}
                className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none text-sm py-2.5 max-h-32 scrollbar-thin"
                disabled={isLoading}
              />
              <div className="flex items-center px-3 pb-3 pt-1 gap-2">
                <div className="flex-1" />
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex items-center justify-center rounded-xl h-9 w-9 bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="inline-flex items-center justify-center rounded-xl h-9 w-9 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
            No account required &middot; Sessions save automatically
          </p>
        </div>
      </div>
      </div>

      {/* Right column: Desktop artifact panel */}
      {panelOpen && (
        <div className="hidden md:flex h-screen overflow-hidden">
          <ResumeArtifactPanel
            content={resumeContent!}
            onClose={() => setShowArtifactPanel(false)}
          />
        </div>
      )}

      {/* Mobile overlay for artifact panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background animate-fade-in">
          <ResumeArtifactPanel
            content={resumeContent!}
            onClose={() => setShowArtifactPanel(false)}
          />
        </div>
      )}
    </div>
  )
}
