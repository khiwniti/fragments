import { notFound, redirect } from 'next/navigation'
import { ProjectFocusProvider } from '@/components/project-focus-panel'
import { STATIC_PROJECTS } from '@/components/landing/data'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * Derive a slug from a STATIC_PROJECTS `name` so list links and detail URLs agree.
 * Used both here (to look up the project) and in `generateStaticParams` below.
 */
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Try STATIC_PROJECTS first (the branch's source of truth for these detail pages).
 * For Supabase-only slugs that aren't in STATIC_PROJECTS, fall back to the
 * `/projects` list rather than 404'ing — preserves the list page's deep links.
 */
function findStaticProject(slug: string) {
  return STATIC_PROJECTS.find((p) => slugify(p.name) === slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = findStaticProject(slug)
  if (!project) return { title: 'Project Not Found' }
  return {
    title: `${project.name} — Project Focus`,
    description: project.description,
  }
}

export async function generateStaticParams() {
  return STATIC_PROJECTS.map((p) => ({ slug: slugify(p.name) }))
}

export default async function ProjectFocusPage({ params }: Props) {
  const { slug } = await params
  const project = findStaticProject(slug)

  // Static-only surface today; Supabase-only slugs fall back to the list.
  // (Future: merge Supabase.getProjectBySlug into a unified detail surface.)
  if (!project) redirect('/projects')

  return (
    <ProjectFocusProvider
      project={{
        name: project.name,
        description: project.description,
        tag: project.tag,
        url: project.url,
      }}
    />
  )
}
