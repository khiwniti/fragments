import { Metadata } from 'next'
import { getProjects } from '@/lib/portfolio/client'
import { NavBar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, GitBranch } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projects | khiw.dev',
  description: '50+ deployed projects across AI agents, weather, BIM, hospitality, and more.',
}

export default async function ProjectsPage() {
  const projects = await getProjects()

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
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground max-w-2xl">
            50+ deployed projects on Vercel and 47 Cloudflare Workers in production.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="group">
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {p.name}
                    </CardTitle>
                    {p.github_url && (
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {p.tagline_en && (
                    <p className="text-sm text-muted-foreground">{p.tagline_en}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {p.description_en && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description_en}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {p.tech_stack?.slice(0, 5).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{p.platform}</Badge>
                    {p.live_url && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Live
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
