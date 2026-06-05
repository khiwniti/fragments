'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { Preview } from '@/components/preview'
import { ResumeArtifact } from '@/components/resume-artifact'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema, ResumeContentSchema, resumeContentSchema } from '@/lib/schema'
import { starterChips } from '@/lib/profile'
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
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [resumeContent, setResumeContent] = useState<ResumeContentSchema>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [conversations, setConversations] = useState<SavedSession[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showArtifactPanel, setShowArtifactPanel] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
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

  // ── Restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    getOrCreateAnonId() // ensure anonymous UUID exists
    const saved = restoreActiveSession()
    if (saved) {
      setMessages(saved.messages)
      if (saved.resumeContent) {
        setResumeContent(saved.resumeContent)
        setShowArtifactPanel(true)
      }
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

    // Auto-submit after a brief delay to let the UI settle
    const timer = setTimeout(() => {
      const newMessage: Message = {
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      }
      const updatedMessages = [newMessage]
      setMessages(updatedMessages)

      const payload: Record<string, unknown> = {
        userID: session?.user?.id,
        teamID: userTeam?.id,
        messages: toAISDKMessages(updatedMessages),
        model: currentModel,
        config: languageModel,
      }

      if (!isResumeMode) {
        payload.template = { auto: {} }
      }

      submit(payload)
      setChatInput('')
    }, 100)

    return () => clearTimeout(timer)
  }, [searchParams, messages.length])

  // ── Auto-persist session when messages change ─────────────────────────
  useEffect(() => {
    if (messages.length === 0) return
    const timer = setTimeout(() => {
      const saved = persistSession(messages, resumeContent)
      setCurrentConversationId((prev) => prev || saved.id)
      setConversations(listSessions())
    }, 2000)
    return () => clearTimeout(timer)
  }, [messages, resumeContent])

  const apiEndpoint = isResumeMode ? '/api/resume-chat' : '/api/chat'
  const activeSchema = isResumeMode ? resumeContentSchema : fragmentSchema

  const { object, submit, isLoading, stop, error } = useObject({
    api: apiEndpoint,
    schema: activeSchema,
    onError: (error) => {
      console.error('Error submitting request:', error)
      setErrorMessage(error.message)
    },
    onFinish: async ({ object, error }) => {
      if (!error && !isResumeMode) {
        setIsPreviewLoading(true)
        const response = await fetch('/api/sandbox', {
          method: 'POST',
          body: JSON.stringify({
            fragment: object,
            userID: session?.user?.id,
            teamID: userTeam?.id,
            accessToken: session?.access_token,
          }),
        })
        const result = await response.json()
        setResult(result)
        setCurrentPreview({
          fragment: object as DeepPartial<FragmentSchema>,
          result,
        })
        setCurrentTab('fragment')
        setIsPreviewLoading(false)
      }
    },
  })

  useEffect(() => {
    if (object) {
      if (isResumeMode) {
        const resumeObj = object as ResumeContentSchema
        setResumeContent(resumeObj)
        if (!showArtifactPanel && resumeObj.sections?.length > 0) {
          setShowArtifactPanel(true)
        }
        const content: Message['content'] = [
          { type: 'text', text: resumeObj.commentary || '' },
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
  }, [error])

  const [result, setResult] = useState<ExecutionResult>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) {
      stop()
      return
    }

    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const images = await toMessageImage(files)
    images.forEach((image) => content.push({ type: 'image', image }))

    const newMessage: Message = { role: 'user', content }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)

    const payload: Record<string, unknown> = {
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      model: currentModel,
      config: languageModel,
    }

    if (!isResumeMode) {
      payload.template = { auto: {} }
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
    setResumeContent(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setChatInput('')
    setFiles([])
    setCurrentConversationId(null)
    setShowArtifactPanel(false)
  }

  function handleSelectConversation(conv: SavedSession) {
    const restored = loadSession(conv.id)
    if (restored) {
      saveActiveSessionId(restored.id)
      setCurrentConversationId(restored.id)
      setMessages(restored.messages)
      setResumeContent(restored.resumeContent)
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

  function handleChipClick(prompt: string) {
    if (isLoading) return
    const newMessage: Message = {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)

    const payload: Record<string, unknown> = {
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      model: currentModel,
      config: languageModel,
    }

    if (!isResumeMode) {
      payload.template = { auto: {} }
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

  const showRightPanel = isResumeMode ? (showArtifactPanel && resumeContent?.sections && resumeContent.sections.length > 0) : !!fragment

  return (
    <main className="flex h-screen bg-background">
      {/* Conversation Sidebar */}
      <aside
        className={`border-r border-border bg-card flex-shrink-0 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
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
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleSelectConversation(conv)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{conv.title}</span>
                {conv.resumeContent && (
                  <span className="text-[9px] text-muted-foreground/40 font-mono">resume</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteConversation(conv.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No conversations yet.
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
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <span className="text-sm font-medium">Chat</span>
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
          <div className={`flex flex-col flex-1 max-w-[800px] mx-auto px-4 overflow-hidden ${showRightPanel ? '' : 'w-full'}`}>
            <Chat
              messages={messages}
              isLoading={isLoading}
              setCurrentPreview={setCurrentPreview}
              isResumeMode={isResumeMode}
              starterChips={isResumeMode ? starterChips : undefined}
              onChipClick={handleChipClick}
              resumeContent={resumeContent}
              onOpenArtifact={() => setShowArtifactPanel(true)}
            />
            <ChatInput
              retry={() => submit({})}
              isErrored={error !== undefined}
              errorMessage={errorMessage}
              isLoading={isLoading}
              isRateLimited={false}
              stop={stop}
              input={chatInput}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isMultiModal={currentModel?.multiModal || false}
              files={files}
              handleFileChange={handleFileChange}
              isResumeMode={isResumeMode}
            >
              {!isResumeMode && (
                <div className="text-xs text-muted-foreground">
                  Model: {currentModel.name}
                </div>
              )}
            </ChatInput>
          </div>

          {showRightPanel && (
            <div className="w-[480px] border-l border-border animate-slide-in-right flex-shrink-0">
              {isResumeMode && resumeContent ? (
                <div className="relative h-full w-full flex flex-col">
                  {/* Close button — left side avoids Print button on right */}
                  <div className="absolute top-2 left-2 z-20">
                    <button
                      onClick={() => setShowArtifactPanel(false)}
                      className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent/50 transition-colors"
                      aria-label="Close panel"
                    >
                      <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7815C3.44301 12.0061 3.80708 12.0061 4.03164 11.7815L7.50005 8.31316L10.9685 11.7815C11.193 12.0061 11.5571 12.0061 11.7816 11.7815C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <ResumeArtifact content={resumeContent} isLoading={isLoading} />
                </div>
              ) : !isResumeMode ? (
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
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
