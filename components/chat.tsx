import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { LoaderIcon, Terminal } from 'lucide-react'
import { useEffect } from 'react'
import { StarterChip } from '@/lib/profile'

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
  isResumeMode,
  starterChips,
  onChipClick,
}: {
  messages: Message[]
  isLoading: boolean
  setCurrentPreview: (preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => void
  isResumeMode?: boolean
  starterChips?: StarterChip[]
  onChipClick?: (prompt: string) => void
}) {
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [JSON.stringify(messages)])

  const showChips = isResumeMode && messages.length === 0 && !isLoading

  return (
    <div
      id="chat-container"
      className="flex flex-col pb-12 gap-2 overflow-y-auto max-h-full"
    >
      {showChips && starterChips && (
        <div className="px-4 py-6 space-y-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Ask about Khiw's experience, projects, or skills.
            </p>
            <p className="text-xs text-muted-foreground/60">
              The resume on the right will adapt to your question.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {starterChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => onChipClick?.(chip.prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-accent/50 text-accent-foreground hover:bg-accent hover:border-primary/30 transition-all duration-200"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {messages.map((message: Message, index: number) => (
        <div
          className={`flex flex-col px-4 shadow-sm whitespace-pre-wrap ${message.role !== 'user' ? 'bg-accent dark:bg-white/5 border text-accent-foreground dark:text-muted-foreground py-4 rounded-2xl gap-4 w-full' : 'bg-gradient-to-b from-black/5 to-black/10 dark:from-black/30 dark:to-black/50 py-2 rounded-xl gap-2 w-fit'} font-serif`}
          key={index}
        >
          {message.content.map((content, id) => {
            if (content.type === 'text') {
              return content.text
            }
            if (content.type === 'image') {
              return (
                <img
                  key={id}
                  src={content.image}
                  alt="fragment"
                  className="mr-2 inline-block w-12 h-12 object-cover rounded-lg bg-white mb-2"
                />
              )
            }
          })}
          {message.object && !isResumeMode && (
            <div
              onClick={() =>
                setCurrentPreview({
                  fragment: message.object,
                  result: message.result,
                })
              }
              className="py-2 pl-2 w-full md:w-max flex items-center border rounded-xl select-none hover:bg-white dark:hover:bg-white/5 hover:cursor-pointer"
            >
              <div className="rounded-[0.5rem] w-10 h-10 bg-black/5 dark:bg-white/5 self-stretch flex items-center justify-center">
                <Terminal strokeWidth={2} className="text-[#FF8800]" />
              </div>
              <div className="pl-2 pr-4 flex flex-col">
                <span className="font-bold font-sans text-sm text-primary">
                  {message.object.title}
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  Click to see fragment
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <LoaderIcon strokeWidth={2} className="animate-spin w-4 h-4" />
          <span>Generating...</span>
        </div>
      )}
    </div>
  )
}
