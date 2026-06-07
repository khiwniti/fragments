import { Message } from '@/lib/messages'
import { FragmentSchema, ResumePatchSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { LoaderIcon, Terminal, FileText, PanelRight, Plus, RefreshCw, ArrowUpDown, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { StarterChip } from '@/lib/profile'
import { partialDiff, type SandboxView } from '@/lib/resume-sandbox'

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
  isResumeMode,
  starterChips,
  onChipClick,
  resumeView,
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
  resumeView?: SandboxView
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
      className="flex flex-col pb-12 gap-3 overflow-y-auto max-h-full"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {showChips && starterChips && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] px-4 animate-in fade-in duration-500">
          <div className="text-center space-y-3 mb-8 max-w-lg">
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
              Ask me anything
            </h2>
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
                className="group relative px-4 py-2 rounded-full text-xs font-medium border border-border/60 bg-accent/30 text-accent-foreground hover:bg-accent hover:border-primary/40 hover:text-foreground transition-colors duration-200 active:scale-[0.97]"
              >
                <span className="relative z-10">{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {messages.map((message: Message, index: number) => {
        const isUser = message.role === 'user'
        const isLastMessage = index === messages.length - 1
        const isAssistant = message.role === 'assistant'
        // The streamed object on a resume-mode assistant message is a patch.
        const patch = isAssistant && isResumeMode
          ? (message.object as DeepPartial<ResumePatchSchema> | undefined)
          : undefined
        const diff = patch ? partialDiff(patch) : null
        const sandboxIsEmpty = !resumeView || resumeView.sections.length === 0
        const showSandboxCard = isResumeMode && resumeView && (isLastMessage || resumeView.sections.length > 0)
        const showDiffCard = isResumeMode && isLastMessage && isAssistant && diff && diff.hasChanges
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
            {message.object && !isResumeMode && (
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

            {/* Resume mode: per-message orchestration diff card. Visible only on
                the last assistant message while the stream is active or just
                finished, and only when the patch actually changed something. */}
            {showDiffCard && diff && (
              <div
                className="mt-1 w-full md:w-max flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-left"
                role="status"
                aria-live="polite"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {patch?.intent || 'Resume updated'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {diff.added > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Plus className="w-2.5 h-2.5" />
                        {diff.added} added
                      </span>
                    )}
                    {diff.updated > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5" />
                        {diff.updated} updated
                      </span>
                    )}
                    {diff.removed > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="w-2.5 h-2.5" />
                        {diff.removed} removed
                      </span>
                    )}
                    {diff.reordered > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpDown className="w-2.5 h-2.5" />
                        {diff.reordered} reordered
                      </span>
                    )}
                    {sandboxIsEmpty && 'no-op patch'}
                  </span>
                </div>
              </div>
            )}

            {/* Resume mode sandbox summary. Click to expand the right panel. */}
            {showSandboxCard && resumeView && (
              <button
                onClick={onOpenArtifact}
                className="mt-1 w-full md:w-max flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-accent/40 hover:border-primary/40 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground">
                    {resumeView.focus || 'Resume View'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                    {resumeView.sections.length} sections &middot; Click to expand
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                  <PanelRight className="w-3 h-3" />
                </div>
              </button>
            )}
          </div>
        )
      })}
      {isLoading && (
        <div className="flex items-center gap-2 self-start text-sm text-muted-foreground px-1" role="status" aria-live="polite">
          <LoaderIcon strokeWidth={2} className="animate-spin w-4 h-4" />
          <span>Generating...</span>
        </div>
      )}
    </div>
  )
}
