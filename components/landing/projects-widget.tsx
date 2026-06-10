'use client';

import Link from 'next/link'
import { useState } from 'react';
import { Reveal } from './reveal';
import { Label } from './label';
import { Pill } from './pill';
import { InteractivePill } from './interactive-pill';
import { AskDock } from './ask-dock';
import { STATIC_PROJECTS, type StaticProject } from './data';

function extractTechTags(project: StaticProject): string[] {
  const text = `${project.name} ${project.description} ${project.tag}`.toLowerCase();
  const known = ['python', 'typescript', 'react', 'next.js', 'fastapi', 'three.js', 'cesiumjs',
    'docker', 'ai', 'ml', 'pinns', 'langgraph', 'mcp', 'neo4j', 'postgresql', 'ifc',
    'cloudflare', 'vercel', 'tensorflow', 'pytorch'];
  const found: string[] = [];
  const seen = new Set<string>();
  for (const t of known) {
    if (text.includes(t) && !seen.has(t)) {
      seen.add(t);
      found.push(t);
    }
  }
  return found.slice(0, 6);
}

function ProjectDetailPanel({
  project,
  onClose,
}: {
  project: StaticProject;
  onClose: () => void;
}) {
  const techTags = extractTechTags(project);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-label={`Project details: ${project.name}`}
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Project</span>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent-surface transition-colors" aria-label="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
            <Pill active>{project.tag}</Pill>
          </div>
          <p className="text-sm text-muted-foreground leading-[1.8] mb-4">{project.description}</p>

          {techTags.length > 0 && (
            <div className="mb-4">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Tech Stack</div>
              <div className="flex flex-wrap gap-1.5">
                {techTags.map((t) => (
                  <InteractivePill key={t} tech={t} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {project.url && (
              <a href={project.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground no-underline hover:bg-primary/90 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Live Demo
              </a>
            )}
            <a href={`https://github.com/search?q=${encodeURIComponent(project.name)}+user:getintheQ`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-bold text-foreground no-underline hover:border-primary hover:text-primary transition-colors">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: StaticProject;
  onClick: () => void;
}) {
  return (
    <div
      className="block p-3.5 rounded-[10px] bg-card border border-border text-muted-foreground
                 hover:border-primary hover:-translate-y-0.5 hover:bg-accent-surface
                 transition-all duration-250 cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${project.name}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="text-[13px] font-bold text-foreground">{project.name}</div>
        <Pill active>{project.tag}</Pill>
      </div>
      <div className="text-[11px] text-muted-foreground leading-[1.5] mb-1.5">{project.description}</div>
      <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/60">
        <span className="truncate">{project.url?.replace('https://', '')}</span>
        <span className="shrink-0">↗</span>
      </div>
      <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
        <Link
          href={`/projects/${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          AI Focus →
        </Link>
      </div>
    </div>
  );
}

export function ProjectsWidget() {
  const projects = STATIC_PROJECTS;
  const [selectedProject, setSelectedProject] = useState<StaticProject | null>(null);

  return (
    <section id="projects" className="max-w-[700px] mx-auto px-6 pb-20 pt-10">
      <Reveal><Label>Projects</Label></Reveal>
      <Reveal delay={0.05}>
        <h2 className="text-[28px] font-bold text-foreground mb-2" style={{ textWrap: 'balance' as any }}>Selected Work</h2>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-xs text-muted-foreground mb-6">From 50+ Vercel deployments and 47 Cloudflare Workers</p>
      </Reveal>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
        {projects.map((p, i) => (
          <Reveal key={i} delay={0.03 * i}>
            <ProjectCard project={p} onClick={() => setSelectedProject(p)} />
          </Reveal>
        ))}
      </div>

      {selectedProject && (
        <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      <Reveal delay={0.3}>
        <AskDock
          sectionId="projects"
          suggestedQuestions={[
            'Which project uses the most AI?',
            'Show me government projects',
            'What projects use TypeScript?',
          ]}
        />
      </Reveal>
    </section>
  );
}
