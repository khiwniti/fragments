import { NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth/admin-session'
import { getAdminSeries, createSeries } from '@/lib/blog/client'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const series = await getAdminSeries()
    return Response.json({ series })
  } catch (error) {
    console.error('Admin series list error:', error)
    return Response.json({ error: 'Failed to fetch series' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id: _id, created_at: _ca, ...series } = body
    const created = await createSeries(series)
    return Response.json({ series: created })
  } catch (error) {
    console.error('Admin series create error:', error)
    return Response.json({ error: 'Failed to create series' }, { status: 500 })
  }
}
