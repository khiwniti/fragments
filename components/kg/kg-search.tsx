'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Sparkles } from 'lucide-react'

interface SearchResult {
  skill_name: string
  category: string
  confidence: number
  source: string
  evidence?: string
  projects: string[]
  score: number
}

export function KGSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [answer, setAnswer] = useState('')

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/kg/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, top_k: 10 }),
      })
      const data = await res.json()
      setResults(data.skills || [])
      setAnswer(data.answer || '')
    } catch {
      setResults([])
      setAnswer('')
    } finally {
      setLoading(false)
    }
  }, [query])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Ask the knowledge graph... e.g. 'What are my Python skills?'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {answer && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          {answer}
        </p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((r, i) => (
            <Card key={`${r.skill_name}-${i}`} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.skill_name}</span>
                  <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Confidence: {(r.confidence * 100).toFixed(0)}%</span>
                  {r.evidence && <span>· {r.evidence}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
