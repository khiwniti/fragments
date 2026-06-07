// section-id / kebab-id helpers
function toSectionId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) || 'section'
}

export function toKebabCase(text: string): string {
  return toSectionId(text)
}

// ── Sandbox shape ──────────────────────────────────────────────────────────
export interface SandboxSection {
  id: string
  type: string
  title: string
  items: ResumeItemSchema[]
  order: number
  createdAt: number
  updatedAt: number
}

export interface SandboxPatchRecord {
  messageId?: string
  query?: string
  intent: string
  commentary: string
  added: number
  updated: number
  removed: number
  reordered: number
  appliedAt: number
}

export interface ResumeSandbox {
  conversationId: string
  focus: string
  sections: SandboxSection[]
  history: SandboxPatchRecord[]
  version: number
  createdAt: number
  updatedAt: number
}

type ResumeItemSchema = {
  id: string
  label?: string
  value: string
  detail?: string
  tags?: string[]
  url?: string
  children?: ResumeItemSchema[]
}

// ── Storage ────────────────────────────────────────────────────────────────
const SANDBOX_PREFIX = 'fragments-sandbox-'

const isBrowser = () => typeof window !== 'undefined'

export function emptySandbox(conversationId: string, focus = 'General resume'): ResumeSandbox {
  const now = Date.now()
  return {
    conversationId,
    focus,
    sections: [],
    history: [],
    version: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function getSandbox(conversationId: string): ResumeSandbox | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(SANDBOX_PREFIX + conversationId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ResumeSandbox>
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.conversationId !== conversationId) return null
    if (!Array.isArray(parsed.sections)) return null
    return {
      conversationId,
      focus: typeof parsed.focus === 'string' ? parsed.focus : 'General resume',
      sections: parsed.sections as SandboxSection[],
      history: Array.isArray(parsed.history) ? (parsed.history as SandboxPatchRecord[]) : [],
      version: typeof parsed.version === 'number' ? parsed.version : 0,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function saveSandbox(sandbox: ResumeSandbox): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(SANDBOX_PREFIX + sandbox.conversationId, JSON.stringify(sandbox))
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[resume-sandbox] save failed', err)
    }
  }
}

export function clearSandbox(conversationId: string): void {
  if (!isBrowser()) return
  localStorage.removeItem(SANDBOX_PREFIX + conversationId)
}

// ── View shape (used by resume-artifact and chat components) ──────────────
export interface SandboxView {
  focus: string
  sections: SandboxViewSection[]
}

export interface SandboxViewSection {
  id: string
  type: string
  title: string
  items: ResumeItemSchema[]
}

export interface PatchDiffSummary {
  added: number
  updated: number
  removed: number
  reordered: number
  hasChanges: boolean
}

// Stub partialDiff for non-resume chat mode (no-op — resume mode removed).
export function partialDiff(_patch: unknown | null | undefined): PatchDiffSummary {
  return { added: 0, updated: 0, removed: 0, reordered: 0, hasChanges: false }
}