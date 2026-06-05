import { Metadata } from 'next'
import { NavBar } from '@/components/navbar'
import { KGExplorer } from './kg-explorer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Knowledge Graph | khiw.dev',
  description: 'Explore skills, projects, and career narrative from the knowledge graph',
}

export default function KGPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <NavBar
          session={null}
          showLogin={() => {}}
          signOut={() => {}}
          onClear={() => {}}
          canClear={false}
          onSocialClick={() => {}}
          onUndo={() => {}}
          canUndo={false}
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
