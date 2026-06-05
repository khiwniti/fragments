import { getAllTags } from '@/lib/blog/client'

export async function GET() {
  try {
    const tags = await getAllTags()
    return Response.json({ tags })
  } catch (error) {
    console.error('Blog tags API error:', error)
    return Response.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
