import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { ApiError } from '@/models/api/errors'
import { useGoogleEnabled, useStartGoogleLink, useUnlinkGoogle } from '@/models/queries/google'
import { useSignedInUser } from '@/models/queries/session'

export type GoogleAccountNotice = 'linked' | 'taken' | 'denied' | 'failed' | 'password_needed' | null

/** What came back from Google's page (`?google=` on this settings page). */
export function noticeFor(result: string | null): GoogleAccountNotice {
  if (!result) return null
  if (result === 'linked' || result === 'taken' || result === 'denied') return result
  return 'failed'
}

/**
 * Link or unlink Google in settings (#312, backend #324): only while signed in; never by e-mail. Linking
 * leaves for Google's page and comes back here. Unlinking is refused while Google is the only way in.
 */
export function useGoogleAccount() {
  const { pathname, search } = useLocation()
  const [params] = useSearchParams()
  const user = useSignedInUser()
  const enabled = useGoogleEnabled().data === true
  const link = useStartGoogleLink()
  const unlink = useUnlinkGoogle()
  const [notice, setNotice] = useState<GoogleAccountNotice>(noticeFor(params.get('google')))

  return {
    show: enabled || Boolean(user?.google_email),
    linkedEmail: user?.google_email ?? null,
    notice,
    linking: link.isPending,
    unlinking: unlink.isPending,
    link: () => {
      setNotice(null)
      // Back to this page and tab (e.g. ?tab=security), without an old ?google= result.
      const query = new URLSearchParams(search)
      query.delete('google')
      const back = query.size ? `${pathname}?${query}` : pathname
      link.mutate(back, {
        onSuccess: (url) => window.location.assign(url),
        onError: () => setNotice('failed'),
      })
    },
    unlink: () => {
      setNotice(null)
      unlink.mutate(undefined, {
        onError: (error) =>
          setNotice(error instanceof ApiError && error.kind === 'conflict' ? 'password_needed' : 'failed'),
      })
    },
  }
}
