import { NextResponse } from 'next/server'
import { getPortfolioStats } from '@/lib/portfolio/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getPortfolioStats()
    return NextResponse.json({ stats }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
