export interface Profile {
  id: string
  slug: string
  full_name_en: string
  full_name_th: string | null
  display_name: string
  title_en: string
  title_th: string | null
  tagline_en: string | null
  tagline_th: string | null
  bio_short_en: string | null
  bio_short_th: string | null
  bio_long_en: string | null
  bio_long_th: string | null
  email: string | null
  phone: string | null
  location_en: string | null
  location_th: string | null
  available: boolean
  socials: Record<string, string>
  stats: Record<string, number>
  og_image_url: string | null
  resume_url: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Career {
  id: string
  profile_id: string
  title_en: string
  title_th: string | null
  company_en: string
  company_th: string | null
  company_url: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  is_concurrent: boolean
  description_en: string | null
  description_th: string | null
  achievements: Array<Record<string, unknown>>
  employment_type: string | null
  industry: string | null
  location_en: string | null
  skills_used: string[]
  highlight: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  profile_id: string
  name: string
  slug: string
  description_en: string | null
  description_th: string | null
  tagline_en: string | null
  live_url: string | null
  github_url: string | null
  vercel_slug: string | null
  category: string | null
  framework: string | null
  tech_stack: string[]
  status: string
  is_showcase: boolean
  platform: string | null
  custom_domain: string | null
  thumbnail_url: string | null
  screenshots: string[]
  readme_md: string | null
  client_en: string | null
  client_th: string | null
  metrics: Record<string, unknown>
  sort_order: number
  featured_at: string | null
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  profile_id: string
  slug: string
  name: string
  category: string | null
  level: string | null
  years_used: number | null
  icon_url: string | null
  sort_order: number
  is_featured: boolean
  created_at: string
}

export interface Domain {
  id: string
  profile_id: string
  slug: string
  name_en: string
  name_th: string | null
  icon: string | null
  description_en: string | null
  description_th: string | null
  key_tech: string[]
  sort_order: number
  created_at: string
}

export interface EducationItem {
  id: string
  profile_id: string
  degree_en: string
  degree_th: string | null
  institution_en: string
  institution_th: string | null
  field_en: string | null
  field_th: string | null
  start_year: number | null
  end_year: number | null
  gpa: number | null
  honors_en: string | null
  sort_order: number
  created_at: string
}

export interface Certification {
  id: string
  profile_id: string
  name_en: string
  name_th: string | null
  issuer: string | null
  issue_date: string | null
  expiry_date: string | null
  credential_url: string | null
  sort_order: number
  created_at: string
}

export interface WorkerItem {
  id: string
  profile_id: string
  name: string
  category: string | null
  description_en: string | null
  worker_url: string | null
  created_at: string
  updated_at: string
}

export type PortfolioStats = Record<string, number>
