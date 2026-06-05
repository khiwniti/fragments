export type PostStatus = 'draft' | 'published' | 'archived'
export type PostType = 'article' | 'tutorial' | 'case_study' | 'note' | 'announcement'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string
  body_th: string | null
  cover_image: string | null
  status: PostStatus
  post_type: PostType
  tags: string[]
  series_id: string | null
  author: string
  published_at: string | null
  created_at: string
  updated_at: string
  meta_title: string | null
  meta_description: string | null
  reading_time_minutes: number | null
}

export interface BlogSeries {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image: string | null
  created_at: string
}

export interface BlogTag {
  name: string
  count: number
}

export interface PaginatedPosts {
  posts: BlogPost[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export const POST_TYPE_LABELS: Record<PostType, string> = {
  article: 'Article',
  tutorial: 'Tutorial',
  case_study: 'Case Study',
  note: 'Note',
  announcement: 'Announcement',
}

export const POST_TYPE_COLORS: Record<PostType, string> = {
  article: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  tutorial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  case_study: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  note: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  announcement: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}
