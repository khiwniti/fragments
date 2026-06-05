import { NextResponse } from 'next/server'
import { getCareers } from '@/lib/portfolio/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const careers = await getCareers()
    return NextResponse.json({ careers }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
