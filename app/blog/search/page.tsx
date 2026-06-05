'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, X } from 'lucide-react'
import type { BlogPost } from '@/lib/blog/types'

function SearchPageInner() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!query) {
      setPosts([])
      setSearched(false)
      return
    }

    async function fetchResults() {
      setLoading(true)
      setSearched(true)
      try {
        const res = await fetch(`/api/blog/posts?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setPosts(data.posts || [])
      } catch {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const input = (e.currentTarget.querySelector('input') as HTMLInputElement)?.value || ''
          if (!input.trim()) return
          window.location.href = `/blog/search?q=${encodeURIComponent(input.trim())}`
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={query}
            placeholder="Search posts..."
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-8">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        )}
        {!loading && !searched && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Search for posts</p>
            <p className="text-sm">Enter a keyword to find articles, tutorials, and more.</p>
          </div>
        )}
        {!loading && searched && posts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <X className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No results for &quot;{query}&quot;</p>
            <p className="text-sm">Try a different keyword or browse all posts.</p>
          </div>
        )}
        {!loading && posts.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Found {posts.length} result{posts.length !== 1 ? 's' : ''} for &quot;{query}&quot;
            </p>
            <div className="grid gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function BlogSearchPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Search Blog</h1>
        <Suspense fallback={<div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>}>
          <SearchPageInner />
        </Suspense>
      </div>
    </main>
  )
}
