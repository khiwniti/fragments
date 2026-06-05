import { NextResponse } from 'next/server'
import { getSkillEvidence } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skill: string }> }
) {
  try {
    const { skill } = await params
    const decoded = decodeURIComponent(skill)
    const evidence = await getSkillEvidence(decoded)
    return NextResponse.json({ skill: decoded, evidence, count: evidence.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
