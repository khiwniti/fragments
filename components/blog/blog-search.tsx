'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function BlogSearch() {
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    window.location.href = `/blog/search?q=${encodeURIComponent(query.trim())}`
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, tutorials..."
          className="pl-10"
        />
      </div>
      <Button type="submit" size="sm">
        Search
      </Button>
    </form>
  )
}
