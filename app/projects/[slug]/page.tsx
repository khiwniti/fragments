import { notFound } from 'next/navigation'
import { ProjectFocusProvider } from '@/components/project-focus-panel'
import { STATIC_PROJECTS } from '@/components/landing/data'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = STATIC_PROJECTS.find(
    (p) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug,
  )
  if (!project) return { title: 'Project Not Found' }
  return {
    title: `${project.name} — Project Focus`,
    description: project.description,
  }
}

export async function generateStaticParams() {
  return STATIC_PROJECTS.map((p) => ({
    slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }))
}

export default async function ProjectFocusPage({ params }: Props) {
  const { slug } = await params
  const project = STATIC_PROJECTS.find(
    (p) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug,
  )

  if (!project) {
    notFound()
  }

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
