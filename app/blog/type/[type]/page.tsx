import { getPublishedPosts } from '@/lib/blog/client'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { Button } from '@/components/ui/button'
import { POST_TYPE_LABELS } from '@/lib/blog/types'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface TypePageProps {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { type } = await params
  const label = POST_TYPE_LABELS[type as keyof typeof POST_TYPE_LABELS]
  return {
    title: `${label || type} Posts — khiw.dev Blog`,
    description: `Browse all ${label || type} posts.`,
  }
}

export default async function TypePage({ params, searchParams }: TypePageProps) {
  const { type } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))

  const label = POST_TYPE_LABELS[type as keyof typeof POST_TYPE_LABELS]
  if (!label) notFound()

  const { posts, total, totalPages } = await getPublishedPosts(page, { type })

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to blog
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">{label} Posts</h1>
          <span className="text-sm text-muted-foreground">({total} posts)</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No posts found in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Link
                  href={`/blog/type/${type}?page=${page - 1}`}
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
                  href={`/blog/type/${type}?page=${page + 1}`}
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
      </div>
    </main>
  )
}
