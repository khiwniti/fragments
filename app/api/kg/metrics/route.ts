import { NextResponse } from 'next/server'
import { getStats } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json({
      timestamp: Date.now(),
      graph: stats,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
