import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'fragments-admin-fallback-secret-change-me'
)

export interface AdminSession {
  isAdmin: boolean
  iat: number
  exp: number
}

export async function createAdminSession(): Promise<string> {
  const token = await new SignJWT({ isAdmin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  return token
}

export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 })
    return payload as unknown as AdminSession
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return null
  return verifyAdminSession(token)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession()
  return session?.isAdmin === true
}

export async function adminLogin(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD) return false
  return password === ADMIN_PASSWORD
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
}
