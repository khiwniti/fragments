'use client';

import { Reveal } from './reveal';
import { Label } from './label';
import { InteractivePill } from './interactive-pill';
import { DOMAINS, type Domain } from './data';

function extractDomainTechTags(description: string): string[] {
  const text = description.toLowerCase();
  const known = ['ifc', 'pinns', 'cesiumjs', 'noaa', 'ansys', 'comsol', 'openfoam',
    'deepxde', 'moldex3d', 'fhir', 'nlp', 'next.js', 'fastapi', 'qwen3',
    'langgraph', 'mcp', 'neo4j', 'postgresql', 'docker', 'typescript'];
  const found: string[] = [];
  const seen = new Set<string>();
  for (const t of known) {
    if (text.includes(t) && !seen.has(t)) {
      seen.add(t);
      found.push(t);
    }
  }
  return found.slice(0, 5);
}

export function DomainsWidget() {
  const domains = DOMAINS;

  return (
    <section className="max-w-[700px] mx-auto px-6 pb-20 pt-10">
      <Reveal><Label>Expertise</Label></Reveal>
      <Reveal delay={0.05}>
        <h2 className="text-[28px] font-bold text-foreground mb-1" style={{ textWrap: 'balance' as any }}>Industry Domains</h2>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-xs text-muted-foreground mb-6">
          Each domain maps to real projects. Hover a tech badge to see matching content highlight across all sections.
        </p>
      </Reveal>

      <div className="grid grid-cols-2 gap-2.5">
        {domains.map((d, i) => {
          const techTags = extractDomainTechTags(d.description);
          return (
            <Reveal key={i} delay={0.05 * i}>
              <div
                className="p-3.5 rounded-[10px] bg-card border border-border
                           hover:border-primary hover:bg-accent-surface
                           transition-all duration-250 group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[13px] text-primary">{d.icon}</span>
                  <span className="text-[13px] font-bold text-foreground">{d.label}</span>
                </div>
                <div className="text-[10px] text-muted-foreground leading-[1.6] font-mono mb-2">{d.description}</div>
                {techTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {techTags.map((t) => (
                      <InteractivePill key={t} tech={t} />
                    ))}
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
