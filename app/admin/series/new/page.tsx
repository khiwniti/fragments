'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SeriesForm } from '@/components/admin/series-form'

export default function AdminNewSeriesPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(data: { slug: string; title: string; description: string | null; cover_image: string | null }) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        router.push('/admin/series')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to create series:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SeriesForm
      mode="create"
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  )
}
