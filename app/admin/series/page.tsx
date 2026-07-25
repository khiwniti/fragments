'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { BlogSeries } from '@/lib/blog/types'
import { Plus, PenLine, Trash2, Layers } from 'lucide-react'

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<BlogSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSeries()
  }, [])

  async function fetchSeries() {
    try {
      const res = await fetch('/api/admin/series')
      const data = await res.json()
      setSeries(data.series || [])
    } catch (error) {
      console.error('Failed to fetch series:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/series/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSeries((prev) => prev.filter((s) => s.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete series:', error)
    }
  }

  const filtered = series.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Series</h1>
          <p className="text-muted-foreground">Manage blog series and collections.</p>
        </div>
        <Link href="/admin/series/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Series
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search series..."
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Description</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No series found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{s.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {s.slug}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground max-w-xs truncate">
                      {s.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/series/${s.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-11 w-11">
                            <PenLine className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/blog/series/${s.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-11 w-11">
                            <Layers className="w-4 h-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete series?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{s.title}&quot;. Posts in this series will remain but be ungrouped.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(s.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
