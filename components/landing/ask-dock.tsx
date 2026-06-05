'use client';

import { useState } from 'react';

export function AskDock({
  sectionId,
  suggestedQuestions,
}: {
  sectionId: string;
  suggestedQuestions: string[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border
                   bg-card text-muted-foreground text-[11px] font-mono
                   hover:border-primary hover:text-primary transition-all duration-200"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Ask AI about this section
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 max-w-[500px]">
          {suggestedQuestions.map((q) => (
            <a
              key={q}
              href={`/chat?prompt=${encodeURIComponent(q)}`}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-[11px] text-muted-foreground
                         hover:border-primary hover:text-primary transition-all duration-200 no-underline"
            >
              {q}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
