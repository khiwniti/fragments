'use client';

import { useState } from 'react';
import { Reveal } from './reveal';
import { Label } from './label';
import { SIDE_PROJECTS } from './data';

export function OpenSourceWidget() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <section className="max-w-[700px] mx-auto px-6 pb-20 pt-10">
      <Reveal><Label>Open Source</Label></Reveal>
      <Reveal delay={0.05}>
        <h2 className="text-[28px] font-bold text-foreground mb-1" style={{ textWrap: 'balance' }}>Passion Projects</h2>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-xs text-muted-foreground mb-6">
          Open-source work and side projects that solve real problems.
        </p>
      </Reveal>

      <div>
        {SIDE_PROJECTS.map((p, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <Reveal key={i} delay={0.08 * i}>
              <div
                className={`p-[18px] rounded-xl border transition-all duration-300 cursor-pointer mb-2.5 ${
                  isExpanded
                    ? 'border-primary/30 bg-card shadow-sm'
                    : 'border-border/60 bg-card/50 hover:border-primary/30'
                }`}
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedIndex(isExpanded ? null : i); } }}
                tabIndex={0}
                role="button"
                aria-expanded={isExpanded}
                aria-label={`${p.name} — ${p.subtitle}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[15px] font-bold text-primary">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground italic truncate">{p.subtitle}</span>
                    </div>
                  </div>
                  <div className={`shrink-0 mt-1 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <p className={`text-xs text-muted-foreground leading-[1.7] transition-all duration-300 ${
                  isExpanded ? 'mt-2' : 'line-clamp-2'
                }`}>
                  {p.description}
                </p>

                {isExpanded && p.url && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary no-underline hover:text-primary/80 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {p.url.replace('https://', '')}
                    </a>
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
