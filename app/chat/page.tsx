'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { ChatSettings } from '@/components/chat-settings'
import { Preview } from '@/components/preview'
import { ResumePreview } from '@/components/resume-preview'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema, ResumeContentSchema, ResumePatchSchema, resumePatchSchema } from '@/lib/schema'
import { starterChips } from '@/lib/profile'
import defaultTemplates from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useLocalStorage } from 'usehooks-ts'
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getOrCreateAnonId,
  persistSession,
  restoreActiveSession,
  loadSession,
  saveActiveSessionId,
  startNewSession,
  listSessions,
  deleteSession,
  type SavedSession,
} from '@/lib/storage'
import {
  ResumeSandbox,
  emptySandbox,
  getSandbox,
  saveSandbox,
  clearSandbox,
  applyPatch,
  sandboxToView,
  coercePatch,
} from '@/lib/resume-sandbox'
import type { ResumeSectionType, ResumeItemSchema } from '@/lib/schema'

const isResumeMode = process.env.NEXT_PUBLIC_RESUME_MODE !== 'false'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section'
}

/**
 * Seed a sandbox from a legacy session snapshot (sessions saved before the
 * sandbox feature shipped). The result is also persisted to localStorage so
 * subsequent loads are fast.
 */
function seedSandboxFromSnapshot(conv: SavedSession): ResumeSandbox {
  const sb = emptySandbox(conv.id, conv.resumeContent?.focus || 'Imported resume')
  const sections = conv.resumeContent?.sections ?? []
  sections.forEach((section, i) => {
    if (!section) return
    const id = `${section.type ?? 'section'}-${slugify(section.title ?? section.type ?? 'section')}-${i}`
    sb.sections.push({
      id,
      type: (section.type as ResumeSectionType) || 'highlights',
      title: section.title || '',
      items: ((section.items ?? []) as ResumeItemSchema[]).map((item) => ({
        label: item?.label ?? '',
        value: item?.value,
        detail: item?.detail,
        tags: item?.tags,
        url: item?.url,
      })),
      order: i,
      createdAt: conv.updatedAt,
      updatedAt: conv.updatedAt,
    })
  })
  saveSandbox(sb)
  return sb
}

function restoreSandboxFor(conv: SavedSession): ResumeSandbox {
  const existing = getSandbox(conv.id)
  if (existing) return existing
  if (conv.resumeContent) return seedSandboxFromSnapshot(conv)
  return emptySandbox(conv.id)
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-background flex items-center justify-center"><p className="text-sm text-muted-foreground">Loading...</p></div>}>
      <ChatPageInner />
    </Suspense>
  )
}

