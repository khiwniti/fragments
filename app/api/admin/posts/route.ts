import { NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth/admin-session'
import { getAdminPosts, createPost } from '@/lib/blog/client'
import { BlogPost, PostStatus } from '@/lib/blog/types'

export async function GET() {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const posts = await getAdminPosts()
    return Response.json({ posts })
  } catch (error) {
    console.error('Admin posts API error:', error)
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'> = {
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt || null,
      body: body.body || '',
      body_th: body.body_th || null,
      cover_image: body.cover_image || null,
      status: (body.status as PostStatus) || 'draft',
      post_type: body.post_type || 'article',
      tags: body.tags || [],
      series_id: body.series_id || null,
      author: body.author || 'Ikkyu (Khiw)',
      published_at: body.status === 'published' ? new Date().toISOString() : null,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      reading_time_minutes: body.reading_time_minutes || null,
    }

    const created = await createPost(post)
    return Response.json({ post: created })
  } catch (error) {
    console.error('Admin create post error:', error)
    return Response.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
