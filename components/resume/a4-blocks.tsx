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
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileText,
  X,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'

// ── Print palette ────────────────────────────────────────────────────────
// Fixed colors (NOT theme tokens) so the on-screen sheet is identical to
// the printed page: white paper, near-black text, one accent (sky-800).

// ── Shared interaction props ─────────────────────────────────────────────
export interface InteractiveProps {
  onSelect?: (id: string, label: string) => void
  onTechFocus?: (tech: string | null) => void
  onAskSection?: (sectionId: string, title: string) => void
  onEvidence?: (claim: string, detail: string) => void
  highlighted?: boolean
  activeTech?: string | null
}

const HIGHLIGHT_CLASSES =
  'ring-2 ring-amber-400 animate-pulse rounded-sm print:ring-0 print:animate-none'

const MATCH_TECH_CLASSES =
  'ring-1 ring-indigo-300 bg-indigo-50/40 rounded-sm print:ring-0'

const MAX_CHILD_DEPTH = 3

// ── Evidence Popover ─────────────────────────────────────────────────────

export interface EvidenceState {
  claim: string
  detail: string
  x: number
  y: number
}

export function EvidencePopover({
  evidence,
  onClose,
}: {
  evidence: EvidenceState
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    // Delay to avoid immediate close from the same click
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 10)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 rounded-lg border border-slate-200 bg-white shadow-xl"
      style={{ left: Math.min(evidence.x, window.innerWidth - 300), top: Math.min(evidence.y, window.innerHeight - 200) }}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-xs font-semibold text-slate-700">Provenance</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-medium text-slate-800">{evidence.claim}</p>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          {evidence.detail}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
          <FileText className="h-3 w-3" />
          <span>Sourced from portfolio knowledge graph</span>
        </div>
      </div>
    </div>
  )
}

// ── Profile header ───────────────────────────────────────────────────────

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

// ── Tech Badge (hover/focus cross-highlight target) ──────────────────────

function TechBadge({
  tag,
  activeTech,
  onTechFocus,
}: {
  tag: string
  activeTech?: string | null
  onTechFocus?: (tech: string | null) => void
}) {
  const isActive = activeTech === tag
  return (
    <span
      role="button"
      tabIndex={0}
      onMouseEnter={() => onTechFocus?.(tag)}
      onMouseLeave={() => onTechFocus?.(null)}
      onFocus={() => onTechFocus?.(tag)}
      onBlur={() => onTechFocus?.(null)}
      className={`inline-flex items-center text-[9px] px-1.5 rounded border leading-4 cursor-default transition-all duration-150
        ${
          isActive
            ? 'border-indigo-400 bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
        }
        print:border-slate-200 print:bg-slate-50 print:text-slate-600 print:ring-0`}
    >
      {tag}
    </span>
  )
}

// ── Section heading ──────────────────────────────────────────────────────

export function SectionHeadingBlock({
  title,
  id,
  onSelect,
  onAskSection,
  highlighted,
  activeTech,
  onTechFocus,
}: {
  title?: string
  id?: string
} & InteractiveProps) {
  const heading = (
    <div className="flex items-center justify-between">
      <h2
        className={`text-[14px] font-semibold text-sky-800 tracking-tight ${
          highlighted ? HIGHLIGHT_CLASSES : ''
        }`}
      >
        {title}
      </h2>
      {onAskSection && id && title && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAskSection(id, title)
          }}
          className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors print:hidden"
          title={`Ask about ${title}`}
        >
          <Sparkles className="h-3 w-3" />
          Ask
        </button>
      )}
    </div>
  )

  if (!onSelect) return <div className="border-b border-slate-200 pb-1 pt-2">{heading}</div>

  return (
    <div className="border-b border-slate-200 pb-1 pt-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelect(id ?? title ?? '', title ?? '')}
          className="block w-full text-left cursor-pointer rounded-sm hover:ring-1 hover:ring-slate-300 print:ring-0 print:animate-none"
        >
          <h2
            className={`text-[14px] font-semibold text-sky-800 tracking-tight ${
              highlighted ? HIGHLIGHT_CLASSES : ''
            }`}
          >
            {title}
          </h2>
        </button>
        {onAskSection && id && title && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAskSection(id, title)
            }}
            className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-1.5 py-0.5 rounded transition-colors print:hidden"
            title={`Ask about ${title}`}
          >
            <Sparkles className="h-3 w-3" />
            Ask
          </button>
        )}
      </div>
    </div>
  )
}

// ── Collapsible children ─────────────────────────────────────────────────

