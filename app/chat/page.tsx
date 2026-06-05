'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
      }
      setCurrentConversationId(saved.id)
    }
    setConversations(listSessions())
  }, [])

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
        setResumeContent(object as ResumeContentSchema)
        const content: Message['content'] = [
          { type: 'text', text: (object as ResumeContentSchema).commentary || '' },
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

  const showRightPanel = isResumeMode ? messages.length > 0 : !!fragment

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
              {isResumeMode ? (
                <ResumeArtifact content={resumeContent} isLoading={isLoading} />
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
