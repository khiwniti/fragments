'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, GitBranch, Globe, Boxes } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  source: string
  url: string
  pushed_at: string
  tags: string[]
  type: string
}

export function KGProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/kg/projects?limit=20')
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const iconFor = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'github':
        return <GitBranch className="h-4 w-4" />
      case 'deployment':
        return <Globe className="h-4 w-4" />
      default:
        return <Boxes className="h-4 w-4" />
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((p) => (
        <Card key={p.id} className="hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {iconFor(p.source)}
                {p.name}
              </CardTitle>
              {p.url && (
                <Link href={p.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {p.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {p.tags?.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            {p.pushed_at && (
              <p className="text-xs text-muted-foreground">
                Last active: {new Date(p.pushed_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
