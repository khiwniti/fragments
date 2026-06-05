'use client';

import { useState } from 'react';
import { Reveal } from './reveal';
import { Label } from './label';
import { InteractivePill } from './interactive-pill';
import { AskDock } from './ask-dock';
import { CAREER, type CareerEntry } from './data';

function inferTechTags(description: string, company: string): string[] {
  const all = description.toLowerCase() + ' ' + company.toLowerCase();
  const seen = new Set<string>();
  const tags: string[] = [];
  const known = ['ai', 'ml', 'docker', 'k8s', 'kubernetes', 'python', 'typescript', 'next.js',
    'fastapi', 'ansys', 'comsol', 'openfoam', 'azure', 'airflow', 'react', 'langgraph',
    'mcp', 'neo4j', 'postgresql', 'power bi', 'tableau', 'terraform', 'aws'];
  for (const t of known) {
    if (all.includes(t) && !seen.has(t)) {
      seen.add(t);
      tags.push(t);
    }
  }
  return tags.slice(0, 4);
}

function CareerEntryCard({
  entry,
  index,
}: {
  entry: CareerEntry;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const techTags = inferTechTags(entry.description, entry.company);

  return (
    <Reveal delay={0.03 * index}>
      <div
        className={`rounded-xl border transition-all duration-300 cursor-pointer ${
          expanded
            ? 'border-primary/30 bg-accent-surface shadow-sm'
            : 'border-border bg-card hover:border-border/80 hover:bg-accent-surface/50'
        }`}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${entry.title} at ${entry.company}`}
      >
        <div className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`shrink-0 font-mono text-[11px] font-medium w-[70px] pt-0.5 ${
                entry.highlight ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {entry.year}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-foreground leading-tight">
                  {entry.title}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${entry.highlight ? 'text-primary' : 'text-muted-foreground'}`}>
                  {entry.company}
                </div>
              </div>
            </div>
            <div className={`shrink-0 mt-1 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t border-border/50">
            <p className="text-[13px] text-muted-foreground leading-[1.7] mt-3">
              {entry.description}
            </p>
            {techTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {techTags.map((t) => (
                  <InteractivePill key={t} tech={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Reveal>
  );
}

export function CareerWidget() {
  const entries = CAREER;

  return (
    <section id="experience" className="max-w-[700px] mx-auto px-6 pb-20 pt-10">
      <Reveal><Label>Experience</Label></Reveal>
      <Reveal delay={0.05}>
        <h2 className="text-[28px] font-bold text-foreground mb-8" style={{ textWrap: 'balance' as any }}>Career Timeline</h2>
      </Reveal>

      <div className="space-y-2.5">
        {entries.map((c, i) => (
          <CareerEntryCard key={i} entry={c} index={i} />
        ))}
      </div>

      <Reveal delay={0.3}>
        <div className="mt-6 p-4 rounded-[10px] bg-accent-surface border border-accent-hover">
          <div className="text-[13px] text-primary font-bold">Education</div>
          <div className="text-[13px] text-muted-foreground mt-1">
            B.Eng Mechanical Engineering — Naresuan University (2015–2019)
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            GPA 3.50, First Class Honors · EF SET C2 (72/100) · Thai (Native)
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.35}>
        <AskDock
          sectionId="experience"
          suggestedQuestions={[
            'What roles use Kubernetes?',
            'Which positions involve AI/ML?',
            'How long have you worked in government?',
          ]}
        />
      </Reveal>
    </section>
  );
}
