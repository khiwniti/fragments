import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { timingSafeEqual } from 'node:crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const RAW_JWT_SECRET = process.env.ADMIN_JWT_SECRET

if (!RAW_JWT_SECRET) {
  throw new Error(
    'ADMIN_JWT_SECRET environment variable is required. ' +
    'Set it to a secure random value (e.g., openssl rand -hex 32).'
  )
}
const JWT_SECRET = new TextEncoder().encode(RAW_JWT_SECRET)

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
  if (password.length !== ADMIN_PASSWORD.length) return false
  return timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD))
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
}
