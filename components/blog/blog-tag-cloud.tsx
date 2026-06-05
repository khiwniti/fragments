import Link from 'next/link'
import { Tag } from 'lucide-react'

interface BlogTagCloudProps {
  tags: { name: string; count: number }[]
}

export function BlogTagCloud({ tags }: BlogTagCloudProps) {
  if (tags.length === 0) return null

  const maxCount = Math.max(...tags.map((t) => t.count), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tags
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const size = Math.max(0.75, tag.count / maxCount)
          return (
            <Link
              key={tag.name}
              href={`/blog/tag/${encodeURIComponent(tag.name)}`}
              className="inline-flex items-center px-2.5 py-1 rounded-md border border-border bg-background text-xs hover:border-primary/30 hover:text-primary transition-colors"
              style={{ fontSize: `${0.75 + size * 0.25}rem` }}
            >
              {tag.name}
              <span className="ml-1.5 text-muted-foreground text-[10px]">
                {tag.count}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
