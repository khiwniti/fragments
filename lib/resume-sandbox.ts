import type {
  DeepPartial,
} from 'ai'
import type {
  ResumeItemSchema,
  ResumePatchOpSchema,
  ResumePatchSchema,
  ResumeSectionType,
} from '@/lib/schema'

// ── Sandbox shape ──────────────────────────────────────────────────────────
// A sandbox is a per-conversation accumulator of resume sections. The model
// emits patches (add/update/remove/reorder) that the client applies. The right
// panel renders the merged view. The sandbox survives across prompts so users
// can build a tailored resume iteratively.

export interface SandboxSection {
  id: string
  type: ResumeSectionType
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

// ── Storage ────────────────────────────────────────────────────────────────
// Per-conversation localStorage key. Stable prefix for migration. Server-backed
// `agent_memory` is the long-term target; this is the local-first step.

const SANDBOX_PREFIX = 'fragments-sandbox-'
const MAX_HISTORY = 50

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
    // Quota or serialization failure: surface in dev only, fail soft in prod.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[resume-sandbox] save failed', err)
    }
  }
}

export function clearSandbox(conversationId: string): void {
  if (!isBrowser()) return
  localStorage.removeItem(SANDBOX_PREFIX + conversationId)
}

// ── Pure ops ───────────────────────────────────────────────────────────────

function isValidId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(id) && id.length >= 2 && id.length <= 80
}

function nextOrder(sections: SandboxSection[]): number {
  if (sections.length === 0) return 0
  return Math.max(...sections.map((s) => s.order)) + 1
}

function normalizeItems(items: ResumeItemSchema[] | undefined): ResumeItemSchema[] | undefined {
  if (!items) return undefined
  return items.map((item) => ({
    label: item.label ?? '',
    value: item.value,
    detail: item.detail,
    tags: item.tags,
    url: item.url,
  }))
}

export interface ApplyPatchSource {
  messageId?: string
  query?: string
}

export interface ApplyPatchResult {
  sandbox: ResumeSandbox
  summary: PatchDiffSummary
}

/**
 * Apply a patch to a sandbox. Returns a new sandbox and a diff summary.
 * Pure: the input sandbox is not mutated.
 *
 * - `add` is skipped if an id already exists (use `update` for those).
 * - `update` is skipped if the id does not exist (use `add` for those).
 * - `remove` is skipped for ids that are not present.
 * - `reorder` is skipped for ids that are not present; position is clamped to
 *   the resulting section count.
 */
export function applyPatch(
  sandbox: ResumeSandbox,
  patch: ResumePatchSchema,
  source: ApplyPatchSource = {},
): ApplyPatchResult {
  const now = Date.now()
  const next: ResumeSandbox = {
    ...sandbox,
    sections: sandbox.sections.map((s) => ({ ...s, items: [...s.items] })),
    history: [...sandbox.history],
    focus: patch.focus?.trim() || sandbox.focus,
    version: sandbox.version + 1,
    updatedAt: now,
  }

  const existingIds = new Set(next.sections.map((s) => s.id))
  let added = 0
  let updated = 0
  let removed = 0
  let reordered = 0

  // add
  for (const section of patch.patch.add ?? []) {
    if (!isValidId(section.id)) continue
    if (existingIds.has(section.id)) continue
    next.sections.push({
      id: section.id,
      type: section.type,
      title: section.title,
      items: normalizeItems(section.items) ?? [],
      order: nextOrder(next.sections),
      createdAt: now,
      updatedAt: now,
    })
    existingIds.add(section.id)
    added += 1
  }

  // update
  for (const change of patch.patch.update ?? []) {
    const target = next.sections.find((s) => s.id === change.id)
    if (!target) continue
    if (change.type) target.type = change.type
    if (change.title) target.title = change.title
    if (change.items) target.items = normalizeItems(change.items) ?? []
    target.updatedAt = now
    updated += 1
  }

  // remove
  const removeIds = new Set((patch.patch.remove ?? []).filter(isValidId))
  if (removeIds.size > 0) {
    const before = next.sections.length
    next.sections = next.sections.filter((s) => {
      if (removeIds.has(s.id)) {
        removed += 1
        return false
      }
      return true
    })
    // Defensive: if nothing was removed, the counter stays accurate.
    if (next.sections.length === before) removed = 0
  }

  // reorder
  // Interpret each `reorder` op as "move the section to this index in the
  // current list". Removing first, then splicing at the clamped position,
  // avoids the stable-sort tie-breaking that made early patches place items
  // at the wrong slot when two sections shared an order.
  for (const move of patch.patch.reorder ?? []) {
    const targetIndex = next.sections.findIndex((s) => s.id === move.id)
    if (targetIndex < 0) continue
    const [target] = next.sections.splice(targetIndex, 1)
    const clamped = Math.max(0, Math.min(move.position, next.sections.length))
    next.sections.splice(clamped, 0, target)
    reordered += 1
  }

  // Compact orders to 0..N-1 so future reorder math is clean.
  next.sections = next.sections.map((s, i) => ({ ...s, order: i }))

  const summary: PatchDiffSummary = {
    added,
    updated,
    removed,
    reordered,
    hasChanges: added + updated + removed + reordered > 0,
  }

  next.history.push({
    messageId: source.messageId,
    query: source.query,
    intent: patch.intent,
    commentary: patch.commentary,
    ...summary,
    appliedAt: now,
  })
  if (next.history.length > MAX_HISTORY) {
    next.history.splice(0, next.history.length - MAX_HISTORY)
  }

  return { sandbox: next, summary }
}

