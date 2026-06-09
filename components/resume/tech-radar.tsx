'use client'

import { useMemo, useId, useState, useRef, useLayoutEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { DeepPartial } from 'ai'

// ── Types ────────────────────────────────────────────────────────────────

export interface RadarAxis {
  label: string
  value: number // 0–100
  description?: string
}

export interface TechRadarProps {
  /** Axes radiating from center. 3–8 recommended for visual clarity. */
  axes: RadarAxis[]
  /** Optional benchmark dataset (e.g. "Industry Avg"). Dashed line. */
  comparison?: {
    label: string
    values: number[] // same length as axes
  }
  width?: number
  height?: number
  /** Called when user clicks an axis label or vertex. */
  onSelectAxis?: (axis: RadarAxis) => void
  /** Called when user hovers an axis. */
  onHoverAxis?: (axis: RadarAxis | null) => void
  /** Highlight a specific axis (from outside, e.g. cross-section). */
  highlightedAxis?: string | null
  activeTech?: string | null
  onTechFocus?: (tech: string | null) => void
}

// ── Constants ────────────────────────────────────────────────────────────

const STROKE_COLOR = '#cbd5e1' // slate-300
const GRID_COLOR = '#f1f5f9' // slate-100
const USER_COLOR = '#6366f1' // indigo-500
const USER_FILL = 'rgba(99, 102, 241, 0.08)'
const COMP_COLOR = '#94a3b8' // slate-400
const AXIS_LABEL_COLOR = '#64748b' // slate-500
const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

// ── Helpers ──────────────────────────────────────────────────────────────

/** Polar → Cartesian coordinates for an axis at fraction `f` (0–1) of the radius. */
function polar(
  cx: number,
  cy: number,
  r: number,
  angle: number,
  f: number = 1,
): [number, number] {
  const a = angle - Math.PI / 2 // start from top
  return [cx + r * f * Math.cos(a), cy + r * f * Math.sin(a)]
}

function polygonPoints(
  cx: number,
  cy: number,
  r: number,
  values: number[],
  angles: number[],
): string {
  return values
    .map((v, i) => {
      const [x, y] = polar(cx, cy, r, angles[i], v / 100)
      return `${x},${y}`
    })
    .join(' ')
}

// ── SVG Radar Chart ──────────────────────────────────────────────────────

export function TechRadar({
  axes,
  comparison,
  width = 240,
  height = 240,
  onSelectAxis,
  onHoverAxis,
  highlightedAxis,
  activeTech,
  onTechFocus,
}: TechRadarProps) {
  const uid = useId()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [renderWidth, setRenderWidth] = useState(width)

  // Responsive: measure container width and clamp to design width
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setRenderWidth(Math.min(width, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  const N = axes.length
  const pad = 48 // room for labels outside the chart
  const cx = width / 2
  const cy = height / 2
  const R = Math.min(cx, cy) - pad

  const angles = useMemo(
    () => axes.map((_, i) => (2 * Math.PI * i) / N),
    [axes, N],
  )

  // Grid rings (4 concentric polygons)
  const gridFractions = [0.25, 0.5, 0.75, 1.0]
  const gridValues = axes.map(() => 100) // full-size polygon, scaled by fraction
  const gridPolys = gridFractions.map((f) =>
    polygonPoints(cx, cy, R * f, gridValues, angles),
  )

  // User data polygon
  const userValues = axes.map((a) => a.value)
  const userPoly = polygonPoints(cx, cy, R, userValues, angles)

  // Comparison data polygon
  const compPoly =
    comparison && comparison.values.length === N
      ? polygonPoints(cx, cy, R, comparison.values, angles)
      : null

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleAxisEnter = (idx: number) => {
    setHoveredIdx(idx)
    onHoverAxis?.(axes[idx])
    onTechFocus?.(axes[idx].label)
  }

  const handleAxisLeave = () => {
    setHoveredIdx(null)
    onHoverAxis?.(null)
    onTechFocus?.(null)
  }

  const handleAxisClick = (idx: number) => {
    onSelectAxis?.(axes[idx])
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div ref={wrapRef} className="w-full max-w-full">
      <svg
        width={renderWidth}
        height={renderWidth}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full overflow-visible"
        role="img"
        aria-label={`Skill radar chart with ${N} axes: ${axes.map((a) => a.label).join(', ')}`}
      >
        {/* Grid rings */}
        {gridPolys.map((pts, gi) => (
          <polygon
            key={`grid-${gi}`}
            points={pts}
            fill="none"
            stroke={GRID_COLOR}
            strokeWidth={gi === gridPolys.length - 1 ? 1 : 0.5}
          />
        ))}

        {/* Axis lines */}
        {angles.map((angle, i) => {
          const [x, y] = polar(cx, cy, R, angle)
          const isHovered = hoveredIdx === i
          const isHighlighted = highlightedAxis === axes[i].label
          const isActiveTech =
            activeTech &&
            axes[i].label.toLowerCase().includes(activeTech.toLowerCase())
          const axisActive = isHovered || isHighlighted || isActiveTech
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={axisActive ? USER_COLOR : STROKE_COLOR}
              strokeWidth={axisActive ? 1.5 : 0.5}
              className="transition-all duration-150"
            />
          )
        })}

        {/* Comparison polygon (dashed) */}
        {compPoly && (
          <>
            <polygon
              points={compPoly}
              fill="none"
              stroke={COMP_COLOR}
              strokeWidth={1}
              strokeDasharray="3 2"
              className="print:stroke-black print:opacity-50"
            />
            {/* Comparison vertex dots */}
            {comparison!.values.map((v, i) => {
              const [dx, dy] = polar(cx, cy, R, angles[i], v / 100)
              return (
                <circle
                  key={`comp-dot-${i}`}
                  cx={dx}
                  cy={dy}
                  r={2}
                  fill={COMP_COLOR}
                />
              )
            })}
          </>
        )}

        {/* User data polygon */}
        <polygon
          points={userPoly}
          fill={USER_FILL}
          stroke={USER_COLOR}
          strokeWidth={1.5}
          className="transition-opacity duration-150"
        />

        {/* User vertex dots + axis labels */}
        {axes.map((axis, i) => {
          const [vx, vy] = polar(cx, cy, R, angles[i], axis.value / 100)
          const [lx, ly] = polar(cx, cy, R + 14, angles[i])
          const isHovered = hoveredIdx === i
          const isHighlighted = highlightedAxis === axis.label
          const isActiveTech =
            activeTech &&
            axis.label.toLowerCase().includes(activeTech.toLowerCase())
          const axisActive = isHovered || isHighlighted || isActiveTech

          // Text anchor
          const tx = angles[i]
          const isRight = tx > -Math.PI / 2 && tx < Math.PI / 2
          const textAnchor = isRight ? 'start' : 'end'
          // Slight horizontal offset for labels directly at top/bottom
          const dxOffset =
            Math.abs(Math.cos(tx)) < 0.05 ? -0.5 * axes[i].label.length * 3.5 : 0

          return (
            <g key={`axis-group-${i}`} className="print:opacity-100">
              {/* User data vertex dot */}
              {axis.value > 0 && (
                <circle
                  cx={vx}
                  cy={vy}
                  r={axisActive ? 4 : 2.5}
                  fill={axisActive ? USER_COLOR : 'white'}
                  stroke={USER_COLOR}
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all duration-150 print:fill-white"
                  onClick={() => handleAxisClick(i)}
                  onMouseEnter={() => handleAxisEnter(i)}
                  onMouseLeave={handleAxisLeave}
                  onFocus={() => handleAxisEnter(i)}
                  onBlur={handleAxisLeave}
                  tabIndex={0}
                  role="button"
                  aria-label={`${axis.label}: ${axis.value}%${axis.description ? `. ${axis.description}` : ''}`}
                />
              )}

              {/* Axis label */}
              <text
                x={lx + dxOffset}
                y={ly + 1.5}
                textAnchor={textAnchor}
                fill={axisActive ? USER_COLOR : AXIS_LABEL_COLOR}
                fontSize={axisActive ? 10 : 9}
                fontWeight={axisActive ? 600 : 400}
                fontFamily={FONT_FAMILY}
                className="cursor-pointer select-none transition-all duration-150 print:fill-black print:text-[9px] print:font-normal"
                onClick={() => handleAxisClick(i)}
                onMouseEnter={() => handleAxisEnter(i)}
                onMouseLeave={handleAxisLeave}
                onFocus={() => handleAxisEnter(i)}
                onBlur={handleAxisLeave}
                tabIndex={0}
                role="button"
                aria-label={`${axis.label}: ${axis.value}%`}
              >
                {axis.label}
              </text>

              {/* Value label next to vertex */}
              {axis.value > 0 && (
                <text
                  x={vx + (isRight ? 6 : -6)}
                  y={vy - 6}
                  textAnchor="middle"
                  fill={axisActive ? USER_COLOR : '#94a3b8'}
                  fontSize={7}
                  fontFamily={FONT_FAMILY}
                  className="pointer-events-none transition-opacity duration-150 print:fill-gray-500"
                  opacity={isHovered || isHighlighted ? 1 : 0.6}
                >
                  {axis.value}%
                </text>
              )}
            </g>
          )
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={1.5} fill={STROKE_COLOR} />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] print:text-[9px]">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border"
            style={{
              backgroundColor: USER_COLOR,
              borderColor: USER_COLOR,
            }}
          />
          You
        </span>
        {comparison && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <span
              className="inline-block h-0 border-t border-dashed"
              style={{
                width: 14,
                borderColor: COMP_COLOR,
                borderTopWidth: 1.5,
              }}
            />
            {comparison.label}
          </span>
        )}
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="h-2.5 w-2.5" />
          Click axis to explore
        </span>
      </div>
    </div>
  )
}

// ── Data Derivation ──────────────────────────────────────────────────────
// Compute radar axis values from resume section items.

export type SkillItem = DeepPartial<{
  label?: string
  value?: string
  tags?: string[]
}>

/** Derive 5-axis radar values from the Skills section items plus a rough
 *  benchmark for "Avg. Senior" comparison.  Heuristic: uses years from tags
 *  and the proficiency (Expert → 90, Advanced → 75, etc.) */
export function deriveRadarAxes(skillItems: SkillItem[]): {
  axes: RadarAxis[]
  benchmark: number[]
} {
  // Map each skill to one of 5 canonical axes based on keywords
  const bucketMap: Record<string, { skill: string; weight: number }[]> = {
    Backend: [],
    Frontend: [],
    DevOps: [],
    'AI/ML': [],
    Databases: [],
  }

  const keywordMap: Record<string, string> = {
    typescript: 'Frontend',
    javascript: 'Frontend',
    react: 'Frontend',
    next: 'Frontend',
    vue: 'Frontend',
    css: 'Frontend',
    html: 'Frontend',
    python: 'Backend',
    node: 'Backend',
    fastapi: 'Backend',
    express: 'Backend',
    api: 'Backend',
    go: 'Backend',
    rust: 'Backend',
    java: 'Backend',
    docker: 'DevOps',
    kubernetes: 'DevOps',
    k8s: 'DevOps',
    terraform: 'DevOps',
    aws: 'DevOps',
    gcp: 'DevOps',
    cloud: 'DevOps',
    ci: 'DevOps',
    cd: 'DevOps',
    ai: 'AI/ML',
    ml: 'AI/ML',
    llm: 'AI/ML',
    langchain: 'AI/ML',
    'lang graph': 'AI/ML',
    rag: 'AI/ML',
    'copilotkit': 'AI/ML',
    'vector search': 'AI/ML',
    postgresql: 'Databases',
    pgvector: 'Databases', // maps to Databases but could be AI/ML too
    redis: 'Databases',
    mongodb: 'Databases',
    neo4j: 'Databases',
    database: 'Databases',
    sql: 'Databases',
  }

  for (const item of skillItems) {
    const label = (item.label ?? '').toLowerCase()
    const val = (item.value ?? '').toLowerCase()
    const tags = (item.tags ?? []).map((t) => (t ?? '').toLowerCase())

    // Determine proficiency weight
    let weight = 70 // default
    if (val.includes('expert') || tags.some((t) => t.includes('expert'))) weight = 90
    else if (val.includes('advanced')) weight = 75
    else if (val.includes('intermediate')) weight = 55
    else if (val.includes('beginner')) weight = 30

    // Boost for years
    for (const t of tags) {
      const yr = t.match(/(\d+)\+?\s*years?/)
      if (yr) {
        const years = parseInt(yr[1])
        weight = Math.min(100, weight + years * 2)
        break
      }
    }

    // Find matching bucket
    let matched = false
    for (const [keyword, bucket] of Object.entries(keywordMap)) {
      if (label.includes(keyword) || tags.some((t) => t.includes(keyword))) {
        bucketMap[bucket].push({ skill: item.label ?? '', weight })
        matched = true
        break
      }
    }

    // Heuristic fallback: assign based on value context
    if (!matched) {
      if (val.includes('full') || val.includes('stack')) {
        // Split between frontend and backend
        bucketMap.Frontend.push({ skill: item.label ?? '', weight: weight * 0.6 })
        bucketMap.Backend.push({ skill: item.label ?? '', weight: weight * 0.6 })
      } else {
        // Default to Backend
        bucketMap.Backend.push({ skill: item.label ?? '', weight })
      }
    }
  }

  const axes: RadarAxis[] = []
  for (const [bucketName, items] of Object.entries(bucketMap)) {
    if (items.length === 0) {
      axes.push({ label: bucketName, value: 30, description: 'Not yet rated' })
    } else {
      const avg = Math.round(
        items.reduce((s, i) => s + i.weight, 0) / items.length,
      )
      axes.push({
        label: bucketName,
        value: Math.min(100, avg),
        description: `${items.length} skill${items.length > 1 ? 's' : ''} in this area`,
      })
    }
  }

  // Reorder to match canonical order
  const canonical = ['Backend', 'Frontend', 'DevOps', 'AI/ML', 'Databases']
  const ordered = canonical.map((name) => axes.find((a) => a.label === name)!)
  const benchmark = [70, 65, 60, 50, 65] // Avg. Senior benchmarks

  return { axes: ordered, benchmark }
}
