'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { SeriesForm } from '@/components/admin/series-form'
import { BlogSeries } from '@/lib/blog/types'

export default function AdminEditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [series, setSeries] = useState<BlogSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [seriesId, setSeriesId] = useState<string>('')

  useEffect(() => {
    async function resolveParams() {
      const { id } = await params
      setSeriesId(id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!seriesId) return
    async function fetchSeries() {
      try {
        const res = await fetch(`/api/admin/series/${seriesId}`)
        const data = await res.json()
        if (data.series) setSeries(data.series)
      } catch (error) {
        console.error('Failed to fetch series:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSeries()
  }, [seriesId])

  async function handleSubmit(data: { slug: string; title: string; description: string | null; cover_image: string | null }) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/series/${seriesId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        router.push('/admin/series')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update series:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">Series not found</h1>
        <p className="text-muted-foreground">This series may have been deleted.</p>
      </div>
    )
  }

  return (
    <SeriesForm
      mode="edit"
      initial={{
        slug: series.slug,
        title: series.title,
        description: series.description,
        cover_image: series.cover_image,
      }}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  )
}
