'use client'

import { useMemo, useState } from 'react'
import { GitCommit, GitFork, Eye, Calendar } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

export interface DayData {
  date: Date
  count: number
}

/** 53 weeks × 7 days each, Sunday-starting. */
export type ContributionGrid = DayData[][]

export interface ContributionHeatmapProps {
  /** 53-week contribution grid. Auto-generated from profile data if omitted. */
  data?: ContributionGrid
  /** Total stats, shown above the grid. */
  stats?: {
    totalCommits: number
    totalPRs: number
    currentStreak: number
  }
}

// ── Color scale ──────────────────────────────────────────────────────────
// HEATMAP PALETTE — fixed by design.
// The GitHub Contribution Graph palette is a globally-recognized visual
// convention; substituting Bio Emerald would break recognition and read as
// arbitrary. Documented exception to the "one accent" rule, parallel to the
// A4-sheet print palette documented in DESIGN.md.

const EMPTY_COLOR = '#ebedf0'
const LEVEL_COLORS = [
  '#9be9a8', // 1-3
  '#40c463', // 4-7
  '#30a14e', // 8-15
  '#216e39', // 16+
]

function getColor(count: number): string {
  if (count <= 0) return EMPTY_COLOR
  if (count <= 3) return LEVEL_COLORS[0]
  if (count <= 7) return LEVEL_COLORS[1]
  if (count <= 15) return LEVEL_COLORS[2]
  return LEVEL_COLORS[3]
}

function getLevel(count: number): number {
  if (count <= 0) return 0
  if (count <= 3) return 1
  if (count <= 7) return 2
  if (count <= 15) return 3
  return 4
}

// ── Simulated data generator ─────────────────────────────────────────────
// Generates realistic-looking contribution data for the past 53 weeks.

interface ContributionProfile {
  /** Daily commit chance (0-1). Higher = more active. */
  avgDailyChance: number
  /** Weekend reduction factor. */
  weekendFactor: number
  /** Active streak months (0-1 where 1 = always active). */
  streakFactor: number
  /** Max commits on a busy day. */
  maxDaily: number
}

const DEFAULT_PROFILE: ContributionProfile = {
  avgDailyChance: 0.35,
  weekendFactor: 0.25,
  streakFactor: 0.85,
  maxDaily: 18,
}

/** Weighted random — some days spike higher. */
function randomCount(profile: ContributionProfile): number {
  const r = Math.random()
  if (r < 0.4) return 0
  if (r < 0.65) return Math.floor(Math.random() * 4) + 1
  if (r < 0.85) return Math.floor(Math.random() * 8) + 4
  if (r < 0.95) return Math.floor(Math.random() * 16) + 8
  return Math.floor(Math.random() * profile.maxDaily) + 16
}

export function generateSimulatedData(
  profile?: Partial<ContributionProfile>,
): ContributionGrid {
  const p = { ...DEFAULT_PROFILE, ...profile }
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the most recent Sunday (start of current week)
  const latestSunday = new Date(today)
  latestSunday.setDate(latestSunday.getDate() - latestSunday.getDay())

  // Go back 53 weeks
  const grid: ContributionGrid = []
  for (let w = 52; w >= 0; w--) {
    const weekStart = new Date(latestSunday)
    weekStart.setDate(weekStart.getDate() - w * 7)
    const week: DayData[] = []

    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + d)

      // Don't generate future dates
      if (date > today) {
        week.push({ date, count: 0 })
        continue
      }

      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      // Boost certain periods to create "streak" appearance
      const monthFactor =
        Math.sin((date.getMonth() / 11) * Math.PI * 2 * p.streakFactor) *
          0.3 +
        0.7

      const dayChance = isWeekend
        ? p.avgDailyChance * p.weekendFactor * monthFactor
        : p.avgDailyChance * monthFactor

      const roll = Math.random()
      week.push({
        date,
        count: roll < dayChance ? randomCount(p) : 0,
      })
    }
    grid.push(week)
  }

  return grid
}

/** Compute stats from the grid. */
function computeStats(grid: ContributionGrid): {
  totalCommits: number
  totalPRs: number
  currentStreak: number
} {
  let totalCommits = 0
  let currentStreak = 0

  // Flatten days in reverse chronological order
  const days: DayData[] = []
  for (let w = grid.length - 1; w >= 0; w--) {
    for (let d = 6; d >= 0; d--) {
      if (grid[w][d]) days.push(grid[w][d])
    }
  }

  for (const day of days) {
    totalCommits += day.count
    if (day.count > 0) currentStreak++
    else break // streak ended
  }

  // Rough PR estimate (~1 PR per 15 commits)
  const totalPRs = Math.max(1, Math.round(totalCommits / 15))

  return { totalCommits, totalPRs, currentStreak }
}

// ── Main Component ───────────────────────────────────────────────────────

