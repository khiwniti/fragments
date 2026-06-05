import { getPostsBySeriesSlug, getSeriesBySlug, getAllSeries } from '@/lib/blog/client'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Layers } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface SeriesPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params
  const series = await getSeriesBySlug(slug)
  if (!series) return { title: 'Not Found' }
  return {
    title: `${series.title} — khiw.dev Blog Series`,
    description: series.description || `Browse all posts in the ${series.title} series.`,
  }
}

export default async function SeriesPage({ params, searchParams }: SeriesPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))

  const [series, { posts, total, totalPages }, allSeries] = await Promise.all([
    getSeriesBySlug(slug),
    getPostsBySeriesSlug(slug, page),
    getAllSeries(),
  ])

  if (!series) notFound()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>
        </div>

        {/* Series header */}
        <header className="mb-10 space-y-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{series.title}</h1>
          </div>
          {series.description && (
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {series.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {total} post{total !== 1 ? 's' : ''}
            </Badge>
          </div>
        </header>

        {/* Cover image */}
        {series.cover_image && (
          <div className="mb-10 rounded-xl overflow-hidden border border-border">
            <img
              src={series.cover_image}
              alt={series.title}
              className="w-full h-56 md:h-72 object-cover"
            />
          </div>
        )}

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No posts in this series yet</p>
            <p className="text-sm">Posts will appear here once they are published.</p>
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
              <div className="flex items-center justify-center gap-4 mt-8">
                <Link
                  href={`/blog/series/${slug}?page=${page - 1}`}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                >
                  <Button variant="ghost" size="sm" disabled={page <= 1}>
                    Previous
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Link
                  href={`/blog/series/${slug}?page=${page + 1}`}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                >
                  <Button variant="ghost" size="sm" disabled={page >= totalPages}>
                    Next
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Other series */}
        {allSeries.length > 1 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Other Series
            </h3>
            <div className="flex flex-wrap gap-2">
              {allSeries
                .filter((s) => s.id !== series.id)
                .map((s) => (
                  <Link key={s.id} href={`/blog/series/${s.slug}`}>
                    <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                      {s.title}
                    </Badge>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
