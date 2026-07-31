import { Metadata } from 'next'
import { getProfile, getCareers, getEducation, getCertifications, getSkills } from '@/lib/portfolio/client'
import { NavBar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Briefcase, GraduationCap, Award, MapPin, Mail, Globe, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About | khiw.dev',
  description: 'Khiw (Ikkyu) Nitithadachot — AI Agent Architect & Full-Stack Developer',
}

function formatDateRange(start: string, end: string | null, current: boolean) {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  const e = current ? 'Present' : end ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'
  return `${s} – ${e}`
}

export default async function AboutPage() {
  const profile = await getProfile()
  const careers = await getCareers()
  const education = await getEducation()
  const certifications = await getCertifications()
  const skills = await getSkills({ featuredOnly: true })

  function navigateToChat() {
    if (typeof window !== 'undefined') window.location.href = '/chat'
  }
  function handleSocialClick(target: 'github' | 'x') {
    if (target === 'github') window.open('https://github.com/getintheq', '_blank')
    else if (target === 'x') window.open('https://x.com/ikkyuu01', '_blank')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <NavBar
          session={null}
          showLogin={navigateToChat}
          signOut={() => {}}
          onSocialClick={handleSocialClick}
        />

        {/* Hero */}
        <section className="py-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            {profile?.full_name_en || 'Khiw (Ikkyu) Nitithadachot'}
          </h1>
          <p className="text-xl text-muted-foreground">{profile?.title_en}</p>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            {profile?.bio_short_en}
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {profile?.location_en && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {profile.location_en}
              </span>
            )}
            {profile?.email && (
              <Link href={`mailto:${profile.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" /> {profile.email}
              </Link>
            )}
            {profile?.available && (
              <span className="flex items-center gap-1 text-green-500">
                <Clock className="h-4 w-4" /> Available for consulting
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((s) => (
              <Badge key={s.slug} variant="secondary">{s.name}</Badge>
            ))}
          </div>
        </section>

        {/* Bio */}
        {profile?.bio_long_en && (
          <section className="py-8">
            <Card>
              <CardContent className="p-6 prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: profile.bio_long_en.replace(/\n/g, '<br/>') }} />
              </CardContent>
            </Card>
          </section>
        )}

        <Separator />

        {/* Careers */}
        <section className="py-8 space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Experience
          </h2>
          <div className="space-y-4">
            {careers.map((c) => (
              <Card key={c.id} className={c.highlight ? 'border-primary/30' : undefined}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{c.title_en}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {c.company_en}
                        {c.company_url && (
                          <Link href={c.company_url} target="_blank" className="ml-2 text-primary hover:underline">
                            <Globe className="h-3 w-3 inline" />
                          </Link>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDateRange(c.start_date, c.end_date, c.is_current)}
                    </Badge>
                  </div>
                </CardHeader>
                {c.description_en && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{c.description_en}</p>
                    {c.skills_used?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.skills_used.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Education */}
        <section className="py-8 space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Education
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {education.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4 space-y-1">
                  <p className="font-medium">{e.degree_en}</p>
                  <p className="text-sm text-muted-foreground">{e.institution_en}</p>
                  {e.field_en && <p className="text-xs text-muted-foreground">{e.field_en}</p>}
                  <p className="text-xs text-muted-foreground">
                    {e.start_year} – {e.end_year || 'Present'}
                    {e.gpa && ` · GPA ${e.gpa}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="py-8 space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Award className="h-5 w-5" /> Certifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 space-y-1">
                    <p className="font-medium">{c.name_en}</p>
                    <p className="text-sm text-muted-foreground">{c.issuer}</p>
                    {c.issue_date && (
                      <p className="text-xs text-muted-foreground">
                        Issued: {new Date(c.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
