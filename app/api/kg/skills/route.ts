import { NextRequest, NextResponse } from 'next/server'
import { listSkills, searchSkills } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const minConfidence = parseFloat(searchParams.get('min_confidence') || '0')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const category = searchParams.get('category')

    let skills = q ? await searchSkills(q, limit) : await listSkills(minConfidence)
    if (category) {
      skills = skills.filter((s) => s.category.toLowerCase() === category.toLowerCase())
    }

    const total = skills.length
    const paginated = skills.slice(offset, offset + limit)

    return NextResponse.json({ skills: paginated, total })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
