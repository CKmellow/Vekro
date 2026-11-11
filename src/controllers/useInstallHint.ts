import { useState, useSyncExternalStore } from 'react'
import { installPromptAvailable, promptInstall, subscribeInstallPrompt } from '@/app/installPrompt'
import { dismissInstallHint, installHintDismissed } from '@/lib/installHint'

const standalone = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches

/** X1 "Install Vekro" hint (#304): Android Chrome only, until installed or dismissed on this device. */
export function useInstallHint() {
  const available = useSyncExternalStore(subscribeInstallPrompt, installPromptAvailable, () => false)
  const [dismissed, setDismissed] = useState(installHintDismissed)
  return {
    show: available && !dismissed && !standalone(),
    install: () => {
      void promptInstall().then((outcome) => {
        if (outcome === 'dismissed') {
          dismissInstallHint()
          setDismissed(true)
        }
      })
    },
    dismiss: () => {
      dismissInstallHint()
      setDismissed(true)
    },
  }
}
