import { NextResponse } from 'next/server'
import { verifyConnectivity } from '@/lib/kg/neo4j'
import { buildIndex } from '@/lib/kg/graph'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const conn = await verifyConnectivity()
    if (!conn.ok) {
      return NextResponse.json(
        { status: 'error', neo4j_connected: false, detail: conn.message },
        { status: 503 }
      )
    }

    const idx = await buildIndex()
    const stats = {
      status: 'ok',
      neo4j_connected: true,
      nodes: idx.nodesById.size,
      edges: idx.edgesByKey.size,
      evidence: idx.evidenceById.size,
    }
    return NextResponse.json(stats)
  } catch (e) {
    return NextResponse.json(
      { status: 'error', neo4j_connected: false, detail: String(e) },
      { status: 503 }
    )
  }
}
