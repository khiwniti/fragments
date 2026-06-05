import { getPublishedPosts, getAllTags, getAllSeries } from '@/lib/blog/client'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { BlogTagCloud } from '@/components/blog/blog-tag-cloud'
import { BlogSearch } from '@/components/blog/blog-search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { POST_TYPE_LABELS } from '@/lib/blog/types'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Rss, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog — khiw.dev',
  description: 'AI, full-stack engineering, and data engineering insights from Ikkyu (Khiw).',
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string; type?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const tag = params.tag
  const type = params.type

  const [{ posts, total, totalPages }, tags, series] = await Promise.all([
    getPublishedPosts(page, { tag, type }),
    getAllTags(),
    getAllSeries(),
  ])

  const typeLabel = type ? POST_TYPE_LABELS[type as keyof typeof POST_TYPE_LABELS] : null

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
            </div>
            <Link href="/blog/feed.xml">
              <Button variant="ghost" size="sm" className="gap-2">
                <Rss className="w-4 h-4" />
                RSS
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground max-w-xl">
            AI, full-stack engineering, and data engineering insights from Ikkyu (Khiw).
          </p>
          <BlogSearch />
        </div>

        {/* Filter badges */}
        {(tag || type) && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            {tag && (
              <Badge variant="secondary" className="gap-1">
                Tag: {tag}
                <Link href="/blog" className="ml-1 hover:text-primary">×</Link>
              </Badge>
            )}
            {typeLabel && (
              <Badge variant="secondary" className="gap-1">
                Type: {typeLabel}
                <Link href="/blog" className="ml-1 hover:text-primary">×</Link>
              </Badge>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts grid */}
          <div className="lg:col-span-2 space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No posts found</p>
                <p className="text-sm">Check back later for new content.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6">
                  {posts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <Link
                      href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ''}${type ? `&type=${type}` : ''}`}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    >
                      <Button variant="ghost" size="sm" disabled={page <= 1}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Link
                      href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ''}${type ? `&type=${type}` : ''}`}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    >
                      <Button variant="ghost" size="sm" disabled={page >= totalPages}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <BlogTagCloud tags={tags} />
            {series.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Series
                </h3>
                <div className="space-y-2">
                  {series.map((s) => (
                    <Link
                      key={s.id}
                      href={`/blog/series/${s.slug}`}
                      className="block text-sm hover:text-primary transition-colors"
                    >
                      {s.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
