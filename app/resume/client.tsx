'use client'

import { TechRadar, type RadarAxis } from '@/components/resume/tech-radar'
import { ContributionHeatmap } from '@/components/resume/contribution-heatmap'
import { LanguageChart } from '@/components/resume/language-chart'
import { SkillStatCard } from '@/components/resume/skill-stat-card'
import { CredentialTimeline } from '@/components/resume/credential-timeline'
import { ClaimDensityVisualizer } from '@/components/resume/claim-density'
import { ArchitectureExplorer } from '@/components/resume/architecture-explorer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Credential {
  id: string
  label: string
  institution: string
  year: string
  type?: 'degree' | 'certification'
}

interface ResumeVizClientProps {
  credentials: Credential[]
  axes: RadarAxis[]
}

/**
 * Client-side bundle of the resume viz components. Each viz falls back to
 * its own internal defaults when props are absent, so missing data just
 * leaves a section blank rather than crashing the page.
 *
 * Sections, top-to-bottom:
 * 1. Tech Radar — top skills as axes, profile-derived values
 * 2. Contribution Heatmap — auto-generated from DEFAULT_PROFILE
 * 3. Language Chart — auto-generated from defaultLanguageData()
 * 4. Skill Stat Cards — first 4 from profile.topSkills
 * 5. Credential Timeline — from props
 * 6. Claim Density — empty (no agent state wired here yet)
 * 7. Architecture Explorer — empty (no projects wired yet)
 */
export function ResumeVizClient({ credentials, axes }: ResumeVizClientProps) {
  const skillStats = axes.slice(0, 4).map((axis, i) => {
    // Clamp radar axes so derived dimensions don't go negative for low scores.
    const clamp = (n: number) => Math.max(0, Math.min(100, n))
    return {
      name: axis.label,
      years: `${i + 5} yrs`,
      projectCount: 3 + i,
      evidenceCount: 2 + i,
      radar: {
        breadth: clamp(axis.value),
        depth: clamp(axis.value - 10),
        impact: clamp(axis.value - 20),
      },
      relatedProjects: [],
    }
  })

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground-dim font-mono">
            Resume · interactive
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Skills at a glance</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Live visualizations of the resume. Hover and click the components for
            drill-down. Print-safe.
          </p>
        </header>

        <Separator />

        {/* 1. Tech Radar */}
        <section aria-labelledby="radar-heading">
          <Card>
            <CardHeader>
              <CardTitle id="radar-heading" className="text-base">Tech Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <TechRadar axes={axes} width={360} height={360} />
            </CardContent>
          </Card>
        </section>

        {/* 2. Contribution Heatmap — uses simulated defaults */}
        <section aria-labelledby="heatmap-heading">
          <Card>
            <CardHeader>
              <CardTitle id="heatmap-heading" className="text-base">
                Contribution Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContributionHeatmap />
            </CardContent>
          </Card>
        </section>

        {/* 3. Language Chart — uses defaults */}
        <section aria-labelledby="lang-heading">
          <Card>
            <CardHeader>
              <CardTitle id="lang-heading" className="text-base">Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageChart />
            </CardContent>
          </Card>
        </section>

        {/* 4. Skill Stat Cards */}
        <section aria-labelledby="skills-heading" className="space-y-2">
          <h2 id="skills-heading" className="text-base font-semibold">
            Skill deep-dive
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {skillStats.map((stat) => (
              <SkillStatCard key={stat.name} stat={stat} />
            ))}
          </div>
        </section>

        {/* 5. Credential Timeline */}
        <section aria-labelledby="cred-heading">
          <Card>
            <CardHeader>
              <CardTitle id="cred-heading" className="text-base">
                Credentials & Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CredentialTimeline credentials={credentials} />
            </CardContent>
          </Card>
        </section>

        {/* 6. Claim Density — empty when not driven by an agent */}
        <ClaimDensityVisualizer sections={[]} />

        {/* 7. Architecture Explorer — empty when no projects wired */}
        <ArchitectureExplorer
          architecture={{
            nodes: [],
            edges: [],
            metrics: [],
            decisions: [],
          }}
        />
      </div>
    </main>
  )
}
