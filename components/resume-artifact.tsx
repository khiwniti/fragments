'use client'

import { ResumeContentSchema } from '@/lib/schema'
import { DeepPartial } from 'ai'
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
  content,
  isLoading,
}: {
  content?: DeepPartial<ResumeContentSchema>
  isLoading?: boolean
}) {
  const blocks: PagerBlock[] = useMemo(() => {
    const out: PagerBlock[] = [
      { key: 'header', kind: 'header', element: <ResumeHeaderBlock /> },
    ]

    const sections = (content?.sections ?? []).filter(
      (section) => section?.items?.length,
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
        key: `s${si}-heading`,
        kind: 'heading',
        element: <SectionHeadingBlock title={section!.title} />,
      })
      ;(section!.items ?? [])
        .filter((item): item is NonNullable<typeof item> => !!item)
        .forEach((item, ii) => {
          out.push({
            key: `s${si}-item${ii}`,
            kind: 'item',
            element: <SectionItemBlock item={item} />,
          })
        })
    })
    return out
  }, [content, isLoading])

  return <A4Pager blocks={blocks} />
}
