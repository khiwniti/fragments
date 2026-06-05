'use client'

import { FileText, Code2, ExternalLink } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ResumeContentSchema, ResumeSectionSchema } from '@/lib/schema'

export function ResumeArtifactPanel({
  content,
  onClose,
}: {
  content: ResumeContentSchema
  onClose: () => void
}) {
  return (
    <div className="h-full w-full flex flex-col bg-popover animate-slide-in-right">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary/70" />
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Resume View</span>
            <p className="text-[10px] text-muted-foreground/50 leading-none mt-0.5">
              {content.focus || 'Career overview'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent/50"
          aria-label="Close panel"
        >
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7815C3.44301 12.0061 3.80708 12.0061 4.03164 11.7815L7.50005 8.31316L10.9685 11.7815C11.193 12.0061 11.5571 12.0061 11.7816 11.7815C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2 pb-1">
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="text-xs px-3 py-1 gap-1.5">
              <FileText className="w-3 h-3" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs px-3 py-1 gap-1.5">
              <Code2 className="w-3 h-3" />
              Data
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Preview tab */}
        <TabsContent value="preview" className="flex-1 overflow-y-auto px-4 pb-6 pt-2 space-y-3 min-h-0">
          <p className="text-xs text-muted-foreground/60 leading-relaxed whitespace-pre-wrap">
            {content.commentary}
          </p>
          <div className="space-y-2">
            {content.sections?.map((section, idx) => (
              <PanelSectionCard key={`${section.type}-${idx}`} section={section} />
            ))}
          </div>
        </TabsContent>

        {/* Data tab */}
        <TabsContent value="data" className="flex-1 overflow-y-auto px-4 pb-6 pt-2 min-h-0">
          <pre className="text-[11px] text-muted-foreground/80 font-mono leading-relaxed whitespace-pre-wrap bg-accent/20 rounded-lg p-3 border border-border/30">
            {JSON.stringify(content, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── PanelSectionCard ─────────────────────────────────────────────────────

function PanelSectionCard({ section }: { section: ResumeSectionSchema }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/50 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/20 bg-accent/20">
        <span className="text-xs font-medium text-foreground">{section.title}</span>
      </div>
      <div className="divide-y divide-border/20">
        {(section.items || []).map((item, idx) => (
          <div key={idx} className="px-3 py-2 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-foreground/90">{item.label}</span>
              {item.value && (
                <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">{item.value}</span>
              )}
            </div>
            {item.detail && (
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{item.detail}</p>
            )}
            {(item.tags && item.tags.length > 0) || item.url ? (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {item.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex px-1.5 py-[2px] rounded-full bg-accent/40 text-[9px] font-medium text-muted-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground/40 hover:text-primary transition-colors ml-auto"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
