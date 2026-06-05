'use client';

import { useCallback } from 'react';

function highlightTech(tech: string) {
  const normalized = tech.toLowerCase().replace(/[^a-z0-9]/g, '');
  document.querySelectorAll('[data-tech]').forEach((el) => {
    const t = el.getAttribute('data-tech')?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (t === normalized) {
      (el as HTMLElement).style.borderColor = 'rgba(52, 211, 153, 0.5)';
      (el as HTMLElement).style.background = 'rgba(52, 211, 153, 0.08)';
    }
  });
}

function clearHighlight() {
  document.querySelectorAll('[data-tech]').forEach((el) => {
    (el as HTMLElement).style.borderColor = '';
    (el as HTMLElement).style.background = '';
  });
}

export function InteractivePill({ tech }: { tech: string }) {
  const onEnter = useCallback(() => highlightTech(tech), [tech]);
  const onLeave = useCallback(() => clearHighlight(), []);

  return (
    <span
      data-tech={tech}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={0}
      className="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono cursor-default
                 bg-card border border-border text-muted-foreground
                 hover:border-primary hover:text-primary transition-colors duration-200
                 focus:outline-none focus:border-primary/50"
    >
      {tech}
    </span>
  );
}
