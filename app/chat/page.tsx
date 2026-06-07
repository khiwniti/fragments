'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { ChatSettings } from '@/components/chat-settings'
import { NavBar } from '@/components/navbar'
import { Preview } from '@/components/preview'
import { AuthDialog } from '@/components/auth-dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema } from '@/lib/schema'
import { starterChips } from '@/lib/profile'
import defaultTemplates from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { useLocalStorage } from 'usehooks-ts'
import { Session } from '@supabase/supabase-js'
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getOrCreateAnonId,
  persistSession,
  loadSession,
  saveActiveSessionId,
  startNewSession,
  listSessions,
  deleteSession,
  type SavedSession,
} from '@/lib/storage'
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-core/v2'
import { ResumeCanvas } from '@/components/resume-canvas'
import '@copilotkit/react-core/v2/styles.css'

const isResumeMode = process.env.NEXT_PUBLIC_RESUME_MODE !== 'false'

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
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [conversations, setConversations] = useState<SavedSession[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showArtifactPanel, setShowArtifactPanel] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<import('@/components/auth').ViewType>('sign_in')
  const { session, userTeam } = useAuth(
    (v) => setAuthDialog(v),
    (v) => setAuthView(v),
  )

  // ── Resume mode: render CopilotKit shared-state UI ───────────────────────
  if (isResumeMode) {
    return (
      <CopilotKit runtimeUrl="/api/copilotkit" agent="resume" showDevConsole={false}>
        <main className="flex flex-col h-screen bg-background">
          <NavBar
            session={session as Session | null}
            showLogin={() => setAuthDialog(true)}
            signOut={() => supabase?.auth.signOut()}
            onSocialClick={(target) => {
              if (target === 'github') window.open('https://github.com/getintheq', '_blank')
              else if (target === 'x') window.open('https://x.com/ikkyuu01', '_blank')
            }}
            onClear={() => {}}
            canClear={false}
            onUndo={() => {}}
            canUndo={false}
            onPrint={() => window.print()}
          />
          <div className="flex-1 overflow-auto py-8 print:overflow-visible print:py-0">
            <ResumeCanvas />
          </div>
          <CopilotSidebar
            agentId="resume"
            defaultOpen
            labels={{ modalHeaderTitle: 'Resume Assistant' }}
          />
        </main>
        {supabase && (
          <AuthDialog
            open={isAuthDialogOpen}
            setOpen={setAuthDialog}
            supabase={supabase}
            view={authView}
          />
        )}
      </CopilotKit>
    )
  }

  // ── Non-resume chat mode (unchanged from prior implementation) ─────────────

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

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    getOrCreateAnonId() // ensure anonymous UUID exists
    const saved = restoreActiveSession()
    if (saved) {
      setMessages(saved.messages)
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

      let convId = currentConversationId
      if (!convId) {
        const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? crypto.randomUUID()
          : `conv-${Date.now()}`
        convId = fresh
        saveActiveSessionId(fresh)
        setCurrentConversationId(fresh)
      }

      const payload: Record<string, unknown> = {
        userID: session?.user?.id,
        teamID: userTeam?.id,
        messages: toAISDKMessages(updatedMessages),
        model: currentModel,
        config: languageModel,
        template: { auto: {} },
      }

      submit(payload)
      setChatInput('')
    })

    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, messages.length])

  // ── Auto-persist messages (debounced) ────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return
    const timer = setTimeout(() => {
      const saved = persistSession(messages)
      setCurrentConversationId((prev) => prev || saved.id)
      setConversations(listSessions())
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  async function submit(payload: Record<string, unknown>) {
    setIsRateLimited(false)
    setErrorMessage('')
    setIsPreviewLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userID: session?.user?.id,
          teamID: userTeam?.id,
          accessToken: session?.access_token,
        }),
      })
      if (!response.ok) {
        const err = await response.text()
        if (/429|rate.?limit/i.test(err)) {
          setIsRateLimited(true)
          setErrorMessage('Rate limit reached. Please wait a moment.')
        } else {
          setErrorMessage(err || 'Something went wrong.')
        }
        return
      }
      const result = await response.json()
      const msg: Message = {
        role: 'assistant',
        content: [
          { type: 'text', text: result.commentary || '' },
          { type: 'code', text: result.code || '' },
        ],
        object: result as DeepPartial<FragmentSchema>,
      }
      setMessages((prev) => [...prev, msg])
      setFragment(result as DeepPartial<FragmentSchema>)
      setResult(result as ExecutionResult)
      setCurrentTab('fragment')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setErrorMessage(message)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const newMessage: Message = { role: 'user', content }
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
    }

    const payload: Record<string, unknown> = {
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      model: currentModel,
      config: languageModel,
      template: { auto: {} },
    }

    submit(payload)
    setChatInput('')
    setFiles([])
    setCurrentTab('code')
  }

  function handleNewConversation() {
    startNewSession()
    setMessages([])
    setFragment(undefined)
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
      setFragment(undefined)
      setResult(undefined)
    }
  }

  function handleDeleteConversation(id: string) {
    deleteSession(id)
    setConversations(listSessions())
    if (currentConversationId === id) {
      handleNewConversation()
    }
  }

  function handleClearChat() {
    if (messages.length === 0) return
    const confirmed = window.confirm(
      'Clear the current conversation? This will discard the message thread.',
    )
    if (!confirmed) return
    handleNewConversation()
  }

  function signOut() {
    supabase?.auth.signOut()
  }

  function handleSocialClick(target: 'github' | 'x') {
    if (target === 'github') {
      window.open('https://github.com/getintheq', '_blank')
    } else if (target === 'x') {
      window.open('https://x.com/ikkyuu01', '_blank')
    }
  }

  function handleChipClick(prompt: string) {
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
    }

    const payload: Record<string, unknown> = {
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      model: currentModel,
      config: languageModel,
      template: { auto: {} },
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

  const [result, setResult] = useState<ExecutionResult>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  async function stop() {
    // No-op for chat mode (streaming is not used in this path)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <NavBar
        session={session as Session | null}
        showLogin={() => setAuthDialog(true)}
        signOut={signOut}
        onSocialClick={handleSocialClick}
        onClear={handleClearChat}
        canClear={messages.length > 0}
        onUndo={() => {}}
        canUndo={false}
      />
      <main className="flex flex-1 min-h-0">
        {/* Conversation Sidebar */}
        <aside
          className={`border-r border-border bg-card flex-shrink-0 transition-all duration-300 overflow-hidden ${
            sidebarOpen ? 'w-64' : 'w-0'
          }`}
          aria-label="Conversation history"
        >
          <div className="w-64 h-full flex flex-col">
            <div className="p-3 border-b border-border">
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
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConversation(conv.id)}
                  aria-label={`Delete conversation: ${conv.title}`}
                  className="opacity-40 hover:opacity-100 focus-visible:opacity-100 p-1 text-muted-foreground hover:text-destructive focus-visible:text-destructive transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
        {/* Sub-bar: chat-specific controls only (sidebar toggle + model picker + settings). */}
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
                templates={defaultTemplates}
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
        </div>

        {/* Chat area */}
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`flex flex-col min-w-0 px-4 overflow-hidden ${
              showArtifactPanel || fragment
                ? 'flex-1'
                : 'flex-1 w-full max-w-[800px] mx-auto'
            }`}
          >
            <Chat
              messages={messages}
              isLoading={loading}
              setCurrentPreview={setCurrentPreview}
            />
            <ChatInput
              retry={() => submit({})}
              isErrored={!!error}
              errorMessage={error || errorMessage}
              isLoading={loading}
              isRateLimited={isRateLimited}
              stop={stop}
              input={chatInput}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isMultiModal={currentModel?.multiModal || false}
              files={files}
              handleFileChange={handleFileChange}
              isResumeMode={false}
            >
              {false && (
                <div className="text-xs text-muted-foreground">
                  Model: {currentModel.name}
                </div>
              )}
            </ChatInput>
          </div>

          {(showArtifactPanel || fragment) && (
            <div className="w-[55%] min-w-[420px] max-w-[680px] border-l border-border bg-card shrink-0">
              <Preview
                teamID={userTeam?.id}
                accessToken={session?.access_token}
                selectedTab={currentTab}
                onSelectedTabChange={setCurrentTab}
                isChatLoading={loading}
                isPreviewLoading={isPreviewLoading}
                fragment={fragment}
                result={result as ExecutionResult}
                onClose={() => setFragment(undefined)}
              />
            </div>
          )}
        </div>
      </div>
    </main>
    {supabase && (
      <AuthDialog
        open={isAuthDialogOpen}
        setOpen={setAuthDialog}
        supabase={supabase}
        view={authView}
      />
    )}
    </div>
  )
}

// Alias for backward compat with restoreActiveSession import above
function restoreActiveSession(): SavedSession | null {
  return null
}