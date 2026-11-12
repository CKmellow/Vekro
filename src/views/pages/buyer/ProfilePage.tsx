import { Link } from 'react-router'
import { useBuyerProfile } from '@/controllers/useBuyerProfile'
import { useSettingsSecurity } from '@/controllers/useSettingsSecurity'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { CodeCells } from '../../components/ui/CodeCells'
import { TextField } from '../../components/ui/Field'
import { PasswordField } from '../../components/ui/PasswordField'
import { PhoneField } from '../../components/ui/PhoneField'
import { Sheet } from '../../components/ui/Sheet'
import { Skeleton } from '../../components/ui/Skeleton'
import { Switch } from '../../components/ui/Switch'
import { GoogleSection, SecurityTab } from '../seller/SettingsPage'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="type-title text-text">{title}</h2>
      {children}
    </Card>
  )
}

/** B12 Profile & security (design/B12-profile-security). Route /buyer/profile. */
export function ProfilePage() {
  const p = useBuyerProfile()
  const security = useSettingsSecurity()
  if (!p.ready) return <Skeleton className="h-96 w-full" />

  return (
    <div className="mx-auto flex w-full max-w-160 flex-col gap-5">
      <title>Profile & security · Vekro</title>
      <h1 className="type-headline text-text">Profile & security</h1>

      <Section title="Profile">
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            p.saveName()
          }}
        >
          <TextField
            label="Your name"
            value={p.name}
            onChange={(e) => p.setName(e.target.value)}
            autoComplete="name"
          />
          {p.nameDirty && (
            <Button type="submit" className="self-start" loading={p.savingName}>
              Save name
            </Button>
          )}
        </form>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="flex flex-col">
            <span className="type-body-sm text-text-muted">Sign-in phone</span>
            <span className="type-body-md font-mono text-text">{p.phoneMasked}</span>
          </span>
          <Button variant="secondary" onClick={() => p.phone.setOpen(true)}>
            Change
          </Button>
        </div>
        {p.googleEmail && (
          <p className="type-body-sm text-text-muted">
            Google e-mail: <span className="text-text">{p.googleEmail}</span>
          </p>
        )}
      </Section>

      <Section title="Sign-in methods">
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="type-body-md text-text">Sign in with an SMS code</span>
            <span className="type-body-sm text-text-muted">A one-time code sent to your phone.</span>
          </span>
          <Switch
            label="Sign in with an SMS code"
            checked={p.sms.enabled}
            disabled={p.sms.saving}
            onChange={() => p.sms.toggle(!p.sms.enabled)}
          />
        </div>
        {p.sms.error && <Banner tone="danger" title={p.sms.error} />}
        {!p.hasPassword && (
          <Banner tone="info" title="You haven't set a password yet.">
            <Link to="/forgot-password" className="font-semibold text-primary">
              Set a password
            </Link>
          </Banner>
        )}
        <GoogleSection />
      </Section>

      <Section title="Password and devices">
        <SecurityTab p={security} />
      </Section>

      <Section title="USSD PIN">
        <p className="type-body-sm text-text-muted">
          The 4-digit PIN Vekro asks for before sensitive actions when you use USSD on a feature phone.
        </p>
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            p.pin.save()
          }}
        >
          <TextField
            label="New USSD PIN"
            value={p.pin.value}
            onChange={(e) => p.pin.setValue(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
          />
          <PasswordField
            label="Your password"
            value={p.pin.password}
            onChange={(e) => p.pin.setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {p.pin.error && <Banner tone="danger" title={p.pin.error} />}
          <Button type="submit" variant="secondary" className="self-start" loading={p.pin.saving}>
            Save PIN
          </Button>
        </form>
      </Section>

      <Section title="Selling">
        {p.hasStore ? (
          <Link to="/seller" className="type-body-md font-semibold text-primary">
            Go to your store
          </Link>
        ) : (
          <Link to="/buyer/start-selling" className="type-body-md font-semibold text-primary">
            Start selling on this account
          </Link>
        )}
      </Section>

      <Sheet
        open={p.phone.open}
        onOpenChange={p.phone.setOpen}
        title="Change your sign-in number"
        description={
          p.phone.step === 'number'
            ? "We'll text a code to the new number."
            : 'Enter the 6-digit code we sent to the new number.'
        }
        footer={
          p.phone.step === 'number' ? (
            <Button fullWidth onClick={p.phone.send} loading={p.phone.sending}>
              Send code
            </Button>
          ) : undefined
        }
      >
        {p.phone.step === 'number' ? (
          <PhoneField
            label="New phone number"
            value={p.phone.value}
            onChange={p.phone.setValue}
            error={p.phone.error ?? undefined}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <CodeCells
              label="Code"
              value={p.phone.code}
              onChange={p.phone.setCode}
              onComplete={p.phone.confirm}
              error={p.phone.error ?? undefined}
              disabled={p.phone.confirming}
            />
          </div>
        )}
      </Sheet>
    </div>
  )
}
