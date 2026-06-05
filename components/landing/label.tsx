import type { ReactNode } from 'react';

type LabelProps = { children: ReactNode; className?: string };

export function Label({ children, className = '' }: LabelProps) {
  return (
    <div className={`flex items-center gap-2 mb-3 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
      <span className="font-mono text-[10px] uppercase tracking-[3px] text-accent-dim">
        {children}
      </span>
    </div>
  );
}
