'use client'
const STARTERS = [
  'Summarize this resume in 3 bullets',
  'What are the strongest AI/agent projects?',
  'Improve the experience section',
]
export function Suggestions({ onPick, visible }: { onPick: (t: string) => void; visible: boolean }) {
  if (!visible) return null
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {STARTERS.map(s => (
        <button key={s} onClick={() => onPick(s)}
          className="rounded-full border border-border bg-transparent px-4 py-2 text-xs text-foreground hover:border-primary/30 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring">
          {s}
        </button>
      ))}
    </div>
  )
}