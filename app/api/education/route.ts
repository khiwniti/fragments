import { NextResponse } from 'next/server'
import { getEducation, getCertifications } from '@/lib/portfolio/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [education, certifications] = await Promise.all([
      getEducation(),
      getCertifications(),
    ])
    return NextResponse.json({ education, certifications }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
