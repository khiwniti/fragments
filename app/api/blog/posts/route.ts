import { NextRequest } from 'next/server'
import { getPublishedPosts } from '@/lib/blog/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const tag = searchParams.get('tag') || undefined
    const type = searchParams.get('type') || undefined
    const search = searchParams.get('q') || undefined

    const result = await getPublishedPosts(page, { tag, type, search })
    return Response.json(result)
  } catch (error) {
    console.error('Blog posts API error:', error)
    return Response.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
