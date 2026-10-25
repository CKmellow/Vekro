import { useEffect, useState } from 'react'
import { useReducedMotionPreference } from './useReducedMotionPreference'
import { useSession } from './useSession'

/** Feature flag for the hero "Track your order" form: off until backend gaps #10 and #11 ship. */
export const TRACK_FORM_ENABLED = false

export type StoryPhase = 'locked' | 'travelling' | 'released'
const PHASES: StoryPhase[] = ['locked', 'travelling', 'released']
const PHASE_MS = 2600

/** X1 Landing (design/X1-landing). Signed-in sellers and admins go to their apps. */
export function useLanding() {
  const session = useSession()
  const reduce = useReducedMotionPreference()
  const [phase, setPhase] = useState(0)

  // An 8-second story on the hero phone; with reduced motion, one still frame.
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setPhase((p) => (p + 1) % PHASES.length), PHASE_MS)
    return () => window.clearInterval(id)
  }, [reduce])

  const redirect =
    session.status === 'authenticated' && session.role === 'seller'
      ? '/seller'
      : session.status === 'authenticated' && session.role === 'admin'
        ? '/admin'
        : null

  return {
    redirect,
    story: reduce ? ('released' as const) : (PHASES[phase] ?? 'locked'),
    trackForm: TRACK_FORM_ENABLED,
  }
}
