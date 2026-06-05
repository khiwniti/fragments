import { NextRequest, NextResponse } from 'next/server'
import { listProjects } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const source = searchParams.get('source')

    let projects = await listProjects()
    if (source) {
      projects = projects.filter((p) => (p.source as string)?.toLowerCase() === source.toLowerCase())
    }

    const total = projects.length
    const paginated = projects.slice(offset, offset + limit)

    return NextResponse.json({ projects: paginated, total })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