// ── Views + diff summary ───────────────────────────────────────────────────

export interface SandboxViewSection {
  id: string
  type: ResumeSectionType
  title: string
  items: ResumeItemSchema[]
}

export interface SandboxView {
  focus: string
  sections: SandboxViewSection[]
}

/**
 * Convert the sandbox to the shape that <ResumeArtifact /> already knows how
 * to render. The id is forwarded so the artifact can build stable React keys
 * — two sections of the same `type` would otherwise collide in the pager.
 */
export function sandboxToView(sandbox: ResumeSandbox | null): SandboxView {
  if (!sandbox) {
    return { focus: 'General resume', sections: [] }
  }
  return {
    focus: sandbox.focus,
    sections: sandbox.sections.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      items: s.items,
    })),
  }
}

export interface PatchDiffSummary {
  added: number
  updated: number
  removed: number
  reordered: number
  hasChanges: boolean
}

export function diffSummaryFromPatch(patch: ResumePatchSchema): PatchDiffSummary {
  const added = patch.patch.add?.length ?? 0
  const updated = patch.patch.update?.length ?? 0
  const removed = patch.patch.remove?.length ?? 0
  const reordered = patch.patch.reorder?.length ?? 0
  return {
    added,
    updated,
    removed,
    reordered,
    hasChanges: added + updated + removed + reordered > 0,
  }
}

/**
 * Coerce a streamed (DeepPartial) patch into a fully-populated patch. Used by
 * the chat page to merge a completed stream into the sandbox. Missing arrays
 * are filled with `[]`; missing strings fall back to safe defaults. Safe to
 * call multiple times during streaming — fields not yet received stay empty.
 */
export function coercePatch(partial: DeepPartial<ResumePatchSchema>): ResumePatchSchema {
  const op: DeepPartial<ResumePatchOpSchema> = partial.patch ?? {}
  const add: ResumePatchSchema['patch']['add'] = Array.isArray(op.add)
    ? (op.add.filter((s): s is NonNullable<typeof s> => s != null) as ResumePatchSchema['patch']['add'])
    : []
  const update: ResumePatchSchema['patch']['update'] = Array.isArray(op.update)
    ? (op.update.filter((s): s is NonNullable<typeof s> => s != null) as ResumePatchSchema['patch']['update'])
    : []
  const remove: string[] = Array.isArray(op.remove)
    ? op.remove.filter((s): s is string => typeof s === 'string')
    : []
  const reorder: ResumePatchSchema['patch']['reorder'] = Array.isArray(op.reorder)
    ? (op.reorder.filter((s): s is NonNullable<typeof s> => s != null) as ResumePatchSchema['patch']['reorder'])
    : []
  return {
    commentary: typeof partial.commentary === 'string' ? partial.commentary : '',
    intent: typeof partial.intent === 'string' ? partial.intent : 'Update',
    focus: typeof partial.focus === 'string' ? partial.focus : 'General resume',
    patch: { add, update, remove, reorder },
  }
}

/**
 * Compute a diff summary from a still-streaming (DeepPartial) patch. Used by
 * the chat to render the live "Added N · Updated M" card as tokens come in.
 */
export function partialDiff(partial: DeepPartial<ResumePatchSchema> | null | undefined): PatchDiffSummary {
  const op = partial?.patch ?? {}
  const added = Array.isArray(op.add) ? op.add.length : 0
  const updated = Array.isArray(op.update) ? op.update.length : 0
  const removed = Array.isArray(op.remove) ? op.remove.length : 0
  const reordered = Array.isArray(op.reorder) ? op.reorder.length : 0
  return {
    added,
    updated,
    removed,
    reordered,
    hasChanges: added + updated + removed + reordered > 0,
  }
}
