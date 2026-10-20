/** Shared timeline vocabulary: controllers build entries, the Timeline view renders them. */
export type TimelineActor = 'you' | 'seller' | 'vekro' | 'support'

export interface TimelineEntry {
  id: string
  /** Already formatted in EAT: "Today 14:36". */
  time?: string
  actor?: TimelineActor
  text: string
  /** One muted line under the text. */
  detail?: string
  /** A note quoted from the actor, such as the seller's dispatch note. */
  quote?: string
  /** Not happened yet: dashed and greyed. */
  upcoming?: boolean
}
