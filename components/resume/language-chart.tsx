'use client'

import { useMemo, useState, useId, useRef, useLayoutEffect } from 'react'
import { BarChart3, PieChart } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

export interface LanguageStat {
  label: string
  percentage: number
  color: string
  /** Cross-highlight tech tag (e.g. "TypeScript"). */
  tag?: string
  /** Project count for this language. */
  projectCount?: number
}

export interface LanguageChartProps {
  data?: LanguageStat[]
  /** "bars" (horizontal) or "donut" (circular). */
  variant?: 'bars' | 'donut'
  /** Called when user hovers a language bar/segment. */
  onHoverLanguage?: (label: string | null) => void
  /** Called when user clicks a language bar/segment to filter. */
  onClickLanguage?: (label: string) => void
  /** Highlight a specific language from outside. */
  highlightedLanguage?: string | null
  /** Cross-highlight tech. */
  activeTech?: string | null
  onTechFocus?: (tech: string | null) => void
}

// ── Default colors ───────────────────────────────────────────────────────
// LANGUAGE BRAND PALETTE — fixed by design.
// Each language has an official brand color recognized by its community
// (TypeScript blue, Python blue, Go orange, etc.). Replacing these with
// project tokens would erase identity. Documented exception, parallel to the
// GitHub heatmap palette and the Architecture Explorer layer palette
// documented in DESIGN.md.

const DEFAULT_COLORS = [
  '#3178c6', // TypeScript blue
  '#3776ab', // Python blue
  '#f29111', // Go blue-ish
  '#e0234e', // Ruby red
  '#f7df1e', // JavaScript yellow
  '#336791', // PostgreSQL blue
  '#00d8ff', // Rust-ish
  '#8dd6f9', // Light blue
]

// SVG fill/stroke constants read HSL triples from app/globals.css tokens.
// Tailwind classes don't apply inside SVG attributes; we wrap raw hsl(var()).
const TRACK_BG = 'hsl(var(--muted))'
const LABEL_IDLE = 'hsl(var(--muted-foreground))'
const LABEL_ACTIVE = 'hsl(var(--foreground))'

// ── Default data (derived from profile topSkills) ────────────────────────

export function defaultLanguageData(): LanguageStat[] {
  return [
    { label: 'Python', percentage: 35, color: DEFAULT_COLORS[1], tag: 'Python', projectCount: 8 },
    { label: 'TypeScript', percentage: 25, color: DEFAULT_COLORS[0], tag: 'TypeScript', projectCount: 6 },
    { label: 'SQL', percentage: 12, color: DEFAULT_COLORS[5], tag: 'PostgreSQL', projectCount: 5 },
    { label: 'Go', percentage: 10, color: DEFAULT_COLORS[2], tag: 'Go', projectCount: 3 },
    { label: 'Rust', percentage: 8, color: DEFAULT_COLORS[6], tag: 'Rust', projectCount: 2 },
    { label: 'Other', percentage: 10, color: DEFAULT_COLORS[7], tag: undefined, projectCount: 4 },
  ]
}

// ── Horizontal Bar Chart ─────────────────────────────────────────────────

