'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Network, Link2, FileText, GitBranch, Boxes, Cpu, Code2, Globe } from 'lucide-react'

interface StatsData {
  nodes_total: number
  edges_total: number
  evidence_total: number
  [key: string]: number
}

const iconMap: Record<string, React.ReactNode> = {
  'node:repo': <GitBranch className="h-4 w-4" />,
  'node:project': <Boxes className="h-4 w-4" />,
  'node:skill': <Cpu className="h-4 w-4" />,
  'node:technology': <Code2 className="h-4 w-4" />,
  'node:deployment': <Globe className="h-4 w-4" />,
  'node:file': <FileText className="h-4 w-4" />,
}

export function KGStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/kg/metrics')
      .then((r) => r.json())
      .then((d) => {
        setStats(d.graph)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const topCounts = Object.entries(stats)
    .filter(([k]) => k.startsWith('node:'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Network className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.nodes_total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Nodes</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Link2 className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.edges_total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Edges</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.evidence_total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Evidence</p>
          </div>
        </CardContent>
      </Card>
      {topCounts.map(([key, count]) => (
        <Card key={key}>
          <CardContent className="p-4 flex items-center gap-3">
            {iconMap[key] || <Boxes className="h-8 w-8 text-primary" />}
            <div>
              <p className="text-2xl font-bold">{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {key.replace('node:', '').replace(/_/g, ' ')}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
