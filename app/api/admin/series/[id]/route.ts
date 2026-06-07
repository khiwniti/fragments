import { NextRequest } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth/admin-session'
import { getAdminSeriesById, updateSeries, deleteSeries } from '@/lib/blog/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const series = await getAdminSeriesById(id)
    if (!series) return Response.json({ error: 'Series not found' }, { status: 404 })
    return Response.json({ series })
  } catch (error) {
    console.error('Admin series get error:', error)
    return Response.json({ error: 'Failed to fetch series' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const updated = await updateSeries(id, body)
    return Response.json({ series: updated })
  } catch (error) {
    console.error('Admin series update error:', error)
    return Response.json({ error: 'Failed to update series' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteSeries(id)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Admin series delete error:', error)
    return Response.json({ error: 'Failed to delete series' }, { status: 500 })
  }
}
