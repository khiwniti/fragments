'use client';

import { Reveal } from './reveal';
import { StatItem } from './stat-item';
import { NavButtons } from './nav-buttons';
import { InteractivePill } from './interactive-pill';
import { HERO_STATS, HERO_CHIPS, SOCIAL_LINKS } from './data';

export function HeroWidget() {
  const stats = HERO_STATS.map((s) => ({ n: s.value, l: s.label }));
  const chips = HERO_CHIPS;
  const links = SOCIAL_LINKS.map((s) => ({ l: s.label, u: s.url, t: s.title }));

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'rgba(52,211,153,0.02)', filter: 'blur(120px)' }}
      />

      <Reveal>
        <h1
          className="font-bold leading-[1.1] text-center"
          style={{ fontSize: 'clamp(32px,6vw,56px)' }}
        >
          Hey <span className="inline-flex cursor-default">👋</span> I&apos;m Ikkyu
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-6 text-center">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md font-bold text-[15px]">
            AI-Augmented
          </span>
          <span className="text-foreground text-[17px] ml-2 font-medium">
            Full-Stack Developer
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <p className="mt-3 text-sm text-muted-foreground">
          AI Agent Architect
          <span className="text-accent-dim ml-0.5">|</span>
        </p>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="flex items-center gap-3 mt-6 text-xs text-muted-foreground">
          <span>📍 Bangkok, Thailand 🇹🇭</span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
            Available
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.25}>
        <div className="flex gap-6 mt-7">
          {stats.map((s) => (
            <StatItem key={s.l} value={s.n} label={s.l} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <div className="flex flex-wrap justify-center gap-1.5 mt-6 max-w-[420px]">
          {chips.map((t) => (
            <InteractivePill key={t} tech={t} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.35}>
        <NavButtons />
      </Reveal>

      <Reveal delay={0.4}>
        <div className="flex gap-1.5 mt-5">
          {links.map((s) => (
            <a
              key={s.t}
              href={s.u}
              target="_blank"
              rel="noopener noreferrer"
              title={s.t}
              className="w-8 h-8 rounded-md flex items-center justify-center border border-border
                         text-muted-foreground text-[11px] font-mono no-underline
                         hover:border-primary hover:text-primary hover:bg-accent-surface
                         transition-all duration-200"
            >
              {s.l}
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
