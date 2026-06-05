'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Search, Sparkles } from 'lucide-react'

interface SEOPanelProps {
  metaTitle: string
  metaDescription: string
  slug: string
  onMetaTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
  onSlugChange: (v: string) => void
  onGenerateSEO?: () => void
}

export function SEOPanel({
  metaTitle,
  metaDescription,
  slug,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onSlugChange,
  onGenerateSEO,
}: SEOPanelProps) {
  const titleLength = metaTitle.length
  const descLength = metaDescription.length
  const titleOk = titleLength >= 30 && titleLength <= 60
  const descOk = descLength >= 120 && descLength <= 160

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">SEO</h3>
        </div>
        {onGenerateSEO && (
          <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={onGenerateSEO}>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Auto-fill
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-title">Meta Title</Label>
          <Badge variant={titleOk ? 'outline' : 'secondary'} className="text-[10px]">
            {titleLength}/60
          </Badge>
        </div>
        <Input
          id="meta-title"
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder="SEO title..."
        />
        {!titleOk && metaTitle && (
          <p className="text-xs text-muted-foreground">
            {titleLength < 30 ? 'Too short' : 'Too long'} — aim for 30–60 characters
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-description">Meta Description</Label>
          <Badge variant={descOk ? 'outline' : 'secondary'} className="text-[10px]">
            {descLength}/160
          </Badge>
        </div>
        <Textarea
          id="meta-description"
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="SEO description..."
          rows={3}
        />
        {!descOk && metaDescription && (
          <p className="text-xs text-muted-foreground">
            {descLength < 120 ? 'Too short' : 'Too long'} — aim for 120–160 characters
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="url-friendly-slug"
        />
      </div>
    </div>
  )
}
