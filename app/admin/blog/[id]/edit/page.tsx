'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StudioEditor } from '@/components/admin/studio/studio-editor'
import { SEOPanel } from '@/components/admin/studio/seo-panel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { BlogPost, PostStatus, PostType, POST_TYPE_LABELS } from '@/lib/blog/types'
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react'

export default function AdminEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [postId, setPostId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('<p></p>')
  const [bodyTh, setBodyTh] = useState('<p></p>')
  const [coverImage, setCoverImage] = useState('')
  const [status, setStatus] = useState<PostStatus>('draft')
  const [postType, setPostType] = useState<PostType>('article')
  const [tags, setTags] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function resolveParams() {
      const { id } = await params
      setPostId(id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!postId) return
    async function fetchPost() {
      try {
        const res = await fetch(`/api/admin/posts/${postId}`)
        const data = await res.json()
        const post: BlogPost = data.post
        if (post) {
          setTitle(post.title)
          setSlug(post.slug)
          setExcerpt(post.excerpt || '')
          setBody(post.body || '<p></p>')
          setBodyTh(post.body_th || '<p></p>')
          setCoverImage(post.cover_image || '')
          setStatus(post.status)
          setPostType(post.post_type)
          setTags(post.tags?.join(', ') || '')
          setMetaTitle(post.meta_title || '')
          setMetaDescription(post.meta_description || '')
        }
      } catch (error) {
        console.error('Failed to fetch post:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId])

  function generateSlugFromTitle(t: string) {
    return t
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function handleSave(publish = false) {
    if (!postId) return
    setSaving(true)
    try {
      const finalStatus = publish ? 'published' : status
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || generateSlugFromTitle(title),
          excerpt: excerpt || null,
          body,
          body_th: bodyTh || null,
          cover_image: coverImage || null,
          status: finalStatus,
          post_type: postType,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          meta_title: metaTitle || null,
          meta_description: metaDescription || null,
        }),
      })

      if (res.ok) {
        router.push('/admin/blog')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save post:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateExcerpt() {
    if (!body || body === '<p></p>') return
    setGenerating(true)
    try {
      const text = body.replace(/<[^>]+>/g, ' ').slice(0, 2000)
      const res = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          instruction: 'Write a short engaging excerpt (1-2 sentences) summarizing this article. Keep it under 160 characters.',
        }),
      })
      if (res.ok) {
        const reader = res.body?.getReader()
        if (!reader) return
        let result = ''
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          result += decoder.decode(value, { stream: true })
        }
        result += decoder.decode()
        const clean = result.replace(/^data: /gm, '').replace(/\n/g, '').trim().slice(0, 160)
        setExcerpt(clean)
      }
    } catch (error) {
      console.error('Failed to generate excerpt:', error)
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateCover() {
    if (!title) return
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `A professional, minimal blog cover image for an article titled: "${title}". Clean design with subtle tech patterns.`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) setCoverImage(data.url)
      }
    } catch (error) {
      console.error('Failed to generate cover:', error)
    } finally {
      setGenerating(false)
    }
  }

  const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Post</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || !title}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving || !title}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!slug) setSlug(generateSlugFromTitle(e.target.value))
              }}
              placeholder="Post title..."
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cover">Cover Image</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1"
                onClick={handleGenerateCover}
                disabled={generating || !title}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Generate
              </Button>
            </div>
            <Input
              id="cover"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Image URL"
            />
            {coverImage && (
              <div className="rounded-lg border border-border overflow-hidden h-40">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1"
                onClick={handleGenerateExcerpt}
                disabled={generating || body === '<p></p>'}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Generate
              </Button>
            </div>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary..."
              rows={2}
            />
          </div>

          <Tabs defaultValue="en" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="th">Thai</TabsTrigger>
            </TabsList>
            <TabsContent value="en">
              <StudioEditor content={body} onChange={setBody} placeholder="Write your post..." />
            </TabsContent>
            <TabsContent value="th">
              <StudioEditor content={bodyTh} onChange={setBodyTh} placeholder="เขียนโพสต์..." />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold">Publishing</h3>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {(['draft', 'published', 'archived'] as PostStatus[]).map((s) => (
                  <Button
                    key={s}
                    variant={status === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Post Type</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(POST_TYPE_LABELS) as PostType[]).map((t) => (
                  <Button
                    key={t}
                    variant={postType === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPostType(t)}
                  >
                    {POST_TYPE_LABELS[t]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ai, tutorial, nextjs..."
            />
            <div className="flex flex-wrap gap-1">
              {tagList.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <SEOPanel
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            slug={slug}
            onMetaTitleChange={setMetaTitle}
            onMetaDescriptionChange={setMetaDescription}
            onSlugChange={setSlug}
          />
        </aside>
      </div>
    </div>
  )
}
