'use client'

import { useMemo } from 'react'
import { GraduationCap, Award } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

export interface Credential {
  id: string
  label: string
  institution: string
  year: string
  type?: 'degree' | 'certification'
  detail?: string
}

export interface CredentialTimelineProps {
  credentials: Credential[]
  onSelect?: (id: string, label: string) => void
}

// ── Default education data ───────────────────────────────────────────────

export function defaultCredentials(): Credential[] {
  return [
    {
      id: 'edu-cs',
      label: 'B.S. Computer Science',
      institution: 'Major University',
      year: '2019',
      type: 'degree',
      detail: 'GPA 3.8, focus on distributed systems and algorithms',
    },
    {
      id: 'edu-mech',
      label: 'B.S. Mechanical Engineering',
      institution: 'Engineering University',
      year: '2015',
      type: 'degree',
      detail: 'CFD/FEA specialization, nuclear engineering coursework',
    },
    {
      id: 'cert-aws',
      label: 'AWS Solutions Architect',
      institution: 'Amazon Web Services',
      year: '2022',
      type: 'certification',
      detail: 'Professional-level certification for cloud architecture',
    },
    {
      id: 'cert-ml',
      label: 'ML Engineering Nanodegree',
      institution: 'Udacity',
      year: '2023',
      type: 'certification',
      detail: 'Production ML pipelines, MLOps, and deployment',
    },
  ]
}

// ── Main Component ───────────────────────────────────────────────────────

export function CredentialTimeline({
  credentials,
  onSelect,
}: CredentialTimelineProps) {
  const sorted = useMemo(
    () => [...credentials].sort((a, b) => parseInt(b.year) - parseInt(a.year)),
    [credentials],
  )

  const minYear = Math.min(...sorted.map((c) => parseInt(c.year)))
  const maxYear = Math.max(...sorted.map((c) => parseInt(c.year)))
  const yearSpan = maxYear - minYear || 1

  const DOT_SIZE = 12
  const LINE_W = 24
  const LABEL_LEFT = 40

  return (
    <div className="print:inline-block">
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-border print:bg-black/20"
          aria-hidden="true"
        />

        <div className="space-y-3 relative">
          {sorted.map((cred, i) => {
            const isDegree = cred.type === 'degree' || !cred.type
            const dotColor = isDegree ? 'hsl(var(--primary))' : 'hsl(var(--warning))'
            const Icon = isDegree ? GraduationCap : Award

            return (
              <div
                key={cred.id}
                className="flex items-start gap-3 relative"
              >
                {/* Dot */}
                <div className="relative z-10 flex shrink-0 items-center justify-center">
                  <div
                    className="flex items-center justify-center rounded-full border-2 border-white"
                    style={{
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      backgroundColor: dotColor,
                    }}
                  >
                    <Icon className="h-2 w-2 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-0.5">
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(cred.id, cred.label)}
                      className="block w-full text-left cursor-pointer hover:ring-1 hover:ring-border rounded-sm print:ring-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground">
                          {cred.label}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground-dim whitespace-nowrap">
                          {cred.year}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {cred.institution}
                      </p>
                      {cred.detail && (
                        <p className="text-[10px] text-muted-foreground-dim mt-0.5 leading-tight">
                          {cred.detail}
                        </p>
                      )}
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground">
                          {cred.label}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground-dim whitespace-nowrap">
                          {cred.year}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {cred.institution}
                      </p>
                      {cred.detail && (
                        <p className="text-[10px] text-muted-foreground-dim mt-0.5 leading-tight">
                          {cred.detail}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
