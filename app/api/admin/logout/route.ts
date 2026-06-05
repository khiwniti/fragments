import { adminLogout } from '@/lib/auth/admin-session'

export async function POST() {
  await adminLogout()

  const response = Response.json({ success: true })
  response.headers.set(
    'Set-Cookie',
    `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
  return response
}
