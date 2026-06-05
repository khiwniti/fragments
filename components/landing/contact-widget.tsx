'use client';

import { Reveal } from './reveal';
import { Label } from './label';
import { SOCIAL_LINKS } from './data';

export function ContactWidget() {
  return (
    <section id="contact" className="max-w-[700px] mx-auto px-6 py-20">
      <Reveal><Label>Contact</Label></Reveal>
      <Reveal delay={0.05}>
        <h2 className="text-[28px] font-bold text-foreground mb-2 leading-tight" style={{ textWrap: 'balance' }}>
          Get in Touch
        </h2>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Have a project in mind, a collaboration idea, or just want to say hi?
          I&apos;ll get back to you within 24 hours.
        </p>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="flex flex-wrap gap-3 mb-8">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target={link.url.startsWith('http') ? '_blank' : undefined}
              rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
              title={link.title}
            >
              <span className="font-mono text-xs text-primary">{link.label}</span>
              <span className="text-xs text-muted-foreground">{link.title}</span>
            </a>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-3">
            Or send a message directly via the chat below:
          </p>
          <a
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Start a Chat
          </a>
        </div>
      </Reveal>
    </section>
  );
}
