import { getPostBySlug, getAdjacentPosts } from '@/lib/blog/client'
import { getPublishedPosts } from '@/lib/blog/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BlogMarkdown } from '@/components/blog/blog-markdown'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import Link from 'next/link'
import { SmartImage } from '@/components/ui/smart-image'
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, User } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const { posts } = await getPublishedPosts(1, {})
    return posts.map((post) => ({ slug: post.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: `${post.title} — khiw.dev`,
    description: post.excerpt || post.meta_description || undefined,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.meta_title || post.title,
      description: post.excerpt || undefined,
      type: 'article',
      publishedTime: post.published_at || undefined,
      authors: [post.author],
      tags: post.tags,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post || post.status !== 'published') {
    notFound()
  }

  const [{ posts: relatedPosts }, { prev, next }] = await Promise.all([
    getPublishedPosts(1, { tag: post.tags?.[0] }),
    getAdjacentPosts(slug),
  ])

  const related = relatedPosts.filter((p) => p.id !== post.id).slice(0, 3)

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <main className="min-h-screen bg-background">
      <article className="max-w-3xl mx-auto px-4 py-12">
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

        {/* Post header */}
        <header className="mb-10 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {post.post_type}
            </Badge>
            {post.tags?.map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                <Badge variant="secondary" className="text-xs hover:bg-accent cursor-pointer">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            {publishedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {publishedDate}
              </span>
            )}
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
        </header>

        {/* Cover image */}
        {post.cover_image && (
          <div className="mb-10 rounded-xl overflow-hidden border border-border relative">
            <SmartImage
              src={post.cover_image}
              alt={post.title}
              fill
              unoptimized
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        {/* Body */}
        <div className="prose prose-invert max-w-none">
          <BlogMarkdown content={post.body} />
        </div>

        {/* TH body */}
        {post.body_th && (
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">ภาษาไทย</h2>
            <div className="prose prose-invert max-w-none">
              <BlogMarkdown content={post.body_th} />
            </div>
          </div>
        )}

        {/* Footer tags */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Adjacent posts */}
        <div className="mt-12 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
          {prev && (
            <Link href={`/blog/${prev.slug}`} className="group">
              <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Previous</span>
                <p className="font-medium mt-1 group-hover:text-primary transition-colors line-clamp-2">
                  {prev.title}
                </p>
              </div>
            </Link>
          )}
          {next && (
            <Link href={`/blog/${next.slug}`} className="group md:text-right">
              <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Next</span>
                <p className="font-medium mt-1 group-hover:text-primary transition-colors line-clamp-2">
                  {next.title}
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-6">Related Posts</h3>
            <div className="grid gap-4">
              {related.map((p) => (
                <BlogPostCard key={p.id} post={p} compact />
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  )
}
