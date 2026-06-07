import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { LoaderIcon, Terminal } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
}: {
  messages: Message[]
  isLoading: boolean
  setCurrentPreview: (preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => void
}) {
  // Scroll the chat container to the bottom whenever a new message lands.
  const lastLengthRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length === lastLengthRef.current) return
    lastLengthRef.current = messages.length
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages.length])

  return (
    <div
      id="chat-container"
      className="flex flex-col pb-12 gap-3 overflow-y-auto max-h-full"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message: Message, index: number) => {
        const isUser = message.role === 'user'
        return (
          <div
            className={`flex flex-col px-4 py-3 rounded-2xl max-w-[90%] font-sans transition-colors ${
              isUser
                ? 'self-end bg-primary/10 text-foreground border border-primary/20 gap-2'
                : 'self-start bg-secondary text-secondary-foreground border border-border gap-3'
            }`}
            key={index}
          >
            {message.content.map((content, id) => {
              if (content.type === 'text') {
                return <span key={id} className="whitespace-pre-wrap break-words">{content.text}</span>
              }
              if (content.type === 'image') {
                return (
                  <img
                    key={id}
                    src={content.image}
                    alt="Uploaded image"
                    className="inline-block w-12 h-12 object-cover rounded-lg border border-border mb-1"
                  />
                )
              }
              return null
            })}
            {message.object && (
              <button
                onClick={() =>
                  setCurrentPreview({
                    fragment: message.object,
                    result: message.result,
                  })
                }
                className="mt-1 w-full md:w-max flex items-center border border-border rounded-xl select-none bg-card hover:bg-accent/40 hover:border-primary/30 hover:cursor-pointer transition-colors group/artifact text-left"
              >
                <div className="rounded-lg w-10 h-10 bg-primary/10 self-stretch flex items-center justify-center">
                  <Terminal strokeWidth={2} className="text-primary" />
                </div>
                <div className="pl-2 pr-4 flex flex-col">
                  <span className="font-medium font-sans text-sm text-foreground">
                    {message.object.title}
                  </span>
                  <span className="font-sans text-xs text-muted-foreground">
                    Click to see fragment
                  </span>
                </div>
              </button>
            )}
          </div>
        )
      })}
      {isLoading && (
        <div className="flex items-center gap-2 self-start text-sm text-muted-foreground px-1" role="status" aria-live="polite">
          <LoaderIcon strokeWidth={2} className="animate-spin motion-reduce:animate-none w-4 h-4" />
          <span>Generating...</span>
        </div>
      )}
    </div>
  )
}