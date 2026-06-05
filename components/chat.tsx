import { Message } from '@/lib/messages'
import { FragmentSchema, ResumeContentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { LoaderIcon, Terminal, FileText, PanelRight } from 'lucide-react'
import { useEffect } from 'react'
import { StarterChip } from '@/lib/profile'

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
  isResumeMode,
  starterChips,
  onChipClick,
  resumeContent,
  onOpenArtifact,
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
  resumeContent?: DeepPartial<ResumeContentSchema>
  onOpenArtifact?: () => void
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
        <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] px-4 animate-in fade-in duration-500">
          <div className="text-center space-y-4 mb-10 max-w-lg">
            <h1 className="font-bold leading-[1.1] tracking-tight" style={{ fontSize: 'clamp(24px,4vw,38px)' }}>
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
                onClick={() => onChipClick?.(chip.prompt)}
                className="group relative px-4 py-2 rounded-full text-xs font-medium border border-border/60 bg-accent/30 text-accent-foreground hover:bg-accent hover:border-primary/40 hover:text-foreground transition-all duration-200 active:scale-[0.97]"
              >
                <span className="relative z-10">{chip.label}</span>
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

          {/* Resume mode artifact card */}
          {isResumeMode && resumeContent?.sections && resumeContent.sections.length > 0 && index === messages.length - 1 && (
            <button
              onClick={onOpenArtifact}
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
                  {resumeContent.sections.length} sections &middot; Click to expand
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                <PanelRight className="w-3 h-3" />
              </div>
            </button>
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
