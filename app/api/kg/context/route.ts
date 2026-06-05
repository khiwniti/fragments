import { NextRequest, NextResponse } from 'next/server'
import { mcpContext } from '@/lib/kg/queries'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      query,
      node_id,
      section_hint = 'auto',
      limit_nodes = 30,
      limit_edges = 60,
      hops = 2,
    } = body

    const result = await mcpContext(
      query,
      node_id,
      section_hint as 'project_card' | 'skill_panel' | 'repo_deep_dive' | 'timeline' | 'concept_map' | 'auto',
      limit_nodes,
      limit_edges,
      hops
    )
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
