import { Controller, type UseFormReturn } from 'react-hook-form'
import type { PayIdentity, PayValues } from '@/controllers/usePayPage'
import type { PasswordRule, PasswordStrength } from '../../../components/ui/PasswordField'

import { Banner } from '../../../components/ui/Banner'
import { TextField } from '../../../components/ui/Field'
import { PasswordField } from '../../../components/ui/PasswordField'
import { PhoneField } from '../../../components/ui/PhoneField'
import { Skeleton } from '../../../components/ui/Skeleton'

export interface DetailsSectionProps {
  identity: PayIdentity
  form: UseFormReturn<PayValues>
  notice: string | null
  passwordHints: { strength: PasswordStrength; rules: PasswordRule[] } | null
  onSwitchMode: () => void
  onNotYou: () => void
}

const ghost = 'type-body-sm min-h-12 self-start font-semibold text-primary'

/** "Save your details to track this order" (FRONTEND_CONTRACT A): compact register or log in, or who is paying. */
export function DetailsSection({
  identity,
  form,
  notice,
  passwordHints,
  onSwitchMode,
  onNotYou,
}: DetailsSectionProps) {
  if (identity.kind === 'checking') return <Skeleton className="h-24 w-full rounded-md" />

  if (identity.kind === 'buyer')
    return (
      <p className="type-body-md flex flex-wrap items-center gap-x-2 text-text">
        Paying as <span className="type-mono font-semibold">{identity.phoneMasked}</span>
        <button type="button" onClick={onNotYou} className={ghost}>
          Not you?
        </button>
      </p>
    )

  if (identity.kind === 'wrong_role')
    return (
      <Banner
        tone="escalation"
        title="This account can't pay for items"
        action={
          <button type="button" onClick={onNotYou} className={ghost}>
            Log out
          </button>
        }
      >
        You&apos;re logged in as a seller or admin. Log out to pay as a buyer.
      </Banner>
    )

  const register = identity.mode === 'register'
  const { errors } = form.formState
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="type-title text-text">
          {register ? 'Save your details to track this order' : 'Welcome back'}
        </h2>
        <p className="type-body-sm text-text-muted">
          {register
            ? "We'll send the M-Pesa prompt to this number and text you a link to track your order."
            : 'Log in with your Vekro phone number and password to pay.'}
        </p>
      </div>
      {notice && <Banner tone="warning" title={notice} />}
      <Controller
        control={form.control}
        name="phone"
        render={({ field, fieldState }) => (
          <PhoneField
            label="M-Pesa phone number"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      {register && (
        <TextField
          label="Your name"
          autoComplete="name"
          error={errors.name?.message}
          {...form.register('name')}
        />
      )}
      <PasswordField
        label={register ? 'Create a password' : 'Password'}
        autoComplete={register ? 'new-password' : 'current-password'}
        error={errors.password?.message}
        {...(passwordHints ?? {})}
        {...form.register('password')}
      />
      <button type="button" onClick={onSwitchMode} className={ghost}>
        {register ? 'Already have a Vekro account? Log in' : 'New to Vekro? Save your details instead'}
      </button>
    </div>
  )
}
