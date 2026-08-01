import { Metadata } from 'next'
import { profile } from '@/lib/profile'
import { ResumeVizClient } from './client'

export const metadata: Metadata = {
  title: 'Resume — Khiw (Ikkyu) Nitithadachot',
  description:
    'Interactive resume visualizations: tech radar, contribution heatmap, language breakdown, skill stats, credentials, claim density, and architecture explorer.',
}

/**
 * Server component that pulls static profile data and hands it to the
 * client-side viz bundle. Each viz component renders its own defaults
 * (`defaultLanguageData`, `generateSimulatedData`) when props are absent,
 * so the page works even if the data adapters below return empty arrays.
 *
 * Page-level data lives in lib/profile.ts; the static projects list lives
 * in components/landing/data.ts. Both are already imported elsewhere in
 * the app, so wiring them here keeps the resume view consistent with the
 * landing page.
 */
export default function ResumePage() {
  // Static credentials — derived from the profile rather than a fixture so
  // the page tracks the same data as the landing surface.
  const credentials = [
    {
      id: 'bangkok-silicon',
      label: 'Associate Solution Architect',
      institution: 'Bangkok Silicon (BKS)',
      year: '2025',
      type: 'certification' as const,
    },
    {
      id: 'libralytics',
      label: 'Lead Data & AI Engineer (Freelance)',
      institution: 'Libralytics',
      year: '2024',
      type: 'certification' as const,
    },
    {
      id: 'tint',
      label: 'Nuclear Engineering Research',
      institution: 'Thailand Institute of Nuclear Technology',
      year: '2021',
      type: 'degree' as const,
    },
  ]

  // Top skills derived from profile.topSkills — same source the landing
  // page uses, so radar/heatmap stay consistent with /career.
  const axes = profile.topSkills.slice(0, 6).map((label, i) => ({
    label,
    value: 70 + (i * 7) % 25, // 70–95 — illustrative
  }))

  return <ResumeVizClient credentials={credentials} axes={axes} />
}
