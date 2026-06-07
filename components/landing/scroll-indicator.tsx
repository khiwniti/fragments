'use client';

export function ScrollIndicator() {
  return (
    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 z-20 pointer-events-none">
      <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[3px]">
        Scroll
      </span>
        <svg
          className="h-5 w-5 text-muted-foreground/40 motion-safe:animate-scroll-bob"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </div>
  );
}
