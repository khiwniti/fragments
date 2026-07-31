import { Metadata } from 'next'
import { NavBar } from '@/components/navbar'
import { KGExplorer } from './kg-explorer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Knowledge Graph | khiw.dev',
  description: 'Explore skills, projects, and career narrative from the knowledge graph',
}

export default function KGPage() {
  function navigateToChat() {
    if (typeof window !== 'undefined') window.location.href = '/chat'
  }
  function handleSocialClick(target: 'github' | 'x') {
    if (target === 'github') window.open('https://github.com/getintheq', '_blank')
    else if (target === 'x') window.open('https://x.com/ikkyuu01', '_blank')
  }
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <NavBar
          session={null}
          showLogin={navigateToChat}
          signOut={() => {}}
          onSocialClick={handleSocialClick}
        />
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Graph</h1>
          <p className="text-muted-foreground max-w-2xl">
            A structured graph of skills, projects, technologies, and career evidence 
            built from resume data, GitHub, and deployment history.
          </p>
        </div>
        <KGExplorer />
      </div>
    </main>
  )
}
