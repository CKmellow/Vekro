import { Banner } from './Banner'

/** "You're offline." with how old the shown data is, for pages that keep showing what they last loaded. */
export function OfflineBanner({ since, note }: { since: string | null; note?: string }) {
  if (!since) return null
  return (
    <Banner tone="warning" title="You're offline.">
      Showing the last update at <span className="font-mono tabular-nums">{since}</span>.
      {note ? ` ${note}` : ''}
    </Banner>
  )
}
