import * as RadixTabs from '@radix-ui/react-tabs'
import { ImagePlus, LogOut, Monitor, Smartphone } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useSettings } from '@/controllers/useSettings'
import { ABOUT_MAX, useSettingsProfile } from '@/controllers/useSettingsProfile'
import { useSettingsNotifications } from '@/controllers/useSettingsNotifications'
import { useSettingsPayout } from '@/controllers/useSettingsPayout'
import { useSettingsSecurity } from '@/controllers/useSettingsSecurity'
import { cn } from '@/lib/cn'
import { duration, spring } from '@/lib/motion'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CodeCells } from '../../components/ui/CodeCells'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TextArea, TextField } from '../../components/ui/Field'
import { PasswordField } from '../../components/ui/PasswordField'
import { PhoneField } from '../../components/ui/PhoneField'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { Switch } from '../../components/ui/Switch'

type Profile = ReturnType<typeof useSettingsProfile>
type Payout = ReturnType<typeof useSettingsPayout>
type Notifications = ReturnType<typeof useSettingsNotifications>
type Security = ReturnType<typeof useSettingsSecurity>

function LoadError({ what, retry }: { what: string; retry: () => void }) {
  return (
    <Banner
      tone="danger"
      title={`We couldn't load your ${what}.`}
      action={
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      }
    />
  )
}

