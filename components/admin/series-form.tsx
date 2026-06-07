'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { BlogSeries } from '@/lib/blog/types'

interface SeriesFormProps {
  mode: 'create' | 'edit'
  initial?: Pick<BlogSeries, 'slug' | 'title' | 'description' | 'cover_image'>
  onSubmit: (data: { slug: string; title: string; description: string | null; cover_image: string | null }) => Promise<void>
  submitting: boolean
}

function generateSlugFromTitle(t: string) {
  return t
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function SeriesForm({ mode, initial, onSubmit, submitting }: SeriesFormProps) {
  const [title, setTitle] = useState(initial?.title || '')
  const [slug, setSlug] = useState(initial?.slug || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [coverImage, setCoverImage] = useState(initial?.cover_image || '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalSlug = slug || generateSlugFromTitle(title)
    if (!title.trim() || !finalSlug) return
    await onSubmit({
      slug: finalSlug,
      title: title.trim(),
      description: description.trim() || null,
      cover_image: coverImage.trim() || null,
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/series">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{mode === 'create' ? 'New Series' : 'Edit Series'}</h1>
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
          {submitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {mode === 'create' ? 'Create Series' : 'Save Changes'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugManuallyEdited) setSlug(generateSlugFromTitle(e.target.value))
            }}
            placeholder="Series title..."
            className="text-lg"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManuallyEdited(true)
            }}
            placeholder="url-friendly-slug"
          />
          <p className="text-xs text-muted-foreground">
            Used in the URL: /blog/series/{slug || 'your-slug-here'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this series about?"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover">Cover Image URL</Label>
          <Input
            id="cover"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
          {coverImage && (
            <div className="rounded-lg border border-border overflow-hidden h-40">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