function BarsChart({
  data,
  onHoverLanguage,
  onClickLanguage,
  highlightedLanguage,
  activeTech,
  onTechFocus,
  hoveredIdx,
  setHoveredIdx,
}: LanguageChartProps & { data: LanguageStat[]; hoveredIdx: number | null; setHoveredIdx: (i: number | null) => void }) {
  const total = data.reduce((s, d) => s + d.percentage, 0)
  const barHeight = 18
  const gap = 4
  const labelW = 72
  const pctW = 28
  const barMaxW = 160
  const H = data.length * (barHeight + gap) + 4
  const W = labelW + barMaxW + pctW
  const wrapRef = useRef<HTMLDivElement>(null)
  const [renderWidth, setRenderWidth] = useState(W)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setRenderWidth(Math.min(W, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [W])

  return (
    <div ref={wrapRef} className="w-full max-w-full">
      <svg
        width={renderWidth}
        height={(renderWidth / W) * H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Language distribution bar chart"
        className="max-w-full overflow-visible"
      >
      {data.map((lang, i) => {
        const y = 2 + i * (barHeight + gap)
        const barW = (lang.percentage / (total || 100)) * barMaxW
        const isHovered = hoveredIdx === i
        const isHighlighted = highlightedLanguage === lang.label
        const isTechActive =
          activeTech &&
          lang.tag?.toLowerCase().includes(activeTech.toLowerCase())
        const isActive = isHovered || isHighlighted || isTechActive

        return (
          <g
            key={`lang-${i}`}
            onMouseEnter={() => {
              setHoveredIdx(i)
              onHoverLanguage?.(lang.label)
              if (lang.tag) onTechFocus?.(lang.tag)
            }}
            onMouseLeave={() => {
              setHoveredIdx(null)
              onHoverLanguage?.(null)
              if (lang.tag) onTechFocus?.(null)
            }}
            onFocus={() => {
              setHoveredIdx(i)
              onHoverLanguage?.(lang.label)
              if (lang.tag) onTechFocus?.(lang.tag)
            }}
            onBlur={() => {
              setHoveredIdx(null)
              onHoverLanguage?.(null)
              if (lang.tag) onTechFocus?.(null)
            }}
            onClick={() => {
              onClickLanguage?.(lang.label)
              if (lang.tag) onTechFocus?.(lang.tag)
            }}
            tabIndex={0}
            role="button"
            aria-label={`${lang.label}: ${lang.percentage}%${lang.projectCount ? `, ${lang.projectCount} projects` : ''}`}
            className="cursor-pointer"
          >
            {/* Label */}
            <text
              x={0}
              y={y + barHeight / 2 + 1}
              textAnchor="start"
              dominantBaseline="middle"
              fill={isActive ? LABEL_ACTIVE : LABEL_IDLE}
              fontSize={isActive ? 9 : 8}
              fontWeight={isActive ? 600 : 400}
              fontFamily="sans-serif"
              className="select-none transition-all duration-100"
            >
              {lang.label}
            </text>

            {/* Bar background */}
            <rect
              x={labelW}
              y={y}
              width={barMaxW}
              height={barHeight}
              rx={3}
              fill={TRACK_BG}
            />

            {/* Bar fill */}
            <rect
              x={labelW}
              y={y}
              width={isActive ? barW : Math.max(barW * 0.85, 4)}
              height={barHeight}
              rx={3}
              fill={lang.color}
              opacity={isActive ? 1 : 0.75}
              className="transition-all duration-150"
            />

            {/* Percentage */}
            <text
              x={labelW + barMaxW + 4}
              y={y + barHeight / 2 + 1}
              textAnchor="start"
              dominantBaseline="middle"
              fill={isActive ? LABEL_ACTIVE : LABEL_IDLE}
              fontSize={8}
              fontWeight={isActive ? 600 : 400}
              fontFamily="sans-serif"
              className="select-none transition-all duration-100"
            >
              {lang.percentage}%
            </text>
          </g>
        )
      })}
    </svg>
  </div>
  )
}

// ── Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({
  data,
  onHoverLanguage,
  onClickLanguage,
  highlightedLanguage,
  activeTech,
  onTechFocus,
  hoveredIdx,
  setHoveredIdx,
}: LanguageChartProps & { data: LanguageStat[]; hoveredIdx: number | null; setHoveredIdx: (i: number | null) => void }) {
  const total = data.reduce((s, d) => s + d.percentage, 0)
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const radius = 44
  const strokeW = 16
  const innerR = radius - strokeW / 2
  const wrapRef = useRef<HTMLDivElement>(null)
  const [renderWidth, setRenderWidth] = useState(size + 50)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setRenderWidth(Math.min(size + 50, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [size])

  // Arc path helper — use reduce so each iteration explicitly receives the
  // previous angle instead of mutating a `let` accumulator (avoids the
  // react-hooks/set-state-in-effect-style "reassign after render" warning).
  const arcs = data.reduce<Array<{
    path: string
    lang: LanguageStat
    startA: number
    endA: number
    midAngle: number
    labelX: number
    labelY: number
  }>>((acc, lang) => {
    const startA = acc.length === 0 ? -Math.PI / 2 : acc[acc.length - 1].endA
    const sliceAngle = (lang.percentage / (total || 100)) * 2 * Math.PI
    const endA = startA + sliceAngle

    const x1 = cx + innerR * Math.cos(startA)
    const y1 = cy + innerR * Math.sin(startA)
    const x2 = cx + innerR * Math.cos(endA)
    const y2 = cy + innerR * Math.sin(endA)

    const largeArc = sliceAngle > Math.PI ? 1 : 0

    const path = `M ${x1} ${y1} A ${innerR} ${innerR} 0 ${largeArc} 1 ${x2} ${y2}`

    // Label position (middle of arc, slightly outside)
    const midAngle = startA + sliceAngle / 2
    const labelR = radius + 14
    const lx = cx + labelR * Math.cos(midAngle)
    const ly = cy + labelR * Math.sin(midAngle)

    acc.push({ path, lang, startA, endA, midAngle, labelX: lx, labelY: ly })
    return acc
  }, [])

  return (
    <div ref={wrapRef} className="w-full max-w-full">
      <svg
        width={renderWidth}
        height={renderWidth}
        viewBox={`0 0 ${size + 50} ${size + 50}`}
        role="img"
        aria-label="Language distribution donut chart"
        className="max-w-full overflow-visible"
      >
      <g transform={`translate(25, 25)`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={TRACK_BG} strokeWidth={strokeW} />

        {/* Segments */}
        {arcs.map((arc, i) => {
          const isHovered = hoveredIdx === i
          const isHighlighted = highlightedLanguage === arc.lang.label
          const isTechActive =
            activeTech &&
            arc.lang.tag?.toLowerCase().includes(activeTech.toLowerCase())
          const isActive = isHovered || isHighlighted || isTechActive

          return (
            <g
              key={`donut-${i}`}
              onMouseEnter={() => {
                setHoveredIdx(i)
                onHoverLanguage?.(arc.lang.label)
                if (arc.lang.tag) onTechFocus?.(arc.lang.tag)
              }}
              onMouseLeave={() => {
                setHoveredIdx(null)
                onHoverLanguage?.(null)
                if (arc.lang.tag) onTechFocus?.(null)
              }}
              onFocus={() => {
                setHoveredIdx(i)
                onHoverLanguage?.(arc.lang.label)
                if (arc.lang.tag) onTechFocus?.(arc.lang.tag)
              }}
              onBlur={() => {
                setHoveredIdx(null)
                onHoverLanguage?.(null)
                if (arc.lang.tag) onTechFocus?.(null)
              }}
              onClick={() => {
                onClickLanguage?.(arc.lang.label)
                if (arc.lang.tag) onTechFocus?.(arc.lang.tag)
              }}
              tabIndex={0}
              role="button"
              aria-label={`${arc.lang.label}: ${arc.lang.percentage}%`}
              className="cursor-pointer"
            >
              <path
                d={arc.path}
                fill="none"
                stroke={isActive ? arc.lang.color : `${arc.lang.color}bb`}
                strokeWidth={isActive ? strokeW + 3 : strokeW}
                strokeLinecap="round"
                className="transition-all duration-150"
              />

              {/* Label (only if slice is wide enough) */}
              {arc.lang.percentage > 5 && (
                <text
                  x={arc.labelX}
                  y={arc.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? LABEL_ACTIVE : LABEL_IDLE}
                  fontSize={isActive ? 7 : 6.5}
                  fontWeight={isActive ? 600 : 400}
                  fontFamily="sans-serif"
                  opacity={isActive ? 1 : 0.7}
                  className="select-none transition-all duration-100 pointer-events-none"
                >
                  {arc.lang.percentage}%
                </text>
              )}
            </g>
          )
        })}

        {/* Center text */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={LABEL_ACTIVE}
          fontSize={11}
          fontWeight={700}
          fontFamily="sans-serif"
          className="select-none"
        >
          {total}%
        </text>
      </g>
    </svg>
  </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

export function LanguageChart(props: LanguageChartProps) {
  const data = useMemo(() => props.data ?? defaultLanguageData(), [props.data])
  const [variant, setVariant] = useState<'bars' | 'donut'>(props.variant ?? 'bars')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="print:inline-block">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-1 mb-1.5">
        <div className="flex items-center rounded-md border border-border bg-card p-0.5 print:hidden">
          <button
            type="button"
            onClick={() => setVariant('bars')}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
              variant === 'bars'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground-dim hover:text-muted-foreground'
            }`}
          >
            <BarChart3 className="h-2.5 w-2.5" />
            Bars
          </button>
          <button
            type="button"
            onClick={() => setVariant('donut')}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
              variant === 'donut'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground-dim hover:text-muted-foreground'
            }`}
          >
            <PieChart className="h-2.5 w-2.5" />
            Donut
          </button>
        </div>
      </div>

      {/* Chart - both rendered, one hidden for persistent hover state */}
      <div className={variant === 'bars' ? '' : 'hidden'}>
        <BarsChart {...props} data={data} hoveredIdx={hoveredIdx} setHoveredIdx={setHoveredIdx} />
      </div>
      <div className={variant === 'donut' ? '' : 'hidden'}>
        <div className="flex justify-center">
          <DonutChart {...props} data={data} hoveredIdx={hoveredIdx} setHoveredIdx={setHoveredIdx} />
        </div>
      </div>
    </div>
  )
}
