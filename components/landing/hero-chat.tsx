'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { resumeContentSchema, type ResumeContentSchema } from '@/lib/schema'
import { Message, toAISDKMessages } from '@/lib/messages'
import { starterChips } from '@/lib/profile'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import modelsData from '@/lib/models.json'
import { ArrowUp, LoaderIcon, Square, Sparkles } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MODELS: LLMModel[] = modelsData.models as LLMModel[]

const DEFAULT_MODEL: LLMModel = {
  id: 'nvidia/llama-3.1-nemotron-70b-instruct',
  name: 'Llama 3.1 Nemotron 70B',
  provider: 'NVIDIA',
  providerId: 'nvidia',
}

export function HeroChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<LLMModel>(DEFAULT_MODEL)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  const sendMessages = useCallback(
    (updatedMessages: Message[]) => {
      const aiMessages = toAISDKMessages(updatedMessages)
      submit({
        messages: aiMessages,
        model: selectedModel,
      })
    },
    [submit, selectedModel],
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

  function handleModelChange(value: string) {
    const model = MODELS.find((m) => m.id === value)
    if (model) setSelectedModel(model)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      const form = (e.target as HTMLTextAreaElement).closest('form')
      if (form) form.requestSubmit()
    }
  }

  const showChips = messages.length === 0 && !isLoading

  // Group models by provider for the select
  const groupedModels = MODELS.reduce(
    (acc, model) => {
      const provider = model.provider
      if (!acc[provider]) acc[provider] = []
      acc[provider].push(model)
      return acc
    },
    {} as Record<string, LLMModel[]>,
  )

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.015] dark:opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse at center, currentColor 0%, transparent 70%)' }}
        />
      </div>

      {/* Chat container - flex column so input stays at bottom */}
      <div className="flex-1 flex flex-col max-w-[720px] mx-auto w-full px-4 md:px-6 relative z-10">
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
          className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin"
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
                  </div>
                </div>
              ))}

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

        {/* Input area - Fragments-style polished bar */}
        <div className="pb-4 md:pb-6 mt-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="shadow-md rounded-2xl bg-background border border-border/60 focus-within:border-primary/40 transition-colors">
              {/* Model selector row (Fragments-style inline) */}
              <div className="flex items-center px-3 pt-2.5 pb-1 gap-2">
                <Select
                  value={selectedModel.id}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger className="whitespace-nowrap border-none shadow-none focus:ring-0 px-0 py-0 h-6 text-xs text-muted-foreground hover:text-foreground transition-colors gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top" className="max-h-[300px]">
                    {Object.entries(groupedModels).map(([provider, models]) => (
                      <SelectGroup key={provider}>
                        <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                          {provider}
                        </SelectLabel>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id} className="text-xs">
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about experience, skills, or projects..."
                rows={1}
                className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none text-sm py-2 max-h-32 scrollbar-thin"
                disabled={isLoading}
              />

              {/* Bottom row: actions */}
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
            Ask about Khiw (Ikkyu) Nitithadachot &middot; AI-Augmented Full-Stack Developer
          </p>
        </div>
      </div>
    </section>
  )
}
