import { usePayReturn } from '@/controllers/usePayReturn'
import { LockRing } from '../../components/domain/LockRing'
import { ActionDock } from '../../components/ui/ActionDock'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'

/** /pay/return (design/B2-payment, "/pay/return confirming"). */
export function PayReturnPage() {
  const page = usePayReturn()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-display-lg text-text">Complete payment</h1>
      {page.state === 'unmatched' || page.state === 'not_found' ? (
        <EmptyState
          illustration="link"
          title="We can't match this payment"
          body="Open the order link we sent you by SMS to see where your payment is."
        />
      ) : (
        <>
          <section className="flex flex-col items-center gap-4 rounded-xl bg-vault p-8 text-center text-sand-0 shadow-vault">
            <LockRing state="open" />
            {page.reference && <span className="type-mono text-emerald-glow">{page.reference}</span>}
            <p role="status" aria-live="polite" className="type-title">
              {page.state === 'confirming'
                ? 'Confirming your payment…'
                : page.state === 'slow'
                  ? 'This is taking longer than usual.'
                  : "The payment didn't go through."}
            </p>
            {page.state === 'slow' && (
              <p className="type-body-sm text-emerald-100">
                We&apos;ll text you as soon as it&apos;s confirmed. You can close this page.
              </p>
            )}
          </section>
          {!page.online && (
            <Banner tone="warning" title="You're offline.">
              We&apos;ll check your payment when you&apos;re back.
            </Banner>
          )}
          {(page.state === 'slow' || page.state === 'failed') && (
            <ActionDock>
              {page.state === 'failed' ? (
                <Button fullWidth onClick={page.backToPayment}>
                  Try again
                </Button>
              ) : (
                <Button variant="secondary" fullWidth onClick={page.trackOrder}>
                  Track my order
                </Button>
              )}
            </ActionDock>
          )}
        </>
      )}
    </div>
  )
}
