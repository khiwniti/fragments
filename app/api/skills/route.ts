import { NextRequest, NextResponse } from 'next/server'
import { getSkills } from '@/lib/portfolio/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured') === 'true'
    const category = searchParams.get('category') || undefined

    const skills = await getSkills({ featuredOnly: featured, category })
    return NextResponse.json({ skills }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
