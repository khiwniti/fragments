'use client';

import { useCallback } from 'react';

// Cross-section skill highlighting: hovering/focusing a tech pill highlights
// every pill with the same tech across the whole portfolio (hero → career →
// domains → projects), reinforcing the PRODUCT.md "shared vocabulary" idea.
//
// Perf + theme notes: the previous implementation ran a full-document
// `querySelectorAll('[data-tech]')` on every pointer move/focus and wrote
// inline `style` values — both forced re-scans and bypassed the theme system
// (hard-coded rgba(52,211,153,…) literal). We now toggle a single body flag
// to dim all pills and a `.pill-tech-active` class on the matches; CSS uses
// --primary for the highlight, so there's no inline style and no literal.

const normalizedTech = (tech: string) =>
  tech.toLowerCase().replace(/[^a-z0-9]/g, '');

function setHighlight(tech: string | null) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  // Always clear the previous run's class first (cheap: only matched pills had it).
  body
    .querySelectorAll('.pill-tech-active')
    .forEach((el) => el.classList.remove('pill-tech-active'));
  if (tech) {
    const norm = normalizedTech(tech);
    body.dataset.techHighlighting = '';
    body
      .querySelectorAll(`.interactive-pill[data-tech="${CSS.escape(norm)}"]`)
      .forEach((el) => el.classList.add('pill-tech-active'));
  } else {
    delete body.dataset.techHighlighting;
  }
}

export function InteractivePill({ tech }: { tech: string }) {
  const onEnter = useCallback(() => setHighlight(tech), [tech]);
  const onLeave = useCallback(() => setHighlight(null), []);

  return (
    <span
      data-tech={normalizedTech(tech)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={0}
      className="interactive-pill inline-block px-2.5 py-1 rounded-full text-[10px] font-mono cursor-default
                 bg-card border border-border text-muted-foreground
                 hover:border-primary hover:text-primary transition-colors duration-200
                 focus:outline-none focus:border-primary/50"
    >
      {tech}
    </span>
  );
}
