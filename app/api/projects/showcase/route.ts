import { NextResponse } from 'next/server'
import { getProjects } from '@/lib/portfolio/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await getProjects({ showcaseOnly: true, limit: 5 })
    return NextResponse.json({ projects }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
