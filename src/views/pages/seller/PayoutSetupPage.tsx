import { ArrowRight, ImagePlus, MapPin, Package, Share2, ShieldCheck, Wallet } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { Link } from 'react-router'
import { usePayoutSetup } from '@/controllers/usePayoutSetup'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { LockRing } from '../../components/domain/LockRing'
import { Stepper } from '../../components/domain/Stepper'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, TextArea, TextField } from '../../components/ui/Field'
import { MoneyText } from '../../components/ui/MoneyText'
import { PhoneField } from '../../components/ui/PhoneField'
import { VekroMark } from '../../components/ui/VekroMark'

const selectClass =
  'type-body-lg h-14 w-full appearance-none rounded-md border border-border bg-surface px-4 text-text focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none'

/** S3 Payout setup (design/S3-payout-setup). */
export function PayoutSetupPage() {
  const s = usePayoutSetup()
  const { register, control, formState } = s.form
  const errors = formState.errors

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <VekroMark className="text-text" />
          {s.signedInAs && <span className="type-body-sm text-text-muted">Signed in as {s.signedInAs}</span>}
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8 pb-32 lg:pb-12">
        {s.step !== 'saved' && (
          <div className="mx-auto w-full max-w-md">
            <Stepper
              steps={['Your shop', 'Get paid']}
              current={s.step === 'shop' ? 0 : 1}
              label="Setup progress"
            />
          </div>
        )}

        {s.step === 'shop' && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Card className="flex flex-col gap-5 p-6 sm:p-8">
              <div>
                <h1 className="type-display-lg text-text">Tell buyers who you are</h1>
                <p className="type-body-md mt-1 text-text-muted">This shows on every Trust Link you share.</p>
              </div>
              <label className="flex cursor-pointer items-center gap-4 rounded-md border border-border bg-surface-sunken p-4 has-focus-visible:outline-3 has-focus-visible:outline-emerald-400">
                <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-sand-300 bg-surface text-emerald-700">
                  {s.preview.logoUrl ? (
                    <img src={s.preview.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImagePlus aria-hidden="true" className="size-6" />
                  )}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="type-body-md font-semibold text-text">Add your shop logo</span>
                  <span className="type-body-sm text-text-muted">
                    Optional. Square photos work best; we crop to a circle.
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => s.onLogo(e.target.files?.[0])}
                />
              </label>
              <TextField
                label="Shop display name"
                error={errors.shopName?.message}
                {...register('shopName')}
              />
              <Field label="City or area" error={errors.area?.message}>
                {({ id, describedBy }) => (
                  <select
                    id={id}
                    aria-describedby={describedBy}
                    className={selectClass}
                    {...register('area')}
                  >
                    {s.areas.map((area) => (
                      <option key={area}>{area}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextArea
                    label="Short description"
                    hint="Shown to buyers on your listings."
                    maxLength={160}
                    error={errors.description?.message}
                    {...field}
                  />
                )}
              />
              <div className="hidden justify-end border-t border-border pt-5 lg:flex">
                <Button onClick={s.next}>Next</Button>
              </div>
            </Card>
            <aside aria-label="How buyers see you" className="flex flex-col gap-3">
              <p className="type-label text-ink-600">How buyers see you</p>
              <Card className="flex flex-col items-center gap-2 text-center">
                <span className="grid size-16 place-items-center overflow-hidden rounded-full bg-sand-100 font-display text-title font-bold text-emerald-800">
                  {s.preview.logoUrl ? (
                    <img src={s.preview.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    s.preview.shopName.slice(0, 2).toUpperCase()
                  )}
                </span>
                <p className="type-title text-text">{s.preview.shopName}</p>
                <p className="type-body-sm inline-flex items-center gap-1 text-text-muted">
                  <MapPin aria-hidden="true" className="size-3.5" />
                  {s.preview.area}
                </p>
                {s.preview.description && (
                  <p className="type-body-sm rounded-sm bg-sand-50 p-3 text-ink-600 italic">
                    “{s.preview.description}”
                  </p>
                )}
                <span className="type-body-sm mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  Protected by Vekro Escrow
                </span>
              </Card>
            </aside>
          </div>
        )}

        {s.step === 'payout' && (
          <form noValidate onSubmit={s.onSubmit} className="flex flex-col gap-6">
            {s.error && <Banner tone="danger" title={s.error} />}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
              <Card className="flex flex-col gap-5 p-6 sm:p-8">
                <div>
                  <h1 className="type-headline text-text">Where should we send your money?</h1>
                  <p className="type-body-md mt-1 text-text-muted">
                    Payouts go to M-Pesa. You&apos;re paid only after the buyer accepts the item.
                  </p>
                </div>
                {(['mpesaPhone', 'confirmPhone'] as const).map((name) => (
                  <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <PhoneField
                        label={name === 'mpesaPhone' ? 'M-Pesa payout number' : 'Confirm M-Pesa number'}
                        error={errors[name]?.message}
                        hint={name === 'confirmPhone' && s.phonesMatch ? 'Numbers match' : undefined}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                ))}
                <TextField
                  label="Name on M-Pesa"
                  hint="As it appears on your M-Pesa account."
                  autoComplete="name"
                  className="font-mono uppercase"
                  error={errors.mpesaAccountName?.message}
                  {...register('mpesaAccountName')}
                />
                <p className="type-body-sm flex items-start gap-3 rounded-md bg-emerald-50 p-4 text-emerald-800">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                  You&apos;re paid only after the buyer accepts the item. Money waits safely in the vault
                  until then.
                </p>
              </Card>

              <Card padded={false} className="overflow-hidden">
                <div className="bg-emerald-50 px-6 py-5">
                  <h2 className="type-title text-text">How your payout works</h2>
                  <p className="type-body-sm mt-1 text-ink-600">
                    See exactly what reaches your M-Pesa before every sale.
                  </p>
                </div>
                <div className="flex flex-col gap-5 p-6">
                  <label className="flex flex-col gap-3">
                    <span className="type-label text-ink-600">Sale amount</span>
                    <MoneyText amount={s.fee.amount} className="type-amount text-text" />
                    <input
                      type="range"
                      min={s.fee.min}
                      max={s.fee.max}
                      step={500}
                      value={s.fee.amount}
                      onChange={(e) => s.fee.setAmount(Number(e.target.value))}
                      aria-valuetext={formatKes(s.fee.amount)}
                      className="h-2 w-full cursor-pointer accent-emerald-700"
                    />
                    <span className="type-mono flex justify-between text-text-muted">
                      <span>{formatKes(s.fee.min)}</span>
                      <span>{formatKes(s.fee.max)}</span>
                    </span>
                  </label>
                  <div className="flex h-12 overflow-hidden rounded-md" aria-hidden="true">
                    <span
                      className="type-body-sm flex items-center bg-emerald-700 px-4 font-semibold whitespace-nowrap text-sand-0 transition-[width] duration-(--duration-state)"
                      style={{ width: `${(s.fee.net / s.fee.gross) * 100}%` }}
                    >
                      You receive {formatKes(s.fee.net)}
                    </span>
                    <span className="flex-1 bg-sand-200" />
                  </div>
                  <dl className="type-body-md flex flex-col gap-2 rounded-md border border-border p-4">
                    <div className="flex justify-between">
                      <dt className="text-ink-600">Buyer pays</dt>
                      <dd className="type-mono">{formatKes(s.fee.gross)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-600">Estimated network fee</dt>
                      <dd className="type-mono text-ink-600">− {formatKes(s.fee.fee)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <dt className="font-semibold text-text">You receive</dt>
                      <dd className="type-title text-emerald-700">{formatKes(s.fee.net)}</dd>
                    </div>
                  </dl>
                  <p className="type-body-sm text-text-muted">
                    The network fee is what M-Pesa charges to move the money. Vekro shows it before every
                    sale.
                  </p>
                </div>
              </Card>
            </div>
            <div
              className={cn(
                'fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-border bg-surface/85 p-4 backdrop-blur-lg',
                'lg:static lg:justify-between lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none',
              )}
            >
              <Button variant="ghost" onClick={s.back}>
                Back
              </Button>
              <Button type="submit" loading={s.saving} className="flex-1 lg:flex-none">
                Save and finish
              </Button>
            </div>
          </form>
        )}

        {s.step === 'saved' && (
          <section className="mx-auto flex w-full max-w-lg flex-col gap-6" aria-labelledby="ready">
            <div className="bg-vault flex flex-col items-center gap-3 rounded-xl p-8 text-center text-sand-0 shadow-vault">
              <LockRing state="released" />
              <span className="type-label text-emerald-100">Payouts go to</span>
              <span className="type-mono text-body-lg">{s.maskedPayoutPhone}</span>
              <span className="type-title">{s.preview.shopName}</span>
            </div>
            {!s.saved && (
              <Banner tone="warning" title="Your payout number isn't stored yet">
                Vekro can't save payout details from this screen yet. We'll ask for them again before your
                first payout.
              </Banner>
            )}
            <div>
              <h1 id="ready" className="type-display-lg text-text">
                You&apos;re ready to sell
              </h1>
              <p className="type-body-lg mt-2 text-ink-600">
                Create a listing, share your Trust Link on WhatsApp or Instagram, and get paid when the buyer
                accepts the item.
              </p>
            </div>
            <ol className="flex flex-col gap-3">
              {[
                {
                  Icon: Package,
                  title: 'List your item',
                  body: 'Add photos, a price and what happens if something is wrong.',
                },
                {
                  Icon: Share2,
                  title: 'Share the link',
                  body: 'Share your Trust Link on WhatsApp, Instagram or Facebook.',
                },
                {
                  Icon: Wallet,
                  title: 'Get paid after the buyer accepts',
                  body: 'The money moves from the vault to your M-Pesa.',
                },
              ].map(({ Icon, title, body }) => (
                <li key={title} className="flex items-start gap-4 rounded-lg bg-surface p-4 shadow-1">
                  <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-emerald-50 text-emerald-700">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="type-body-md block font-semibold text-text">{title}</span>
                    <span className="type-body-sm text-text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link
              to="/seller/listings/new"
              className="type-title inline-flex h-13 items-center justify-center gap-2 rounded-md bg-primary text-on-primary shadow-highlight hover:bg-primary-hover"
            >
              Create your first listing
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
            <Link
              to="/seller"
              className="type-body-md text-center font-semibold text-ink-600 hover:text-text"
            >
              Go to dashboard
            </Link>
          </section>
        )}

        {s.step === 'shop' && (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/85 p-4 backdrop-blur-lg lg:hidden">
            <Button fullWidth onClick={s.next}>
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
