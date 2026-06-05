import type { ReactNode } from 'react';

type PillProps = { children: ReactNode; active?: boolean; className?: string };

export function Pill({ children, active, className = '' }: PillProps) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono cursor-default
        ${active
          ? 'bg-accent-surface border border-accent-hover text-primary'
          : 'bg-card border border-border text-muted-foreground'
        }
        hover:border-primary hover:text-primary transition-colors duration-200 ${className}`}
    >
      {children}
    </span>
  );
}
