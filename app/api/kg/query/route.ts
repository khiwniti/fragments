import { NextRequest, NextResponse } from 'next/server'
import { retrieve } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, top_k = 5 } = body
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }
    const results = await retrieve(question, top_k)
    return NextResponse.json({
      answer: `Results for "${question}":`,
      skills: results,
      evidence: results.filter((r) => r.evidence),
      sources: Array.from(new Set(results.map((r) => r.source))),
      confidence:
        results.reduce((sum, r) => sum + r.confidence, 0) /
        Math.max(results.length, 1),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
