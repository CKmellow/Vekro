import type { GoogleAccountNotice } from '@/controllers/useGoogleAccount'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { GoogleMark } from './GoogleButton'

const NOTICES: Record<
  Exclude<GoogleAccountNotice, null>,
  { tone: 'info' | 'danger' | 'warning'; title: string }
> = {
  linked: { tone: 'info', title: 'Google is linked. You can log in with it next time.' },
  taken: { tone: 'danger', title: 'That Google account is already linked to another Vekro account.' },
  denied: {
    tone: 'warning',
    title:
      "Google didn't let that account in. While Vekro's Google sign-in is in testing, only invited accounts can use it.",
  },
  failed: { tone: 'danger', title: "We couldn't link Google. Try again in a moment." },
  password_needed: {
    tone: 'warning',
    title: 'Google is your only way in. Set a password first (Forgot password on the log in page).',
  },
}

/** Settings: link or unlink Google (#312). Never linked by e-mail; only from a signed-in session. */
export function GoogleAccountCard({
  linkedEmail,
  notice,
  linking,
  unlinking,
  onLink,
  onUnlink,
}: {
  linkedEmail: string | null
  notice: GoogleAccountNotice
  linking: boolean
  unlinking: boolean
  onLink: () => void
  onUnlink: () => void
}) {
  return (
    <section aria-labelledby="google-account" className="flex flex-col gap-4">
      <h2 id="google-account" className="type-headline text-text">
        Google sign-in
      </h2>
      {notice && <Banner tone={NOTICES[notice].tone} title={NOTICES[notice].title} />}
      <div className="flex flex-wrap items-center gap-3">
        <GoogleMark />
        <p className="type-body-md min-w-0 flex-1 text-text">
          {linkedEmail ? (
            <>
              Linked to <span className="font-semibold break-all">{linkedEmail}</span>
            </>
          ) : (
            'Log in with your Google account as well as your phone.'
          )}
        </p>
        {linkedEmail ? (
          <Button variant="secondary" onClick={onUnlink} loading={unlinking}>
            Unlink
          </Button>
        ) : (
          <Button variant="secondary" onClick={onLink} loading={linking}>
            Link Google
          </Button>
        )}
      </div>
    </section>
  )
}
