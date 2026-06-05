'use client';

const SECTIONS = ['Projects', 'Skills', 'Experience'];

export function NavButtons() {
  return (
    <div className="flex gap-2 mt-7">
      {SECTIONS.map((label) => (
        <button
          key={label}
          onClick={() =>
            document.getElementById(label.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })
          }
          className="px-5 py-2 rounded-md border-2 border-border bg-transparent text-muted-foreground
                     text-[13px] font-bold font-sans cursor-pointer
                     hover:border-primary hover:text-primary transition-all duration-200"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
