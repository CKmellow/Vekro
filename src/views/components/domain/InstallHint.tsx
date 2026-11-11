import { Smartphone, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

/** X1 "Install Vekro" (#304): shown only when Chrome on Android offers installation. */
export function InstallHint({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return (
    <Card role="region" aria-label="Install Vekro" className="flex items-start gap-3">
      <Smartphone aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <p className="type-title font-semibold text-text">Install Vekro</p>
          <p className="type-body text-text-muted">
            Add it to your home screen. It opens like an app, without the browser bar.
          </p>
        </div>
        <div>
          <Button onClick={onInstall}>Install</Button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Not now"
        className="-m-2 inline-flex size-11 items-center justify-center rounded-md text-text-muted hover:text-text"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </Card>
  )
}
