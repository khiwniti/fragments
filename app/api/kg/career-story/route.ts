import { NextRequest, NextResponse } from 'next/server'
import { retrieveCareerStory } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodStart = searchParams.get('period_start') || undefined
    const periodEnd = searchParams.get('period_end') || undefined
    const topic = searchParams.get('topic') || ''
    const topK = parseInt(searchParams.get('top_k') || '5', 10)

    const story = await retrieveCareerStory(periodStart, periodEnd, topic, topK)
    return NextResponse.json({
      ...story,
      period_start: periodStart,
      period_end: periodEnd,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
