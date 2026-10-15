import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Decorative "under construction" scene: a tower crane lowers the emerald Vekro block onto a stack
 * of sand blocks behind a hazard barrier. Pure SVG in theme tokens; the loop stops under reduced
 * motion and leaves the block resting on the stack.
 */
export function ConstructionScene({ className }: { className?: string }) {
  const id = useId()
  const stripes = `${id}-stripes`
  const belowJib = `${id}-below-jib`

  return (
    <svg viewBox="0 0 240 176" aria-hidden="true" className={cn('h-auto w-64 sm:w-72', className)}>
      <defs>
        <pattern
          id={stripes}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="12" height="12" className="fill-saffron-500" />
          <rect width="6" height="12" className="fill-ink-800" />
        </pattern>
        {/* The cable only shows below the jib, so it shortens as the block comes down. */}
        <clipPath id={belowJib}>
          <rect x="0" y="39" width="240" height="140" />
        </clipPath>
      </defs>

      {/* Ground */}
      <line
        x1="12"
        y1="160"
        x2="228"
        y2="160"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-ink-400"
      />

      {/* Crane mast: lattice tower */}
      <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fill-none stroke-ink-800">
        <path d="M170 160V34M184 160V34" />
        <path d="M170 150l14-14-14-14 14-14-14-14 14-14-14-14 14-14-14-14" strokeWidth="1.5" />
        {/* Apex and ties */}
        <path d="M170 34l7-20 7 20M177 14L64 32M177 14l33 18" strokeWidth="1.5" />
        {/* Jib: top and bottom chords with lattice */}
        <path d="M60 32h150M60 38h150" />
        <path
          d="M64 38l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6"
          strokeWidth="1.25"
        />
      </g>
      {/* Counterweight, cab and trolley */}
      <rect
        x="196"
        y="38"
        width="16"
        height="14"
        rx="2"
        className="fill-sand-300 stroke-ink-800"
        strokeWidth="2"
      />
      <rect x="166" y="40" width="22" height="14" rx="3" className="fill-primary" />
      <rect x="170" y="43" width="8" height="6" rx="1" className="fill-emerald-50" />
      <rect x="104" y="37" width="16" height="5" rx="1.5" className="fill-ink-800" />

      {/* Stack the block lands on */}
      <rect
        x="88"
        y="138"
        width="48"
        height="22"
        rx="3"
        className="fill-sand-200 stroke-ink-600"
        strokeWidth="2"
      />
      <rect
        x="88"
        y="116"
        width="48"
        height="22"
        rx="3"
        className="fill-sand-100 stroke-ink-600"
        strokeWidth="2"
      />
      <path d="M112 116v22M100 138v22M124 138v22" strokeWidth="1.5" className="stroke-ink-400" />

      {/* Load: cable, hook, slings and the Vekro block, moved together */}
      <g clipPath={`url(#${belowJib})`}>
        <g className="animate-crane-load">
          <line x1="112" y1="0" x2="112" y2="76" strokeWidth="1.5" className="stroke-ink-800" />
          <path
            d="M112 76v5a3 3 0 1 1-3-3"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-ink-800"
          />
          <path d="M112 82L94 88M112 82l18 6" strokeWidth="1.5" className="stroke-ink-600" />
          <rect x="92" y="86" width="40" height="30" rx="4" className="fill-primary" />
          <path
            d="M104 94l8 14 8-14"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-sand-0"
          />
        </g>
      </g>

      {/* Hazard barrier in front of the stack */}
      <g>
        <path d="M40 160v-18M98 160v-18" strokeWidth="3" strokeLinecap="round" className="stroke-ink-800" />
        <rect x="30" y="136" width="78" height="12" rx="2" fill={`url(#${stripes})`} />
        <rect
          x="30"
          y="136"
          width="78"
          height="12"
          rx="2"
          fill="none"
          strokeWidth="1.5"
          className="stroke-ink-800"
        />
      </g>
    </svg>
  )
}
