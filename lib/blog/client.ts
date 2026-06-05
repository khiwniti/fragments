import { supabase } from '@/lib/supabase'
import { BlogPost, BlogSeries, PaginatedPosts, PostStatus } from './types'

const PAGE_SIZE = 12

export async function getPublishedPosts(
  page = 1,
  options?: {
    tag?: string
    type?: string
    seriesId?: string
    search?: string
  }
): Promise<PaginatedPosts> {
  if (!supabase) return { posts: [], total: 0, page, perPage: PAGE_SIZE, totalPages: 0 }

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (options?.tag) {
    query = query.contains('tags', [options.tag])
  }
  if (options?.type) {
    query = query.eq('post_type', options.type)
  }
  if (options?.seriesId) {
    query = query.eq('series_id', options.seriesId)
  }
  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,excerpt.ilike.%${options.search}%,body.ilike.%${options.search}%`)
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    posts: (data as BlogPost[]) || [],
    total: count || 0,
    page,
    perPage: PAGE_SIZE,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as BlogPost
}

export async function getAllTags(): Promise<{ name: string; count: number }[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_blog_tags')
  if (error || !data) return []

  return (data as { name: string; count: number }[]).sort((a, b) => b.count - a.count)
}

export async function getAllSeries(): Promise<BlogSeries[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('title', { ascending: true })

  if (error) return []
  return (data as BlogSeries[]) || []
}

export async function getSeriesBySlug(slug: string): Promise<BlogSeries | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as BlogSeries
}

export async function getAdjacentPosts(slug: string): Promise<{ prev: BlogPost | null; next: BlogPost | null }> {
  if (!supabase) return { prev: null, next: null }

  const { data: current } = await supabase
    .from('posts')
    .select('published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!current) return { prev: null, next: null }

  const publishedAt = (current as BlogPost).published_at

  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .lt('published_at', publishedAt)
      .order('published_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .gt('published_at', publishedAt)
      .order('published_at', { ascending: true })
      .limit(1)
      .single(),
  ])

  return {
    prev: prev ? (prev as BlogPost) : null,
    next: next ? (next as BlogPost) : null,
  }
}

export async function getAdminPosts(status?: PostStatus): Promise<BlogPost[]> {
  if (!supabase) return []

  let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data as BlogPost[]) || []
}

export async function getAdminPostById(id: string): Promise<BlogPost | null> {
  if (!supabase) return null

  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single()
  if (error) return null
  return data as BlogPost
}

export async function createPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<BlogPost> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.from('posts').insert(post).select().single()
  if (error) throw error
  return data as BlogPost
}

export async function updatePost(id: string, post: Partial<BlogPost>): Promise<BlogPost> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.from('posts').update(post).eq('id', id).select().single()
  if (error) throw error
  return data as BlogPost
}

export async function deletePost(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

export async function getPostsForRSS(limit = 50): Promise<BlogPost[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, body, published_at, created_at, author, tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data as BlogPost[]) || []
}

export async function getPostsBySeriesSlug(seriesSlug: string, page = 1): Promise<PaginatedPosts> {
  if (!supabase) return { posts: [], total: 0, page, perPage: PAGE_SIZE, totalPages: 0 }

  // First resolve series slug to id
  const { data: series } = await supabase
    .from('series')
    .select('id')
    .eq('slug', seriesSlug)
    .single()

  if (!series) return { posts: [], total: 0, page, perPage: PAGE_SIZE, totalPages: 0 }

  return getPublishedPosts(page, { seriesId: series.id })
}
