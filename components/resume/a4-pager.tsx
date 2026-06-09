'use client'

/* A4 PRINT PALETTE — fixed by design */

import {
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

// ── A4 geometry (210 × 297 mm @ 96 dpi) ─────────────────────────────────
export const A4_WIDTH = 794
export const A4_HEIGHT = 1123
export const A4_PADDING = 48 // ~12 mm margins
export const A4_CONTENT_WIDTH = A4_WIDTH - A4_PADDING * 2 // 698
export const A4_CONTENT_HEIGHT = A4_HEIGHT - A4_PADDING * 2 // 1027

/** Vertical gap inserted between blocks within a page. */
const BLOCK_GAP = 12

export interface PagerBlock {
  /** Stable unique key — also used to look up measured height. */
  key: string
  kind: 'header' | 'heading' | 'item'
  element: ReactNode
}

/**
 * Greedy packing of blocks into A4 pages.
 *
 * Rules:
 * - Blocks fill a page top-down until the next block would overflow.
 * - A `heading` is never orphaned: if heading + its first item don't both
 *   fit on the current page, the heading moves to the next page.
 * - A single block taller than a full page gets its own page and clips at
 *   the page edge (pathological case — never crash).
 */
export function packBlocks(
  blocks: PagerBlock[],
  heights: Map<string, number>,
): PagerBlock[][] {
  const pages: PagerBlock[][] = []
  let current: PagerBlock[] = []
  let used = 0

  const gapFor = () => (current.length > 0 ? BLOCK_GAP : 0)
  const fits = (h: number) => used + gapFor() + h <= A4_CONTENT_HEIGHT

  const push = (block: PagerBlock, h: number) => {
    used += gapFor() + h
    current.push(block)
  }

  const breakPage = () => {
    if (current.length > 0) pages.push(current)
    current = []
    used = 0
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const h = heights.get(block.key) ?? 0

    if (block.kind === 'heading') {
      const next = blocks[i + 1]
      const nextH =
        next && next.kind === 'item' ? (heights.get(next.key) ?? 0) : 0
      const pairH = h + (nextH > 0 ? BLOCK_GAP + nextH : 0)
      if (!fits(pairH) && current.length > 0) breakPage()
      push(block, h)
      continue
    }

    if (!fits(h)) {
      if (current.length === 0) {
        // Oversized block on an empty page: keep it alone, let it clip.
        push(block, h)
        breakPage()
        continue
      }
      breakPage()
    }
    push(block, h)
  }
  breakPage()

  return pages.length > 0 ? pages : [[]]
}

/**
 * Renders blocks as stacked, print-ready A4 sheets.
 *
 * - Measures every block in a hidden container at exact A4 content width
 *   (debounced 150 ms via ResizeObserver, so streaming re-paginates live).
 * - Scales sheets with `transform: scale(n)` to fit the panel width; an
 *   explicit-size wrapper compensates because transforms don't affect
 *   layout.
 */
export function A4Pager({ blocks }: { blocks: PagerBlock[] }) {
  const measureRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<Map<string, number>>(new Map())
  const [scale, setScale] = useState(1)

  // ── Measure block heights (re-runs on content change, debounced on
  //    resize of the hidden container, e.g. fonts/images settling) ──────
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const measure = () => {
      const next = new Map<string, number>()
      el.querySelectorAll<HTMLElement>('[data-block-key]').forEach((node) => {
        next.set(node.dataset.blockKey as string, node.offsetHeight)
      })
      setHeights((prev) => {
        if (
          prev.size === next.size &&
          [...next].every(([k, v]) => prev.get(k) === v)
        ) {
          return prev // no change → no re-render loop
        }
        return next
      })
    }

    measure()
    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(measure, 150)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [blocks])

  // ── Scale-to-fit panel width ──────────────────────────────────────────
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const available = el.clientWidth - 48 // canvas breathing room
      setScale(Math.min(1, Math.max(0.2, available / A4_WIDTH)))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pages = useMemo(() => packBlocks(blocks, heights), [blocks, heights])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-y-auto a4-print-root"
    >
      {/* Hidden measurement container at exact A4 content width */}
      <div
        ref={measureRef}
        aria-hidden
        className="absolute -left-[9999px] top-0 pointer-events-none bg-white text-slate-900 print:hidden"
        style={{ width: A4_CONTENT_WIDTH }}
      >
        {blocks.map((b) => (
          <div key={b.key} data-block-key={b.key}>
            {b.element}
          </div>
        ))}
      </div>

      {/* Stacked sheets on the dark canvas */}
      <div className="flex flex-col items-center py-6 print:py-0">
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} className="mb-8 print:mb-0">
            <div
              className="a4-sheet-wrap"
              style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}
            >
              <div
                className="a4-sheet bg-white text-slate-900 shadow-2xl overflow-hidden"
                style={{
                  width: A4_WIDTH,
                  height: A4_HEIGHT,
                  padding: A4_PADDING,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <div className="flex flex-col" style={{ gap: BLOCK_GAP }}>
                  {page.map((b) => (
                    <div key={b.key}>{b.element}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center text-[11px] text-muted-foreground mt-2 print:hidden">
              {pageIndex + 1} / {pages.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
