import { NextRequest } from 'next/server'
import { adminLogin, createAdminSession } from '@/lib/auth/admin-session'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return Response.json({ error: 'Password required' }, { status: 400 })
    }

    const valid = await adminLogin(password)
    if (!valid) {
      return Response.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await createAdminSession()

    const response = Response.json({ success: true })
    response.headers.set(
      'Set-Cookie',
      `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    )
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return Response.json({ error: 'Login failed' }, { status: 500 })
  }
}
