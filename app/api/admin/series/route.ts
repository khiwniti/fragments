import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthenticated } from '@/lib/auth/admin-session'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('series')
    .select('*')
    .order('title', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ series: data || [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const body = await request.json()
  const { data, error } = await supabaseAdmin.from('series').insert(body).select().single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ series: data })
}