function ChatPageInner() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>('languageModel', {
    model: 'claude-sonnet-4-20250514',
  })
  const [useMorphApply, setUseMorphApply] = useLocalStorage<boolean>('useMorphApply', false)
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [resumeSandbox, setResumeSandbox] = useState<ResumeSandbox | null>(null)
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [resumeTab, setResumeTab] = useState<'preview' | 'data'>('preview')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [conversations, setConversations] = useState<SavedSession[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showArtifactPanel, setShowArtifactPanel] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const { session, userTeam } = useAuth(() => {}, () => {})

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== 'ollama'
    }
    return true
  })

  const defaultModel =
    filteredModels.find((model) => model.id === 'claude-sonnet-4-20250514') ||
    filteredModels[0]

  const currentModel =
    filteredModels.find((model) => model.id === languageModel.model) ||
    defaultModel

  const apiKeyConfigurable = currentModel?.providerId === 'openai' || currentModel?.providerId === 'anthropic'
  const baseURLConfigurable = currentModel?.providerId === 'ollama' || currentModel?.providerId === 'openai'

  const handleLanguageModelChange = useCallback(
    (config: Partial<LLMModelConfig>) => {
      setLanguageModel({ ...languageModel, ...config })
    },
    [languageModel, setLanguageModel],
  )

  // ── Restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    getOrCreateAnonId() // ensure anonymous UUID exists
    const saved = restoreActiveSession()
    if (saved) {
      setMessages(saved.messages)
      const sb = restoreSandboxFor(saved)
      setResumeSandbox(sb)
      if (sb.sections.length > 0) setShowArtifactPanel(true)
      setCurrentConversationId(saved.id)
    }
    setConversations(listSessions())
  }, [])

  // ── Read ?prompt= from URL and auto-submit after restore ──────────────
  const searchParams = useSearchParams()
  const promptSubmitted = useRef(false)

  useEffect(() => {
    const prompt = searchParams.get('prompt')
    if (!prompt || promptSubmitted.current) return
    if (messages.length > 0) return // don't override existing session

    promptSubmitted.current = true
    setChatInput(prompt)

    // Auto-submit on next frame so UI can settle
    const raf = requestAnimationFrame(() => {
      if (messages.length > 0) return
      const newMessage: Message = {
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      }
      const updatedMessages = [newMessage]
      setMessages(updatedMessages)
      setIsRateLimited(false)
      setErrorMessage('')

      // Create the conversation synchronously so the sandbox has a stable id.
      let convId = currentConversationId
      if (!convId) {
        const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? crypto.randomUUID()
          : `conv-${Date.now()}`
        convId = fresh
        saveActiveSessionId(fresh)
        setCurrentConversationId(fresh)
        setResumeSandbox((prev) => prev ?? emptySandbox(fresh))
      }

      const payload: Record<string, unknown> = {
        userID: session?.user?.id,
        teamID: userTeam?.id,
        messages: toAISDKMessages(updatedMessages),
        model: currentModel,
        config: languageModel,
      }

      if (!isResumeMode) {
        payload.template = { auto: {} }
      } else {
        const sb = getSandbox(convId) ?? emptySandbox(convId)
        payload.sandbox = sb
      }

      submit(payload)
      setChatInput('')
    })

    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, messages.length])

  // ── Auto-persist sandbox (resume mode) immediately ───────────────────
  // We use a ref for the latest messages so the effect fires only when the
  // sandbox changes, not on every streaming message update.
  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!isResumeMode || !resumeSandbox || messagesRef.current.length === 0) return
    if (!currentConversationId) return
    const view = sandboxToView(resumeSandbox) as DeepPartial<ResumeContentSchema>
    const saved = persistSession(messagesRef.current, view)
    setCurrentConversationId((prev) => prev || saved.id)
    setConversations(listSessions())
  }, [resumeSandbox, isResumeMode, currentConversationId])

  // ── Auto-persist messages (debounced) ────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return
    const timer = setTimeout(() => {
      const view = resumeSandbox ? (sandboxToView(resumeSandbox) as DeepPartial<ResumeContentSchema>) : undefined
      const saved = persistSession(messages, view)
      setCurrentConversationId((prev) => prev || saved.id)
      setConversations(listSessions())
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const apiEndpoint = isResumeMode ? '/api/resume-chat' : '/api/chat'
  const activeSchema = isResumeMode ? resumePatchSchema : fragmentSchema

  const { object, submit, isLoading, stop, error } = useObject({
    api: apiEndpoint,
    schema: activeSchema,
    onError: (error) => {
      console.error('Error submitting request:', error)
      const message = error.message || ''
      if (/429|rate.?limit/i.test(message)) {
        setIsRateLimited(true)
        setErrorMessage('Rate limit reached. Please wait a moment.')
      } else {
        setIsRateLimited(false)
        setErrorMessage(message || 'Something went wrong.')
      }
    },
    onFinish: async ({ object, error }) => {
      if (error) return

      if (isResumeMode && object) {
        const patch = coercePatch(object as DeepPartial<ResumePatchSchema>)
        const convId = currentConversationIdRef.current
        if (!convId) return
        setResumeSandbox((prev) => {
          const base = prev ?? emptySandbox(convId, 'General resume')
          const { sandbox: next } = applyPatch(base, patch, {
            query: patch.intent,
          })
          saveSandbox(next)
          return next
        })
        return
      }

      if (!isResumeMode) {
        setIsPreviewLoading(true)
        try {
          const response = await fetch('/api/sandbox', {
            method: 'POST',
            body: JSON.stringify({
              fragment: object,
              userID: session?.user?.id,
              teamID: userTeam?.id,
              accessToken: session?.access_token,
            }),
          })
          if (!response.ok) {
            throw new Error(`Sandbox returned ${response.status}`)
          }
          const result = await response.json()
          setResult(result)
          setCurrentPreview({
            fragment: object as DeepPartial<FragmentSchema>,
            result,
          })
          setCurrentTab('fragment')
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sandbox failed'
          setErrorMessage(message)
        } finally {
          setIsPreviewLoading(false)
        }
      }
    },
  })

  // Mirror the current conversation id into a ref so the onFinish callback
  // always sees the latest value without re-binding the useObject.
  const currentConversationIdRef = useRef(currentConversationId)
  useEffect(() => {
    currentConversationIdRef.current = currentConversationId
  }, [currentConversationId])

  useEffect(() => {
    if (object) {
      if (isResumeMode) {
        const patchObj = object as DeepPartial<ResumePatchSchema>
        const content: Message['content'] = [
          { type: 'text', text: patchObj.commentary || '' },
        ]
        updateMessagesWithObject(content, object)
      } else {
        setFragment(object as DeepPartial<FragmentSchema>)
        const content: Message['content'] = [
          { type: 'text', text: (object as FragmentSchema).commentary || '' },
          { type: 'code', text: (object as FragmentSchema).code || '' },
        ]
        updateMessagesWithObject(content, object)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object])

  function updateMessagesWithObject(content: Message['content'], obj: any) {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, content, object: obj }]
      }
      return [...prev, { role: 'assistant', content, object: obj }]
    })
  }

  useEffect(() => {
    if (error) stop()
  }, [error, stop])

  const [result, setResult] = useState<ExecutionResult>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) {
      stop()
      return
    }

    setIsRateLimited(false)
    setErrorMessage('')

    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const images = await toMessageImage(files)
    images.forEach((image) => content.push({ type: 'image', image }))

    const newMessage: Message = { role: 'user', content }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)

    // Create the conversation synchronously so the sandbox has a stable id.
    let convId = currentConversationId
    if (!convId) {
      const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `conv-${Date.now()}`
      convId = fresh
      saveActiveSessionId(fresh)
      setCurrentConversationId(fresh)
      setResumeSandbox((prev) => prev ?? emptySandbox(fresh))
    }

    const payload: Record<string, unknown> = {
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      model: currentModel,
      config: languageModel,
    }

    if (!isResumeMode) {
      payload.template = { auto: {} }
    } else {
      const sb = getSandbox(convId) ?? emptySandbox(convId, resumeSandbox?.focus ?? 'General resume')
      payload.sandbox = sb
    }

    submit(payload)
    setChatInput('')
    setFiles([])
    setCurrentTab('code')
  }

  function handleNewConversation() {
    if (currentConversationId) clearSandbox(currentConversationId)
    startNewSession()
    setMessages([])
    setFragment(undefined)
    setResumeSandbox(null)
    setResult(undefined)
    setCurrentTab('code')
    setChatInput('')
    setFiles([])
    setCurrentConversationId(null)
    setShowArtifactPanel(false)
    setErrorMessage('')
    setIsRateLimited(false)
  }

  function handleSelectConversation(conv: SavedSession) {
    const restored = loadSession(conv.id)
    if (restored) {
      saveActiveSessionId(restored.id)
      setCurrentConversationId(restored.id)
      setMessages(restored.messages)
      const sb = restoreSandboxFor(restored)
      setResumeSandbox(sb)
      setFragment(undefined)
      setResult(undefined)
      setShowArtifactPanel(sb.sections.length > 0)
    }
  }

  function handleDeleteConversation(id: string) {
    clearSandbox(id)
    deleteSession(id)
    setConversations(listSessions())
    if (currentConversationId === id) {
      handleNewConversation()
    }
  }

  function handleChipClick(prompt: string) {
    if (isLoading) return
    setIsRateLimited(false)
    setErrorMessage('')
    const newMessage: Message = {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)

    let convId = currentConversationId
    if (!convId) {
      const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `conv-${Date.now()}`
      convId = fresh
      saveActiveSessionId(fresh)
      setCurrentConversationId(fresh)
      setResumeSandbox((prev) => prev ?? emptySandbox(fresh))
    }

    const payload: Record<string, unknown> = {
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      model: currentModel,
      config: languageModel,
    }

    if (!isResumeMode) {
      payload.template = { auto: {} }
    } else {
      const sb = getSandbox(convId) ?? emptySandbox(convId, resumeSandbox?.focus ?? 'General resume')
      payload.sandbox = sb
    }

    submit(payload)
    setChatInput('')
    setFiles([])
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setChatInput(e.target.value)
  }

  function handleFileChange(change: React.SetStateAction<File[]>) {
    setFiles(change)
  }

  function setCurrentPreview(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setFragment(preview.fragment)
    setResult(preview.result)
  }

  const sandboxView = sandboxToView(resumeSandbox)
  const hasResumeArtifact = isResumeMode && resumeSandbox !== null && resumeSandbox.sections.length > 0
  const showRightPanel = isResumeMode ? (showArtifactPanel && hasResumeArtifact) : !!fragment

  return (
    <main className="flex h-screen bg-background">
      {/* Conversation Sidebar */}
      <aside
        className={`border-r border-border bg-card flex-shrink-0 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
        aria-label="Conversation history"
      >
        <div className="w-64 h-full flex flex-col">
          <div className="p-3 border-b border-border">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold">khiw<span className="text-primary">.dev</span></span>
            </Link>
            <Button variant="outline" className="w-full gap-2" size="sm" onClick={handleNewConversation}>
              <Plus className="w-4 h-4" />
              New chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground focus-within:bg-accent focus-within:text-foreground'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectConversation(conv)}
                  aria-current={currentConversationId === conv.id ? 'true' : undefined}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  {conv.resumeContent && (
                    <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                      resume
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConversation(conv.id)}
                  aria-label={`Delete conversation: ${conv.title}`}
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-1 text-muted-foreground hover:text-destructive focus-visible:opacity-100 focus-visible:text-destructive transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="flex flex-col items-center text-center py-8 px-2 gap-3">
                <p className="text-xs text-muted-foreground">No conversations yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleNewConversation}
                >
                  <Plus className="w-4 h-4" />
                  Start a new chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <span className="text-sm font-medium">Chat</span>
            <div className="ml-2 flex items-center gap-2">
              <ChatPicker
                templates={isResumeMode ? ({} as typeof defaultTemplates) : defaultTemplates}
                selectedTemplate="auto"
                onSelectedTemplateChange={() => {}}
                models={filteredModels}
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
              />
              <ChatSettings
                apiKeyConfigurable={apiKeyConfigurable}
                baseURLConfigurable={baseURLConfigurable}
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
                useMorphApply={useMorphApply}
                onUseMorphApplyChange={setUseMorphApply}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/blog">
              <Button variant="ghost" size="sm">Blog</Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`flex flex-col min-w-0 px-4 overflow-hidden ${
              showRightPanel
                ? 'flex-1'
                : 'flex-1 w-full max-w-[800px] mx-auto'
            }`}
          >
            <Chat
              messages={messages}
              isLoading={isLoading}
              setCurrentPreview={setCurrentPreview}
              isResumeMode={isResumeMode}
              starterChips={isResumeMode ? starterChips : undefined}
              onChipClick={handleChipClick}
              resumeView={sandboxView}
              onOpenArtifact={() => setShowArtifactPanel(true)}
            />
            <ChatInput
              retry={() => submit({})}
              isErrored={error !== undefined}
              errorMessage={errorMessage}
              isLoading={isLoading}
              isRateLimited={isRateLimited}
              stop={stop}
              input={chatInput}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isMultiModal={currentModel?.multiModal || false}
              files={files}
              handleFileChange={handleFileChange}
              isResumeMode={isResumeMode}
            >
              {false && (
                <div className="text-xs text-muted-foreground">
                  Model: {currentModel.name}
                </div>
              )}
            </ChatInput>
          </div>

          {showRightPanel && (
            <div className="w-[55%] min-w-[420px] max-w-[680px] border-l border-border bg-card shrink-0">
              {isResumeMode ? (
                <ResumePreview
                  selectedTab={resumeTab}
                  onSelectedTabChange={setResumeTab}
                  isChatLoading={isLoading}
                  view={sandboxView}
                  onClose={() => setShowArtifactPanel(false)}
                />
              ) : (
                <Preview
                  teamID={userTeam?.id}
                  accessToken={session?.access_token}
                  selectedTab={currentTab}
                  onSelectedTabChange={setCurrentTab}
                  isChatLoading={isLoading}
                  isPreviewLoading={isPreviewLoading}
                  fragment={fragment}
                  result={result as ExecutionResult}
                  onClose={() => setFragment(undefined)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
