# Resume Artifact Panel — Original Fragment Chrome

**Date:** 2026-06-05
**Status:** Approved

## Goal

Replace the current custom resume artifact panel wrapper with the original
e2b/fragments `Preview` panel chrome (as seen in `fragments-org/components/preview.tsx`,
byte-identical to this repo's `components/preview.tsx`), while keeping the
formatted resume rendering inside it.

## Background

- Resume mode (`NEXT_PUBLIC_RESUME_MODE`) renders `ResumeArtifact` directly in
  `app/chat/page.tsx`, with a hand-rolled close button overlay and its own
  toolbar/container — diverging from the original artifact panel UX.
- Non-resume mode still uses the original `Preview` component with its
  3-column toolbar (close `»`, centered tab pills, right action slot) and
  Code/Preview tabs.

## Design

### New component: `components/resume-preview.tsx`

Modeled line-for-line on `components/preview.tsx`, with fragment-specific
props replaced by resume props:

```ts
export function ResumePreview({
  selectedTab,            // 'preview' | 'data'
  onSelectedTabChange,
  isChatLoading,          // streaming state → spinner in tab trigger
  content,                // DeepPartial<ResumeContentSchema>
  onClose,
}: { ... })
```

- **Container:** identical original styling —
  `absolute md:relative z-10 top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-auto`
- **Toolbar:** 3-column grid:
  - Left: `ChevronsRight` ghost icon button with "Close sidebar" tooltip → `onClose`
  - Center: `TabsList` pills — `Preview` (shows loading spinner while streaming)
    and `Data`
  - Right: `Printer` ghost button (Print / PDF → `window.print()`), replacing
    the original Deploy dialog slot
- **Tab content:**
  - `Preview` tab: formatted resume body (header + sections) via slimmed
    `ResumeArtifact`
  - `Data` tab: resume content JSON (`JSON.stringify(content, null, 2)`)
    rendered through the original `FragmentCode` component as a
    `resume.json` file entry — same code view as the original Code tab

### Modified: `components/resume-artifact.tsx`

Slimmed to only the resume body:

- Remove outer container styling (panel provides it), the toolbar, and the
  Print button (moves to `ResumePreview` toolbar)
- Keep: fixed profile header, skeleton loader, dynamic sections rendering,
  empty state

### Modified: `app/chat/page.tsx`

- Resume-mode right panel renders `<ResumePreview …>` instead of the custom
  close-button overlay + `ResumeArtifact`
- Remove the hand-rolled SVG close button block
- Add `resumeTab` state (`'preview' | 'data'`, default `'preview'`)
- `onClose` → `setShowArtifactPanel(false)`

## Unchanged

Schema, `/api/resume-chat`, streaming via `useObject`, session storage,
chat artifact card, non-resume fragment flow.

## Testing

- Manual: generate a resume answer → panel opens with original chrome;
  tabs switch between formatted resume and JSON; close button hides panel;
  print button opens print dialog; streaming shows spinner in Preview tab.
- `npx tsc --noEmit` passes.
