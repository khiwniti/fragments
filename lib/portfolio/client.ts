import { supabase } from '@/lib/supabase'
import { Profile, Career, Project, Skill, Domain, EducationItem, Certification, WorkerItem } from './types'

function getClient() {
  if (!supabase) throw new Error('Supabase client is not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  return supabase
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await getClient().from('profiles').select('*').eq('slug', 'ikkyu').single()
  if (error) { console.error('getProfile error:', error.message); return null }
  return data as Profile
}

export async function getCareers(): Promise<Career[]> {
  const { data, error } = await getClient()
    .from('careers')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) { console.error('getCareers error:', error.message); return [] }
  return (data || []) as Career[]
}

export async function getProjects(opts?: { showcaseOnly?: boolean; status?: string; category?: string; limit?: number }): Promise<Project[]> {
  let q = getClient().from('projects').select('*').order('sort_order', { ascending: true })
  if (opts?.showcaseOnly) q = q.eq('is_showcase', true)
  if (opts?.status) q = q.eq('status', opts.status)
  if (opts?.category) q = q.eq('category', opts.category)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) { console.error('getProjects error:', error.message); return [] }
  return (data || []) as Project[]
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await getClient().from('projects').select('*').eq('slug', slug).single()
  if (error) { console.error('getProjectBySlug error:', error.message); return null }
  return data as Project
}

export async function getSkills(opts?: { featuredOnly?: boolean; category?: string }): Promise<Skill[]> {
  let q = getClient().from('skills').select('*').order('sort_order', { ascending: true })
  if (opts?.featuredOnly) q = q.eq('is_featured', true)
  if (opts?.category) q = q.eq('category', opts.category)
  const { data, error } = await q
  if (error) { console.error('getSkills error:', error.message); return [] }
  return (data || []) as Skill[]
}

export async function getDomains(): Promise<Domain[]> {
  const { data, error } = await getClient().from('domains').select('*').order('sort_order', { ascending: true })
  if (error) { console.error('getDomains error:', error.message); return [] }
  return (data || []) as Domain[]
}

export async function getDomainBySlug(slug: string): Promise<Domain | null> {
  const { data, error } = await getClient().from('domains').select('*').eq('slug', slug).single()
  if (error) { console.error('getDomainBySlug error:', error.message); return null }
  return data as Domain
}

export async function getEducation(): Promise<EducationItem[]> {
  const { data, error } = await getClient().from('education').select('*').order('sort_order', { ascending: true })
  if (error) { console.error('getEducation error:', error.message); return [] }
  return (data || []) as EducationItem[]
}

export async function getCertifications(): Promise<Certification[]> {
  const { data, error } = await getClient().from('certifications').select('*').order('sort_order', { ascending: true })
  if (error) { console.error('getCertifications error:', error.message); return [] }
  return (data || []) as Certification[]
}

export async function getWorkers(): Promise<WorkerItem[]> {
  const { data, error } = await getClient().from('workers').select('*').order('name', { ascending: true })
  if (error) { console.error('getWorkers error:', error.message); return [] }
  return (data || []) as WorkerItem[]
}

export async function getPortfolioStats(): Promise<Record<string, number>> {
  const profile = await getProfile()
  return profile?.stats || {}
}
