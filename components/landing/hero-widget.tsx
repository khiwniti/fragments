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
      {/* Single committed accent halo for the hero (PRODUCT.md reserves the
          committed accent for hero/result moments). A radial-gradient replaces
          the previous filter: blur(120px) over a 2%-alpha ellipse — that was
          invisible-by-design yet still forced a blur paint pass on the
          always-visible first viewport. A gradient is one shader paint, no
          kernel; the glow is now intentional and sourced from --primary. */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[360px] rounded-full -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(var(--primary) / 0.10), transparent 70%)',
        }}
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
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
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
              aria-label={s.t}
              // Hit area 44px (WCAG 2.2 2.5.8); the visible 32px tile is a
              // ::before centered inside a larger transparent tappable box.
              className="relative h-11 w-11 flex items-center justify-center no-underline
                         before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2
                         before:w-8 before:h-8 before:rounded-md before:border before:border-border
                         before:transition-all before:duration-200
                         text-muted-foreground text-[11px] font-mono
                         hover:before:border-primary hover:text-primary hover:before:bg-accent-surface"
            >
              <span className="relative z-10">{s.l}</span>
            </a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