function ProfileTab({ p }: { p: Profile }) {
  if (p.state === 'loading')
    return (
      <SkeletonGroup label="Loading your profile">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
      </SkeletonGroup>
    )
  if (p.state === 'error') return <LoadError what="profile" retry={p.retry} />
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        p.save()
      }}
      className="flex flex-col gap-5"
    >
      {p.error && <Banner tone="danger" title={p.error} />}
      <div className="flex items-center gap-5">
        <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-50 text-emerald-700">
          {p.logoUrl ? (
            <img src={p.logoUrl} alt="Shop logo" className="size-full object-cover" />
          ) : (
            <span aria-hidden="true" className="type-headline">
              {p.initials}
            </span>
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <label className="type-body-md inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 font-semibold text-text hover:bg-sand-100 has-focus-visible:outline-3 has-focus-visible:outline-emerald-400">
            <ImagePlus aria-hidden="true" className="size-4" />
            Upload logo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={p.saving}
              onChange={(e) => {
                p.pickLogo(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
          {p.logoUrl && (
            <Button variant="ghost" onClick={p.clearLogo} disabled={p.saving}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <TextField
        label="Shop name"
        value={p.values.shopName}
        onChange={(e) => p.set('shopName', e.target.value)}
        error={p.errors.shopName}
        readOnly={p.saving}
        maxLength={60}
      />
      <TextField
        label="City or area"
        value={p.values.shopArea}
        onChange={(e) => p.set('shopArea', e.target.value)}
        error={p.errors.shopArea}
        readOnly={p.saving}
        placeholder="Kilimani, Nairobi"
      />
      <TextArea
        label="About your shop"
        value={p.values.shopAbout}
        onChange={(e) => p.set('shopAbout', e.target.value)}
        error={p.errors.shopAbout}
        readOnly={p.saving}
        maxLength={ABOUT_MAX}
        rows={4}
      />
    </form>
  )
}

function PayoutTab({ p }: { p: Payout }) {
  const reduce = useReducedMotion()
  if (p.state === 'loading')
    return (
      <SkeletonGroup label="Loading your payout details">
        <Skeleton className="h-32 w-full rounded-lg" />
      </SkeletonGroup>
    )
  if (p.state === 'error') return <LoadError what="payout details" retry={p.retry} />
  const fade = {
    initial: reduce ? false : { opacity: 0 },
    animate: { opacity: 1 },
    exit: reduce ? undefined : { opacity: 0 },
    transition: { duration: reduce ? 0 : duration.state },
  }
  return (
    <div className="flex flex-col gap-5">
      {p.error && <Banner tone="danger" title={p.error} />}
      {p.locked && (
        <Banner tone="warning" title={`Too many tries. Try again in ${p.lockedFor}.`}>
          For your security, wait for the timer before asking for a new code.
        </Banner>
      )}
      <AnimatePresence mode="wait" initial={false}>
        {p.step === 'view' && (
          <m.div
            key="view"
            {...fade}
            className="flex flex-wrap items-start gap-4 rounded-lg border border-border p-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
              <Smartphone aria-hidden="true" className="size-5" />
            </span>
            <div className="flex min-w-48 flex-1 flex-col gap-1">
              <p className="type-label text-text-muted">M-Pesa payout number</p>
              <p className="type-mono text-body-lg text-text">{p.maskedCurrent}</p>
              {p.accountName && <p className="type-body-sm text-text-muted">{p.accountName}</p>}
              <p className="type-body-sm text-text-muted">Payouts go here after buyers accept their items.</p>
            </div>
            <Button variant="secondary" onClick={p.start} disabled={!p.online}>
              Change
            </Button>
          </m.div>
        )}
        {p.step === 'enter' && (
          <m.form
            key="enter"
            {...fade}
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              p.send()
            }}
            className="flex flex-col gap-5"
          >
            <PhoneField
              label="New M-Pesa number"
              value={p.phone}
              onChange={p.setPhone}
              error={p.errors.phone}
            />
            <PhoneField
              label="Type it again"
              value={p.confirm}
              onChange={p.setConfirm}
              error={p.errors.confirm}
            />
            <TextField
              label="Name on the M-Pesa account"
              value={p.name}
              onChange={(e) => p.setName(e.target.value)}
              error={p.errors.name}
            />
            {p.needsCode && (
              <p className="type-body-sm text-text-muted">
                We'll text a code to the new number to confirm it's yours.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={p.sending} disabled={p.locked || !p.online}>
                {p.needsCode ? 'Send code' : 'Save number'}
              </Button>
              <Button variant="ghost" onClick={p.cancel}>
                Cancel
              </Button>
            </div>
          </m.form>
        )}
        {p.step === 'code' && (
          <m.div key="code" {...fade} className="flex flex-col gap-5">
            <CodeCells
              label={`Enter the code we sent to ${p.maskedNew}`}
              value={p.code}
              onChange={p.setCode}
              onComplete={p.submitCode}
              disabled={p.verifying || p.locked}
              error={
                p.problem === 'wrong'
                  ? "That code doesn't match. Check the SMS and try again."
                  : p.problem === 'expired'
                    ? 'That code has expired. Send a new one.'
                    : undefined
              }
            />
            {p.verifying && (
              <p role="status" className="type-body-sm text-text-muted">
                Confirming your number…
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {p.resendIn ? (
                <p className="type-body-md text-text-muted">
                  Resend in <span className="type-mono">{p.resendIn}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={p.resend}
                  disabled={!p.canResend}
                  className="type-body-md min-h-11 font-semibold text-primary disabled:text-ink-400"
                >
                  Resend code
                </button>
              )}
              <Button variant="ghost" onClick={p.cancel}>
                Cancel
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
      <p className="type-body-sm rounded-md bg-saffron-50 px-4 py-3 text-saffron-700">
        Payouts that haven't been sent yet will go to the new number. Vekro texts your old number when it
        changes.
      </p>
    </div>
  )
}

function NotificationsTab({ p }: { p: Notifications }) {
  if (p.state === 'loading')
    return (
      <SkeletonGroup label="Loading your notification settings">
        <Skeleton className="h-48 w-full rounded-lg" />
      </SkeletonGroup>
    )
  if (p.state === 'error') return <LoadError what="notification settings" retry={p.retry} />
  return (
    <div className="flex flex-col gap-4">
      {p.error && <Banner tone="danger" title={p.error} />}
      <p className="type-body-md text-text-muted">Choose how Vekro tells you about your orders.</p>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Notifications by type and channel</caption>
        <thead className="type-label text-text-muted">
          <tr>
            <th scope="col" className="py-2">
              Type
            </th>
            <th scope="col" className="w-20 py-2 text-center">
              In-app
            </th>
            <th scope="col" className="w-20 py-2 text-center">
              SMS
            </th>
          </tr>
        </thead>
        <tbody>
          {p.rows.map((row) => (
            <tr key={row.category} className="border-t border-border">
              <th scope="row" className="type-body-md py-2 pr-3 font-semibold text-text">
                {row.label}
              </th>
              <td className="py-2 text-center">
                <Switch
                  label={`${row.label} in the app`}
                  checked={row.inApp}
                  onChange={() => p.toggle(row.category, 'inApp')}
                  disabled={row.inAppLocked || p.saving}
                  title={row.inAppLocked ? 'Support decisions are always shown in the app' : undefined}
                />
              </td>
              <td className="py-2 text-center">
                <Switch
                  label={`${row.label} by SMS`}
                  checked={row.sms}
                  onChange={() => p.toggle(row.category, 'sms')}
                  disabled={p.saving}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="type-body-sm text-text-muted">Support decisions are always shown in the app.</p>
    </div>
  )
}

function SecurityTab({ p }: { p: Security }) {
  return (
    <div className="flex flex-col gap-8">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          p.update()
        }}
        className="flex flex-col gap-5"
        aria-labelledby="change-password"
      >
        <h2 id="change-password" className="type-headline text-text">
          Change password
        </h2>
        {p.error && <Banner tone="danger" title={p.error} />}
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={p.current}
          onChange={(e) => p.setCurrent(e.target.value)}
          error={p.errors.current}
        />
        <PasswordField
          label="New password"
          autoComplete="new-password"
          value={p.next}
          onChange={(e) => p.setNext(e.target.value)}
          error={p.errors.next}
          strength={p.strength}
          rules={p.next ? p.rules : undefined}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          value={p.confirm}
          onChange={(e) => p.setConfirm(e.target.value)}
          error={p.errors.confirm}
        />
        <div>
          <Button type="submit" variant="secondary" loading={p.updating}>
            Update password
          </Button>
        </div>
        <p className="type-body-sm text-text-muted">Changing it signs out your other devices.</p>
      </form>

      <section aria-labelledby="devices" className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 id="devices" className="type-headline text-text">
          Signed-in devices
        </h2>
        {p.sessionsState === 'loading' && (
          <SkeletonGroup label="Loading your devices">
            <Skeleton className="h-16 w-full rounded-md" />
          </SkeletonGroup>
        )}
        {p.sessionsState === 'error' && <LoadError what="devices" retry={p.retrySessions} />}
        {p.sessionsState === 'ready' && (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {p.devices.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-sand-100 text-ink-600">
                  {/Android|iPhone|iPad/.test(d.device) ? (
                    <Smartphone aria-hidden="true" className="size-5" />
                  ) : (
                    <Monitor aria-hidden="true" className="size-5" />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="type-body-md truncate font-semibold text-text">{d.device}</span>
                  <span className="type-body-sm text-text-muted">{d.seen}</span>
                </div>
                {d.current ? (
                  <span className="type-body-sm rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                    This device
                  </span>
                ) : (
                  <Button variant="ghost" onClick={() => p.revoke(d.id)} loading={p.revoking === d.id}>
                    Sign out<span className="sr-only"> {d.device}</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {p.hasOthers && (
          <div>
            <Button variant="secondary" onClick={p.revokeOthers} loading={p.revokingOthers}>
              Sign out other devices
            </Button>
          </div>
        )}
      </section>

      <div className="border-t border-border pt-6">
        <Button variant="danger" onClick={p.logOut} loading={p.loggingOut}>
          <LogOut aria-hidden="true" className="size-4" />
          Log out
        </Button>
      </div>
    </div>
  )
}

/** S13 Settings (design/S13-settings). Route /seller/settings?tab=. */
export function SettingsPage() {
  const profile = useSettingsProfile()
  const payout = useSettingsPayout()
  const notifications = useSettingsNotifications()
  const security = useSettingsSecurity()
  const s = useSettings({
    dirty: profile.dirty || notifications.dirty,
    discard: () => {
      profile.discard()
      notifications.discard()
    },
  })
  const reduce = useReducedMotion()
  // Profile and Notifications save from the bar; Payout and Security have their own confirm steps.
  const bar =
    s.tab === 'profile' && profile.dirty
      ? profile
      : s.tab === 'notifications' && notifications.dirty
        ? {
            save: () => void notifications.save(),
            discard: notifications.discard,
            saving: notifications.saving,
          }
        : null

  return (
    <div className="flex flex-col gap-6 pb-24">
      <title>Settings · Vekro</title>
      <h1 className="type-display-lg text-text">Settings</h1>
      {!profile.online && (
        <Banner tone="warning" title="You're offline.">
          Saving is paused until you're connected.
        </Banner>
      )}
      <RadixTabs.Root
        value={s.tab}
        onValueChange={s.setTab}
        orientation="vertical"
        className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"
      >
        <RadixTabs.List
          aria-label="Settings"
          className="flex gap-1 overflow-x-auto rounded-md bg-sand-100 p-1 lg:flex-col lg:self-start lg:bg-transparent lg:p-0"
        >
          {s.tabs.map((t) => (
            <RadixTabs.Trigger
              key={t.value}
              value={t.value}
              className={cn(
                'type-body-md min-h-11 shrink-0 rounded-sm px-4 text-left font-semibold whitespace-nowrap text-text-muted',
                'transition-colors duration-(--duration-state) hover:text-text',
                'data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-1',
              )}
            >
              {t.label}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>
        <Card className="p-6 sm:p-8">
          <RadixTabs.Content value="profile">
            <ProfileTab p={profile} />
          </RadixTabs.Content>
          <RadixTabs.Content value="payout">
            <PayoutTab p={payout} />
          </RadixTabs.Content>
          <RadixTabs.Content value="notifications">
            <NotificationsTab p={notifications} />
          </RadixTabs.Content>
          <RadixTabs.Content value="security">
            <SecurityTab p={security} />
          </RadixTabs.Content>
        </Card>
      </RadixTabs.Root>

      <AnimatePresence>
        {bar && (
          <m.div
            initial={reduce ? false : { y: 96 }}
            animate={{ y: 0 }}
            exit={reduce ? undefined : { y: 96 }}
            transition={reduce ? { duration: 0 } : spring}
            className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface/85 backdrop-blur-lg lg:bottom-0 lg:left-66"
          >
            <div className="mx-auto flex max-w-300 items-center justify-between gap-3 px-5 py-3">
              <p className="type-body-md text-text">
                <span className="hidden sm:inline">You have unsaved changes</span>
                <span className="sm:hidden">Unsaved changes</span>
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={bar.discard} disabled={bar.saving}>
                  Discard
                </Button>
                <Button
                  onClick={bar.save}
                  loading={bar.saving}
                  disabled={!profile.online}
                  className="whitespace-nowrap"
                >
                  Save changes
                </Button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={s.confirmOpen}
        onOpenChange={(open) => !open && s.keepEditing()}
        title="Discard your changes?"
        body="Your edits to this tab haven't been saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={s.confirmDiscard}
        destructive
      />
    </div>
  )
}
