'use client'

import { ResumeSectionSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

export function ResumeSection({
  section,
}: {
  section: DeepPartial<ResumeSectionSchema>
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-primary tracking-tight border-b border-border pb-1">
        {section.title}
      </h2>
      <div className="space-y-3">
        {(section.items ?? [])
          .filter((item): item is NonNullable<typeof item> => !!item)
          .map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground">
                    {item.label}
                  </span>
                  {item.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal bg-white/5 text-muted-foreground"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                {item.value && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.value}
                  </p>
                )}
                {item.detail && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {item.detail}
                  </p>
                )}
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors mt-0.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
