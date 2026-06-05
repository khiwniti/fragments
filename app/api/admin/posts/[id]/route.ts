import { NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth/admin-session'
import { getAdminPostById, updatePost, deletePost } from '@/lib/blog/client'
import { PostStatus } from '@/lib/blog/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const post = await getAdminPostById(id)
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }
    return Response.json({ post })
  } catch (error) {
    console.error('Admin get post error:', error)
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const update: Parameters<typeof updatePost>[1] = {}
    if (body.title !== undefined) update.title = body.title
    if (body.slug !== undefined) update.slug = body.slug
    if (body.excerpt !== undefined) update.excerpt = body.excerpt
    if (body.body !== undefined) update.body = body.body
    if (body.body_th !== undefined) update.body_th = body.body_th
    if (body.cover_image !== undefined) update.cover_image = body.cover_image
    if (body.status !== undefined) {
      update.status = body.status as PostStatus
      if (body.status === 'published' && !body.published_at) {
        update.published_at = new Date().toISOString()
      }
    }
    if (body.post_type !== undefined) update.post_type = body.post_type
    if (body.tags !== undefined) update.tags = body.tags
    if (body.series_id !== undefined) update.series_id = body.series_id
    if (body.meta_title !== undefined) update.meta_title = body.meta_title
    if (body.meta_description !== undefined) update.meta_description = body.meta_description
    if (body.reading_time_minutes !== undefined) update.reading_time_minutes = body.reading_time_minutes

    const updated = await updatePost(id, update)
    return Response.json({ post: updated })
  } catch (error) {
    console.error('Admin update post error:', error)
    return Response.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deletePost(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Admin delete post error:', error)
    return Response.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
