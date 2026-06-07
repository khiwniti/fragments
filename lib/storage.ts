import type { ResumeContentSchema } from '@/lib/schema'
import type { Message } from '@/lib/messages'
import type { DeepPartial } from 'ai'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SavedSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  resumeContent?: DeepPartial<ResumeContentSchema>
}

// ── Keys ───────────────────────────────────────────────────────────────────
// Key values are kept stable for backward-compat with existing user data.
// The legacy `resume-` prefix is intentional and is not a current-only marker.

const ANON_ID_KEY = 'resume-anon-id'
const SESSIONS_INDEX_KEY = 'resume-sessions-index'
const SESSION_PREFIX = 'resume-session-'

// ── Anonymous ID ───────────────────────────────────────────────────────────

export function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}

export function getAnonId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ANON_ID_KEY)
}

// ── Session Index ──────────────────────────────────────────────────────────

function getSessionsIndex(): string[] {
  try {
    const raw = localStorage.getItem(SESSIONS_INDEX_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessionsIndex(ids: string[]) {
  localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(ids))
}

// ── Create / Load / Save sessions ──────────────────────────────────────────

function inferTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  const text = firstUser?.content.find((c) => c.type === 'text')?.text || ''
  return text.slice(0, 60) || 'New chat'
}

export function createSession(
  messages: Message[],
  resumeContent?: DeepPartial<ResumeContentSchema>,
): SavedSession {
  const id = crypto.randomUUID()
  const now = Date.now()
  const session: SavedSession = {
    id,
    title: inferTitle(messages),
    createdAt: now,
    updatedAt: now,
    messages,
    resumeContent,
  }
  // Add to index at front
  const index = getSessionsIndex()
  index.unshift(id)
  saveSessionsIndex(index)
  // Persist session data
  localStorage.setItem(SESSION_PREFIX + id, JSON.stringify(session))
  return session
}

export function saveSession(session: SavedSession) {
  session.updatedAt = Date.now()
  if (session.messages.length > 0) {
    session.title = inferTitle(session.messages)
  }
  localStorage.setItem(SESSION_PREFIX + session.id, JSON.stringify(session))
}

export function loadSession(id: string): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_PREFIX + id)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function deleteSession(id: string) {
  localStorage.removeItem(SESSION_PREFIX + id)
  const index = getSessionsIndex().filter((i) => i !== id)
  saveSessionsIndex(index)
}

export function listSessions(): SavedSession[] {
  const index = getSessionsIndex()
  return index
    .map((id) => loadSession(id))
    .filter((s): s is SavedSession => s !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

// ── Current active session ─────────────────────────────────────────────────

const ACTIVE_SESSION_KEY = 'resume-active-session'

export function saveActiveSessionId(id: string) {
  localStorage.setItem(ACTIVE_SESSION_KEY, id)
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY)
}

export function clearActiveSessionId() {
  localStorage.removeItem(ACTIVE_SESSION_KEY)
}

// ── Full session lifecycle helpers ─────────────────────────────────────────

/**
 * Persist the current in-memory state: upsert the active session and update
 * the index. Creates a new session if none is active yet.
 */
export function persistSession(
  messages: Message[],
  resumeContent?: DeepPartial<ResumeContentSchema>,
): SavedSession {
  const activeId = getActiveSessionId()

  if (activeId) {
    const existing = loadSession(activeId)
    if (existing) {
      existing.messages = messages
      existing.resumeContent = resumeContent
      saveSession(existing)
      return existing
    }
  }

  // No active session yet — create one
  const session = createSession(messages, resumeContent)
  saveActiveSessionId(session.id)
  return session
}

/**
 * Load the active session from localStorage, or null if none exists.
 */
export function restoreActiveSession(): SavedSession | null {
  const activeId = getActiveSessionId()
  if (!activeId) return null
  return loadSession(activeId)
}

/**
 * Start a fresh session: clear active ID, create new session on next persist.
 */
export function startNewSession() {
  clearActiveSessionId()
}
