import { getPostBySlug, getAdjacentPosts } from '@/lib/blog/client'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    if (!post || post.status !== 'published') {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const { prev, next } = await getAdjacentPosts(slug)

    return Response.json({ post, prev, next })
  } catch (error) {
    console.error('Blog post API error:', error)
    return Response.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}
