'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Cpu, Eye } from 'lucide-react'

interface Skill {
  skill_name: string
  category: string
  confidence: number
  evidence?: string
  projects: string[]
}

export function KGSkills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [evidenceMap, setEvidenceMap] = useState<Record<string, any[]>>({})

  useEffect(() => {
    fetch('/api/kg/skills?limit=50')
      .then((r) => r.json())
      .then((d) => {
        setSkills(d.skills || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function loadEvidence(skillName: string) {
    if (evidenceMap[skillName]) return
    try {
      const res = await fetch(`/api/kg/skills/${encodeURIComponent(skillName)}/evidence`)
      const data = await res.json()
      setEvidenceMap((prev) => ({ ...prev, [skillName]: data.evidence || [] }))
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {skills.map((s) => (
        <Card key={s.skill_name} className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="font-medium">{s.skill_name}</span>
              </div>
              <Badge variant="outline" className="text-xs">{s.category}</Badge>
            </div>
            <Progress value={s.confidence * 100} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{(s.confidence * 100).toFixed(0)}% confidence</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-xs"
                onClick={() => loadEvidence(s.skill_name)}
              >
                <Eye className="h-3 w-3" />
                Evidence
              </Button>
            </div>
            {evidenceMap[s.skill_name]?.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                {evidenceMap[s.skill_name].slice(0, 3).map((ev: any, i: number) => (
                  <li key={i} className="truncate">
                    · {ev.source || ev.edge_type} (confidence: {(ev.confidence * 100).toFixed(0)}%)
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
