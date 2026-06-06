'use client'

import { ResumeItemSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'
import { profile } from '@/lib/profile'
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
} from 'lucide-react'

// ── Print palette ────────────────────────────────────────────────────────
// Fixed colors (NOT theme tokens) so the on-screen sheet is identical to
// the printed page: white paper, near-black text, one accent (sky-800).

/** Profile header — always the first block of page 1. */
export function ResumeHeaderBlock() {
  return (
    <header className="border-b border-slate-200 pb-4">
      <h1 className="text-[26px] leading-tight font-bold tracking-tight text-slate-900">
        {profile.fullName}
      </h1>
      <p className="text-[13px] text-slate-600 mt-0.5 font-medium">
        {profile.headline}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {profile.location}
        </span>
        <span className="flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <a href={`mailto:${profile.email}`} className="hover:text-sky-800">
            {profile.email}
          </a>
        </span>
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {profile.phone}
        </span>
        <span className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          <a href={profile.portfolio} target="_blank" rel="noreferrer" className="hover:text-sky-800">
            {profile.portfolio.replace('https://', '')}
          </a>
        </span>
        <span className="flex items-center gap-1">
          <Github className="h-3 w-3" />
          <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-sky-800">
            github.com/getintheQ
          </a>
        </span>
        <span className="flex items-center gap-1">
          <Linkedin className="h-3 w-3" />
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-sky-800">
            linkedin.com/in/getintheq
          </a>
        </span>
      </div>

      {profile.openToWork && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
          <span className="inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          Open to work · {profile.workPreferences}
        </div>
      )}
    </header>
  )
}

/** Section heading — packed so it is never orphaned from its first item. */
export function SectionHeadingBlock({ title }: { title?: string }) {
  return (
    <h2 className="text-[14px] font-semibold text-sky-800 tracking-tight border-b border-slate-200 pb-1 pt-2">
      {title}
    </h2>
  )
}

/** One resume item (one job, one project, …). */
export function SectionItemBlock({
  item,
}: {
  item: DeepPartial<ResumeItemSchema>
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[12px] text-slate-900">
            {item.label}
          </span>
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 rounded bg-slate-100 text-slate-600 border border-slate-200 leading-4"
            >
              {tag}
            </span>
          ))}
        </div>
        {item.value && (
          <p className="text-[10px] text-slate-500 mt-0.5">{item.value}</p>
        )}
        {item.detail && (
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            {item.detail}
          </p>
        )}
      </div>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-slate-400 hover:text-sky-800 mt-0.5"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

/** Loading skeleton, restyled for the white sheet. */
export function SheetSkeletonBlock() {
  return (
    <div className="space-y-8 animate-pulse pt-4">
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
        <div className="h-3 w-4/6 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  )
}

/** Empty state shown on a single white sheet before any generation. */
export function SheetEmptyBlock() {
  return (
    <div className="text-center text-slate-500 py-12">
      <p className="text-sm">Ask a question to generate a tailored resume view.</p>
      <p className="text-xs mt-1 opacity-60">The content here adapts to your prompt.</p>
    </div>
  )
}