const CELL_SIZE = 10
const CELL_GAP = 2
const LABEL_WIDTH = 28
const HEADER_HEIGHT = 16
const AXIS_LABEL_COLOR = 'hsl(var(--muted-foreground))'

export function ContributionHeatmap({
  data: externalData,
  stats: externalStats,
}: ContributionHeatmapProps) {
  const data = useMemo(
    () => externalData ?? generateSimulatedData(),
    [externalData],
  )
  const stats = useMemo(
    () => externalStats ?? computeStats(data),
    [data, externalStats],
  )

  // Month labels (abbreviated, one per column starting a new month)
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    let lastMonth = -1
    data.forEach((week, wi) => {
      // Use the Thursday of the week to determine the month (ISO week standard)
      const thursday = week[4]?.date
      if (thursday && thursday.getMonth() !== lastMonth) {
        lastMonth = thursday.getMonth()
        labels.push({
          col: wi,
          label: thursday.toLocaleString('default', {
            month: 'short',
          }),
        })
      }
    })
    return labels
  }, [data])

  // Day-of-week labels (first column only)
  const dayLabels = useMemo(() => {
    const labels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
    return labels.map((l, i) => ({ row: i, label: l })).filter((l) => l.label)
  }, [])

  const W = data.length * (CELL_SIZE + CELL_GAP) + LABEL_WIDTH
  const H = 7 * (CELL_SIZE + CELL_GAP) + HEADER_HEIGHT

  return (
    <div className="print:inline-block">
      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 mb-2.5 text-[10px] text-muted-foreground print:text-[9px] print:text-black">
        <span className="flex items-center gap-1 font-medium">
          <GitCommit className="h-3 w-3 text-muted-foreground-dim" />
          <span className="text-foreground font-semibold">
            {stats.totalCommits.toLocaleString()}
          </span>{' '}
          commits
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3 text-muted-foreground-dim" />
          <span className="text-foreground font-semibold">
            {stats.totalPRs}
          </span>{' '}
          PRs merged
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3 text-muted-foreground-dim" />
          <span className="text-foreground font-semibold">
            {stats.currentStreak}
          </span>
          -day streak
        </span>
      </div>

      {/* ── SVG Grid ────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="overflow-visible"
          role="img"
          aria-label={`GitHub contribution heatmap: ${stats.totalCommits} commits over the past year`}
        >
          {/* Month labels */}
          {monthLabels.map((m) => (
            <text
              key={`month-${m.col}`}
              x={LABEL_WIDTH + m.col * (CELL_SIZE + CELL_GAP)}
              y={10}
              fontSize={8}
              fill={AXIS_LABEL_COLOR}
              fontFamily="sans-serif"
              className="print:fill-black/60"
            >
              {m.label}
            </text>
          ))}

          {/* Day-of-week labels */}
          {dayLabels.map((d) => (
            <text
              key={`day-${d.row}`}
              x={LABEL_WIDTH - 4}
              y={HEADER_HEIGHT + d.row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 + 3}
              textAnchor="end"
              fontSize={8}
              fill={AXIS_LABEL_COLOR}
              fontFamily="sans-serif"
              className="print:fill-black/60"
            >
              {d.label}
            </text>
          ))}

          {/* Contribution cells */}
          {data.map((week, wi) =>
            week.map((day, di) => {
              const cx = LABEL_WIDTH + wi * (CELL_SIZE + CELL_GAP)
              const cy = HEADER_HEIGHT + di * (CELL_SIZE + CELL_GAP)
              const color = getColor(day.count)
              const level = getLevel(day.count)

              // 44px hit target centered on 10px cell
              const hitOffset = 17 // (44 - 10) / 2
              return (
                <g key={`cell-${wi}-${di}`}>
                  <rect
                    x={cx}
                    y={cy}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2}
                    fill={color}
                    className="cursor-pointer transition-all duration-75 hover:brightness-90 print:stroke-black/20 heatmap-cell"
                    stroke={
                      level > 0 ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.06)'
                    }
                    strokeWidth={0.5}
                    data-tip={`${day.count} commit${day.count !== 1 ? 's' : ''} · ${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${day.count} commit${day.count !== 1 ? 's' : ''} on ${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`}
                  />
                  {/* 44px invisible hit target */}
                  <rect
                    x={cx - hitOffset}
                    y={cy - hitOffset}
                    width={44}
                    height={44}
                    fill="transparent"
                    pointerEvents="all"
                  />
                </g>
              )
            }),
          )}
        </svg>

      </div>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-muted-foreground-dim print:text-[8px] print:text-black/60">
        <span>Less</span>
        {[0, 1, 3, 8, 16].map((n) => (
          <span
            key={n}
            className="inline-block h-2.5 w-2.5 rounded-[3px] border border-black/5 print:border-black/20"
            style={{ backgroundColor: getColor(n) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
