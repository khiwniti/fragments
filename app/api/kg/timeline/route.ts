import { NextRequest, NextResponse } from 'next/server'
import { getTimeline } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const projects = await getTimeline(year ? parseInt(year, 10) : undefined, limit)
    return NextResponse.json({ projects, total: projects.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
