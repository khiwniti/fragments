'use client'

import type { SandboxView } from '@/lib/resume-sandbox'
import { useMemo } from 'react'
import { A4Pager, PagerBlock } from './resume/a4-pager'
import {
  ResumeHeaderBlock,
  SectionHeadingBlock,
  SectionItemBlock,
  SheetSkeletonBlock,
  SheetEmptyBlock,
} from './resume/a4-blocks'

export function ResumeArtifact({
  view,
  isLoading,
}: {
  view?: SandboxView
  isLoading?: boolean
}) {
  const blocks: PagerBlock[] = useMemo(() => {
    const out: PagerBlock[] = [
      { key: 'header', kind: 'header', element: <ResumeHeaderBlock /> },
    ]

    const sections = (view?.sections ?? []).filter(
      (section) => section?.items && section.items.length > 0,
    )

    if (sections.length === 0) {
      out.push({
        key: 'placeholder',
        kind: 'item',
        element: isLoading ? <SheetSkeletonBlock /> : <SheetEmptyBlock />,
      })
      return out
    }

    sections.forEach((section, si) => {
      out.push({
        key: `${section.id}-heading`,
        kind: 'heading',
        element: <SectionHeadingBlock title={section.title} />,
      })
      section.items.forEach((item, ii) => {
        out.push({
          key: `${section.id}-item-${ii}`,
          kind: 'item',
          element: <SectionItemBlock item={item} />,
        })
      })
    })
    return out
  }, [view, isLoading])

  return <A4Pager blocks={blocks} />
}
