'use client'

import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

export interface SectionClaimStat {
  sectionId: string
  sectionTitle: string
  /** Number of items with evidence/detail in this section. */
  claimCount: number
  /** Total items in this section. */
  totalItems: number
}

export interface ClaimDensityProps {
  sections: SectionClaimStat[]
  onSelectSection?: (sectionId: string) => void
}

// ── Default data generator ───────────────────────────────────────────────

export function deriveClaimStats(
  sections: { id?: string; title?: string; items?: { detail?: string; children?: unknown[] }[] }[],
): SectionClaimStat[] {
  return sections
    .filter((s) => s.items && s.items.length > 0)
    .map((s) => {
      const items = s.items ?? []
      const claimCount = items.filter(
        (i) => i.detail || (i.children && i.children.length > 0),
      ).length
      return {
        sectionId: s.id ?? '',
        sectionTitle: s.title ?? '',
        claimCount,
        totalItems: items.length,
      }
    })
    .filter((s) => s.sectionId)
}

// ── Main Component ───────────────────────────────────────────────────────

export function ClaimDensityVisualizer({
  sections,
  onSelectSection,
}: ClaimDensityProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const maxClaims = useMemo(
    () => Math.max(...sections.map((s) => s.claimCount), 1),
    [sections],
  )

  // Filter to sections with claims
  const withClaims = sections.filter((s) => s.claimCount > 0)

  if (withClaims.length === 0) return null

  return (
    <div className="print:inline-block">
      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mb-1.5">
        <FileText className="h-2.5 w-2.5" />
        <span>Evidence density — per section</span>
      </div>

      <div className="space-y-1">
        {withClaims.map((section) => {
          const isHovered = hoveredId === section.sectionId
          const fraction = section.claimCount / maxClaims
          const barW = Math.max(fraction * 140, 24)
          const density =
            section.totalItems > 0
              ? ((section.claimCount / section.totalItems) * 100).toFixed(0)
              : '0'

          return (
            <button
              key={section.sectionId}
              type="button"
              onClick={() => onSelectSection?.(section.sectionId)}
              onMouseEnter={() => setHoveredId(section.sectionId)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(section.sectionId)}
              onBlur={() => setHoveredId(null)}
              className="flex items-center gap-2 w-full text-left cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-slate-50 print:hover:bg-transparent"
              tabIndex={0}
              role="button"
              aria-label={`${section.sectionTitle}: ${section.claimCount} of ${section.totalItems} items with evidence (${density}%)`}
            >
              {/* Label */}
              <span
                className={`w-20 shrink-0 text-[9px] font-medium transition-colors ${
                  isHovered ? 'text-indigo-700' : 'text-slate-500'
                }`}
              >
                {section.sectionTitle}
              </span>

              {/* Bar track */}
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden max-w-[140px]">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    isHovered
                      ? 'bg-indigo-400'
                      : 'bg-indigo-300/60'
                  }`}
                  style={{ width: barW }}
                />
              </div>

              {/* Count */}
              <span
                className={`w-16 text-right text-[9px] font-medium transition-colors ${
                  isHovered ? 'text-indigo-700' : 'text-slate-400'
                }`}
              >
                {section.claimCount}/{section.totalItems}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-[8px] text-slate-400 mt-1.5 italic">
        Hover for detail · Click to navigate to section
      </p>
    </div>
  )
}
