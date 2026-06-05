type StatItemProps = { value: string; label: string; className?: string };

export function StatItem({ value, label, className = '' }: StatItemProps) {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-[22px] font-bold font-mono text-accent-dim">{value}</div>
      <div className="text-[9px] uppercase tracking-[2px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
