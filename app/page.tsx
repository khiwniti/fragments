'use client'

import { NavBar } from '@/components/navbar'
import { HeroChat } from '@/components/landing/hero-chat'
import { ProjectsWidget } from '@/components/landing/projects-widget'
import { DomainsWidget } from '@/components/landing/domains-widget'
import { SkillsWidget } from '@/components/landing/skills-widget'
import { CareerWidget } from '@/components/landing/career-widget'
import { OpenSourceWidget } from '@/components/landing/open-source-widget'
import { ContactWidget } from '@/components/landing/contact-widget'
import { ScrollIndicator } from '@/components/landing/scroll-indicator'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Session } from '@supabase/supabase-js'

export default function Home() {
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState('sign_in')
  const { session } = useAuth(
    () => setAuthDialog(true),
    (v: string) => setAuthView(v as never),
  )

  function logout() {
    supabase?.auth.signOut()
  }

  function handleSocialClick(target: 'github' | 'x') {
    if (target === 'github') {
      window.open('https://github.com/getintheq', '_blank')
    } else if (target === 'x') {
      window.open('https://x.com/ikkyuu01', '_blank')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[800px] mx-auto">
        <NavBar
          session={session as Session | null}
          showLogin={() => setAuthDialog(true)}
          signOut={logout}
          onSocialClick={handleSocialClick}
        />
      </div>

      <div className="relative">
        <HeroChat />
        <ScrollIndicator />
      </div>

      <ProjectsWidget />
      <DomainsWidget />
      <SkillsWidget />
      <CareerWidget />
      <OpenSourceWidget />
      <ContactWidget />

      <footer className="max-w-[700px] mx-auto px-6 py-8 text-center border-t border-border">
        <p className="text-[11px] text-muted-foreground font-mono">
          Built by Khiw (Ikkyu) Nitithadachot · AI-Augmented Full-Stack Developer
        </p>
        <p className="text-[10px] text-muted-foreground-dim mt-1 font-mono">
          Next.js · Tailwind · TypeScript · Supabase · Cloudflare
        </p>
      </footer>
    </main>
  )
}
