import { Store } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { useStartSelling } from '@/controllers/useStartSelling'
import { Stepper } from '../../components/domain/Stepper'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Choice'
import { CodeCells } from '../../components/ui/CodeCells'
import { TextField } from '../../components/ui/Field'
import { PhoneField } from '../../components/ui/PhoneField'

/** S15 Start selling (design/S15-start-selling). Route /buyer/start-selling. A focused wizard. */
export function StartSellingPage() {
  const p = useStartSelling()
  if (p.redirect) return <Navigate to={p.redirect} replace />

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-140 flex-col gap-6 px-5 py-8">
      <title>Start selling · Vekro</title>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-md bg-emerald-50 text-emerald-700">
          <Store aria-hidden="true" className="size-6" />
        </span>
        <h1 className="type-headline text-text">Start selling</h1>
      </div>
      <Stepper steps={['Your store', 'Where we pay you', 'First listing']} current={p.stepIndex} />

      {p.error && <Banner tone="danger" title={p.error} />}

      {p.step === 'store' && (
        <Card className="flex flex-col gap-4">
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              p.openStore()
            }}
          >
            <TextField
              label="Store name"
              value={p.shopName}
              onChange={(e) => p.setShopName(e.target.value)}
              error={p.errors.shopName}
              maxLength={60}
            />
            <label className="flex flex-col gap-1.5">
              <span className="type-label-md text-text">Area (optional)</span>
              <select
                value={p.area}
                onChange={(e) => p.setArea(e.target.value)}
                className="type-body-md h-12 rounded-md border border-border bg-surface px-3 text-text focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Choose your city or area</option>
                {p.areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <Checkbox checked={p.terms} onChange={(e) => p.setTerms(e.target.checked)}>
              I accept the{' '}
              <Link to="/help" className="font-semibold text-primary">
                Vekro seller terms
              </Link>
            </Checkbox>
            {p.errors.terms && <p className="type-body-sm text-coral-600">{p.errors.terms}</p>}
            <Button type="submit" loading={p.opening}>
              Open my store
            </Button>
          </form>
        </Card>
      )}

      {p.step === 'payout' && (
        <Card className="flex flex-col gap-4">
          <p className="type-body-md text-text-muted">
            We send your money here when a buyer accepts. We text a code to prove it&apos;s your number.
            Buyers can&apos;t pay until you do.
          </p>
          <PhoneField label="M-Pesa payout number" value={p.phone} onChange={p.setPhone} />
          <TextField
            label="Name on the M-Pesa account"
            value={p.holder}
            onChange={(e) => p.setHolder(e.target.value)}
          />
          <Button onClick={p.sendCode} loading={p.sending}>
            Text me a code
          </Button>
        </Card>
      )}

      {p.step === 'code' && (
        <Card className="flex flex-col gap-4">
          <p className="type-body-md text-text-muted">
            Enter the 6-digit code we sent to your payout number.
          </p>
          <CodeCells
            label="Code"
            value={p.code}
            onChange={p.setCode}
            onComplete={p.confirm}
            disabled={p.confirming}
          />
          <Button variant="ghost" onClick={p.back}>
            Use another number
          </Button>
        </Card>
      )}

      <Link to="/buyer" className="type-body-md self-center font-semibold text-primary">
        Back to buying
      </Link>
    </div>
  )
}
