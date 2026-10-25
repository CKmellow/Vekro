import { useMemo, useState } from 'react'
import { HELP, type HelpSection } from '@/lib/help'
import { reportPageHref, supportContacts, supportHours } from '@/lib/support'
import { useSession } from './useSession'

/** Sections with only the questions whose question or answer contains every word of the search. */
export function filterHelp(sections: HelpSection[], search: string): HelpSection[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return sections
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => {
        const text = `${i.q} ${i.a}`.toLowerCase()
        return words.every((w) => text.includes(w))
      }),
    }))
    .filter((s) => s.items.length > 0)
}

/** X3 Help and support (design/X3-help). Route /help. Static content; works offline. */
export function useHelp() {
  const session = useSession()
  const [search, setSearch] = useState('')
  // One open question per group, keyed by group title.
  const [open, setOpen] = useState<Record<string, string | undefined>>({})
  const sections = useMemo(() => filterHelp(HELP, search), [search])
  const matches = sections.reduce((n, s) => n + s.items.length, 0)
  const searching = search.trim().length > 0
  const buyer = session.status === 'authenticated' && session.role === 'buyer'

  return {
    search,
    setSearch,
    clearSearch: () => setSearch(''),
    sections,
    searching,
    noResults: searching && matches === 0,
    resultsLabel: searching ? `${matches} ${matches === 1 ? 'answer' : 'answers'} found` : '',
    isOpen: (group: string, id: string) => open[group] === id,
    toggle: (group: string, id: string) =>
      setOpen((o) => ({ ...o, [group]: o[group] === id ? undefined : id })),
    ordersTo: buyer ? '/buyer/orders' : '/buyer/sign-in',
    contacts: supportContacts(),
    hours: supportHours(),
    reportHref: reportPageHref(window.location.href),
  }
}
