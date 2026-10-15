import { Controller } from 'react-hook-form'
import { Link } from 'react-router'
import { useAuthShowcase } from '@/controllers/useAuthShowcase'
import { useSignUp } from '@/controllers/useSignUp'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Choice'
import { TextField } from '../../components/ui/Field'
import { PasswordField } from '../../components/ui/PasswordField'
import { PhoneField } from '../../components/ui/PhoneField'
import { AuthLayout } from '../../layouts/AuthLayout'

/** S1 Sign up (design/S1-sign-up). */
export function SignUpPage() {
  const vault = useAuthShowcase()
  const { form, onSubmit, submitting, serverError, phoneTaken, strength, rules } = useSignUp()
  const { register, control, formState, watch } = form
  const errors = formState.errors
  const matches = watch('confirmPassword') !== '' && watch('confirmPassword') === watch('password')

  return (
    <AuthLayout
      headline="Sell on social media without getting scammed"
      lead="Buyers pay into a vault locked to the order. You're paid when they accept the item."
      benefits
      vault={vault}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="type-headline text-text">Create your seller account</h2>
          <p className="type-body-md text-text-muted">It takes under a minute.</p>
        </div>

        {serverError && (
          <Banner
            tone="danger"
            title="We couldn't create your account"
            action={
              <Button variant="secondary" type="submit" className="h-10 px-3 text-body-sm">
                Try again
              </Button>
            }
          >
            {serverError}
          </Banner>
        )}

        <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <PhoneField
                label="Phone number"
                hint="You'll log in with this number. We also text payout updates here."
                error={errors.phone?.message}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              {phoneTaken && (
                <Link to="/login" className="type-body-sm self-start font-semibold text-primary underline">
                  Log in instead
                </Link>
              )}
            </div>
          )}
        />
        <TextField
          label="Shop name (optional)"
          autoComplete="organization"
          error={errors.shopName?.message}
          {...register('shopName')}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          strength={strength}
          rules={rules}
          {...register('password')}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          confirmation={matches ? 'Passwords match' : undefined}
          {...register('confirmPassword')}
        />
        <div className="flex flex-col gap-1">
          <Checkbox {...register('terms')} aria-invalid={errors.terms ? true : undefined}>
            I agree to the{' '}
            <Link to="/help" className="font-semibold text-primary underline">
              Terms and Privacy Policy
            </Link>
          </Checkbox>
          {errors.terms && (
            <p role="alert" className="type-body-sm text-coral-600">
              {errors.terms.message}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth loading={submitting}>
          Create account
        </Button>
        <p className="type-body-md text-center text-text-muted">
          Already selling with Vekro?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
