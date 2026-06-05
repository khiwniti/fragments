'use client';

import { useState } from 'react';
import { Reveal } from './reveal';
import { Label } from './label';
import { SKILL_GROUPS } from './data';

export function SkillsWidget() {
  const [activeCat, setActiveCat] = useState(0);

  return (
    <section id="skills" className="max-w-[700px] mx-auto px-6 pb-20 pt-10">
      <Reveal><Label>Skills</Label></Reveal>
      <Reveal delay={0.05}>
        <h2 className="text-[28px] font-bold text-foreground mb-1" style={{ textWrap: 'balance' }}>Tech Stack</h2>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-xs text-muted-foreground mb-6">
          Core technologies and frameworks used across projects.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="flex flex-wrap gap-2 mb-5">
          {SKILL_GROUPS.map((g, i) => (
            <button
              key={g.category}
              onClick={() => setActiveCat(i)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                i === activeCat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {g.category}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="flex flex-wrap gap-2">
          {SKILL_GROUPS[activeCat]?.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-default"
            >
              {skill}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
