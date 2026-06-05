'use client'

import { ResumeContentSchema } from '@/lib/schema'
import { profile } from '@/lib/profile'
import { ResumeSection } from './resume/resume-section'
import { MapPin, Mail, Phone, Globe, Github, Linkedin, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCallback } from 'react'

function ResumeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted/60" />
        <div className="h-3 w-5/6 rounded bg-muted/60" />
        <div className="h-3 w-4/6 rounded bg-muted/60" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted/60" />
        <div className="h-3 w-3/4 rounded bg-muted/60" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted/60" />
        <div className="h-3 w-2/3 rounded bg-muted/60" />
        <div className="h-3 w-5/6 rounded bg-muted/60" />
      </div>
    </div>
  )
}

export function ResumeArtifact({
  content,
  isLoading,
}: {
  content?: ResumeContentSchema
  isLoading?: boolean
}) {
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="absolute md:relative z-10 top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-auto flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-end p-2 border-b print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrint}
          className="text-muted-foreground hover:text-primary gap-1"
        >
          <Printer className="h-4 w-4" />
          Print / PDF
        </Button>
      </div>

      {/* Resume scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        {/* ── Fixed Header ── */}
        <header className="border-b border-border pb-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary font-sans">
            {profile.fullName}
          </h1>
          <p className="text-lg text-muted-foreground mt-1 font-medium">
            {profile.headline}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors">
                {profile.email}
              </a>
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {profile.phone}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <a href={profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                {profile.portfolio.replace('https://', '')}
              </a>
            </span>
            <span className="flex items-center gap-1">
              <Github className="h-3.5 w-3.5" />
              <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                github.com/getintheQ
              </a>
            </span>
            <span className="flex items-center gap-1">
              <Linkedin className="h-3.5 w-3.5" />
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                linkedin.com/in/getintheq
              </a>
            </span>
          </div>

          {profile.openToWork && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Open to work · {profile.workPreferences}
            </div>
          )}
        </header>

        {/* ── Dynamic Body ── */}
        {isLoading && (!content || !content.sections || content.sections.length === 0) ? (
          <ResumeSkeleton />
        ) : content && content.sections && content.sections.length > 0 ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {content.sections.map((section, i) => (
              <ResumeSection key={`${section.type}-${i}`} section={section} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-sm">Ask a question to generate a tailored resume view.</p>
            <p className="text-xs mt-1 opacity-60">The content here adapts to your prompt.</p>
          </div>
        )}
      </div>
    </div>
  )
}
