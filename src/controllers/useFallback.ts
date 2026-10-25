import { useEffect, useRef } from 'react'
import { useOnline } from './useOnline'
import { useSession } from './useSession'

/** X2 404: signed-in sellers go back to their dashboard; everyone else to the home page. */
export function useNotFound() {
  const session = useSession()
  const seller = session.status === 'authenticated' && session.role === 'seller'
  return {
    home: seller ? { label: 'Go to your dashboard', to: '/seller' } : { label: 'Go home', to: '/' },
  }
}

/** X2 offline: Try again reloads, and the page reloads by itself once the browser is back online. */
export function useOffline(reload: () => void = () => window.location.reload()) {
  const online = useOnline()
  const wasOffline = useRef(!online)
  useEffect(() => {
    // Only the change from offline back to online reloads, never the first render.
    if (!online) wasOffline.current = true
    else if (wasOffline.current) {
      wasOffline.current = false
      reload()
    }
  }, [online, reload])
  return { retry: reload }
}