function CollapsibleChildren({
  children,
  depth,
  onSelect,
  highlightedIds,
  activeTech,
  onTechFocus,
  onEvidence,
}: {
  children: DeepPartial<ResumeItemSchema>[]
  depth: number
} & Omit<InteractiveProps, 'highlighted' | 'onAskSection'> & {
  highlightedIds?: ReadonlySet<string>
}) {
  const [isOpen, setIsOpen] = useState(false)

  if (children.length === 0) return null

  // Auto-open if any child is highlighted
  const anyHighlighted = children.some(
    (c) => c?.id && highlightedIds?.has(c.id),
  )
  useEffect(() => {
    if (anyHighlighted) setIsOpen(true)
  }, [anyHighlighted])

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 mt-1 transition-colors print:hidden"
      >
        <ChevronRight className="h-3 w-3" />
        <span>{children.length} detail{children.length > 1 ? 's' : ''}</span>
      </button>
    )
  }

  return (
    <div className="pl-4 border-l border-slate-200 mt-1 space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 mb-1 transition-colors print:hidden"
      >
        <ChevronDown className="h-3 w-3" />
        <span>Hide</span>
      </button>
      {children.map((child, ci) => (
        <SectionItemBlock
          key={child?.id ?? child?.label ?? ci}
          item={child!}
          onSelect={onSelect}
          highlightedIds={highlightedIds}
          depth={depth + 1}
          activeTech={activeTech}
          onTechFocus={onTechFocus}
          onEvidence={onEvidence}
        />
      ))}
    </div>
  )
}

// ── One resume item ──────────────────────────────────────────────────────

export function SectionItemBlock({
  item,
  onSelect,
  highlighted,
  highlightedIds,
  depth = 0,
  activeTech,
  onTechFocus,
  onEvidence,
}: {
  item: DeepPartial<ResumeItemSchema>
  highlightedIds?: ReadonlySet<string>
  depth?: number
} & InteractiveProps) {
  const itemId = item.id ?? item.label ?? ''
  const isHighlighted =
    highlighted ?? (itemId ? (highlightedIds?.has(itemId) ?? false) : false)

  // Check if any of this item's tags match the active tech
  const hasActiveTech =
    activeTech &&
    item.tags?.some((t) => t?.toLowerCase().includes(activeTech.toLowerCase()))

  const containerClass = isHighlighted
    ? HIGHLIGHT_CLASSES
    : hasActiveTech
      ? MATCH_TECH_CLASSES
      : undefined

  const content = (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-[12px] text-slate-900">
          {item.label}
        </span>
        {item.tags?.filter((t): t is string => !!t).map((tag) => (
          <TechBadge
            key={tag}
            tag={tag}
            activeTech={activeTech}
            onTechFocus={onTechFocus}
          />
        ))}
      </div>
      {item.value && (
        <p className="text-[10px] text-slate-500 mt-0.5">
          {item.value}
        </p>
      )}
      {item.detail && (
        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
          {item.detail}
        </p>
      )}
    </>
  )

  const children = (item.children ?? []).filter(
    (c): c is DeepPartial<ResumeItemSchema> => !!c,
  )

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between gap-2">
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(itemId, item.label ?? '')}
            className="flex-1 min-w-0 w-full text-left cursor-pointer rounded-sm hover:ring-1 hover:ring-slate-300 print:ring-0 print:animate-none"
          >
            {content}
          </button>
        ) : (
          <div className="flex-1 min-w-0">{content}</div>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {item.detail && onEvidence && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEvidence(item.value ?? item.label ?? '', item.detail ?? '')
              }}
              className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 hover:text-amber-800 hover:underline underline-offset-2 transition-colors print:hidden"
              title="View provenance"
            >
              <FileText className="h-2.5 w-2.5" />
            </button>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-sky-800 mt-0.5"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
      {children.length > 0 && depth < MAX_CHILD_DEPTH && (
        <CollapsibleChildren
          children={children}
          depth={depth}
          onSelect={onSelect}
          highlightedIds={highlightedIds}
          activeTech={activeTech}
          onTechFocus={onTechFocus}
          onEvidence={onEvidence}
        />
      )}
    </div>
  )
}

// ── Tech filter chips ────────────────────────────────────────────────────

export function TechFilterBar({
  allTags,
  activeFilter,
  onFilter,
}: {
  allTags: string[]
  activeFilter: string | null
  onFilter: (tag: string | null) => void
}) {
  if (allTags.length === 0) return null

  // Deduplicate and sort
  const unique = [...new Set(allTags)].sort()

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1.5">
      {activeFilter && (
        <button
          type="button"
          onClick={() => onFilter(null)}
          className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 transition-colors print:hidden"
        >
          <X className="h-2.5 w-2.5" />
          Clear
        </button>
      )}
      {unique.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onFilter(activeFilter === tag ? null : tag)}
          className={`inline-flex items-center text-[9px] px-2 py-0.5 rounded-full border transition-colors print:hidden
            ${
              activeFilter === tag
                ? 'border-indigo-400 bg-indigo-100 text-indigo-700 font-medium'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────

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
