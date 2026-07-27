import { BlogPost } from '@/lib/blog/types'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight, Layers } from 'lucide-react'
import { SmartImage } from '@/components/ui/smart-image'

interface BlogPostCardProps {
  post: BlogPost
  compact?: boolean
  seriesSlug?: string | null
}

export function BlogPostCard({ post, compact, seriesSlug }: BlogPostCardProps) {
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  if (compact) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {publishedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {publishedDate}
                  </span>
                )}
                {post.reading_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.reading_time_minutes} min
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-200 group">
      {post.cover_image && (
        <Link href={`/blog/${post.slug}`}>
          <div className="h-48 overflow-hidden relative">
            <SmartImage
              src={post.cover_image}
              alt={post.title}
              fill
              unoptimized
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>
      )}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {post.post_type}
          </Badge>
          {seriesSlug && (
            <Link href={`/blog/series/${seriesSlug}`}>
              <Badge variant="secondary" className="text-xs hover:bg-accent cursor-pointer gap-1">
                <Layers className="w-3 h-3" />
                Series
              </Badge>
            </Link>
          )}
          {post.tags?.slice(0, 3).map((tag) => (
            <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
              <Badge variant="secondary" className="text-xs hover:bg-accent cursor-pointer">
                {tag}
              </Badge>
            </Link>
          ))}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {publishedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {publishedDate}
              </span>
            )}
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Read
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  )
}
