import { NextRequest, NextResponse } from 'next/server'
import { getProjects } from '@/lib/portfolio/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showcase = searchParams.get('showcase') === 'true'
    const status = searchParams.get('status') || undefined
    const category = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const projects = await getProjects({ showcaseOnly: showcase, status, category, limit })
    return NextResponse.json({ projects }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
