import { NextRequest, NextResponse } from 'next/server'
import { retrieveNarratives } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('query') || ''
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const narratives = await retrieveNarratives(q, limit)
    return NextResponse.json({ narratives, total: narratives.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
