/** Motion tokens (DESIGN.md, Motion & Microinteractions) for the motion library. */
export const spring = { type: 'spring', stiffness: 300, damping: 28 } as const
export const ease = [0.2, 0, 0, 1] as const
/** Seconds, as the motion library expects. */
export const duration = { tap: 0.12, state: 0.22, sheet: 0.36, moment: 0.6, countUp: 0.7 } as const
