import { Check, Info, Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Banner } from '../../../components/ui/Banner'
import { Checkbox, RadioCardGroup } from '../../../components/ui/Choice'

type Reason = 'damaged' | 'wrong_item' | 'not_as_described'
type Resolution = 'refund' | 'repair' | 'replacement'

export interface PolicyStepProps {
  isSerialized: boolean
  reasons: readonly { value: Reason; label: string }[]
  selectedReasons: Reason[]
  onToggleReason: (reason: Reason) => void
  presets: string[]
  acceptedProblems: string[]
  onToggleProblem: (problem: string) => void
  onAddProblem: (problem: string) => void
  resolutions: readonly { value: Resolution; label: string; description: string }[]
  resolution?: Resolution
  onResolution: (resolution: Resolution) => void
  error?: string
}

const STANDARD_STEPS = [
  'The buyer inspects the item at the door.',
  'If it is right, they enter their delivery code and the money is released to you.',
  'If it is wrong, they reject at the door and the item comes back to you.',
]

/** S7 step 3: the dispute policy buyers see before paying. Guided, not legal. */
export function PolicyStep(p: PolicyStepProps) {
  const [custom, setCustom] = useState('')
  const [adding, setAdding] = useState(false)
  const problems = [...p.presets, ...p.acceptedProblems.filter((x) => !p.presets.includes(x))]

  if (!p.isSerialized) {
    return (
      <div className="flex flex-col gap-5">
        <section aria-labelledby="how-standard" className="flex flex-col gap-3 rounded-lg bg-emerald-50 p-5">
          <h2 id="how-standard" className="type-title flex items-center gap-2 text-text">
            <ShieldCheck aria-hidden="true" className="size-5 text-emerald-700" />
            How it works for standard items
          </h2>
          <ol className="flex flex-col gap-2">
            {STANDARD_STEPS.map((text, i) => (
              <li
                key={text}
                className="type-body-md flex items-start gap-3 rounded-md bg-surface p-3 text-text"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-700 font-mono text-label font-bold text-sand-0">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </section>
        <fieldset className="flex flex-col gap-1">
          <legend className="type-title mb-1 text-text">Buyer may reject at the door for:</legend>
          <p className="type-body-sm mb-2 text-text-muted">
            Pick the reasons a buyer can reject at the door.
          </p>
          {p.reasons.map((reason) => (
            <Checkbox
              key={reason.value}
              checked={p.selectedReasons.includes(reason.value)}
              onChange={() => p.onToggleReason(reason.value)}
            >
              {reason.label}
            </Checkbox>
          ))}
          {p.error && (
            <p role="alert" className="type-body-sm text-coral-600">
              {p.error}
            </p>
          )}
          <p className="type-body-sm mt-2 flex items-center gap-2 rounded-md bg-sand-100 p-3 text-ink-600">
            <Info aria-hidden="true" className="size-4 shrink-0" />
            These reasons show on your Trust Link, so buyers know the rules up front.
          </p>
        </fieldset>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="type-body-sm rounded-md bg-lake-50 p-3 text-lake-600">
        Serial-numbered item: the buyer has 24 hours after delivery to report a functional problem.
      </p>
      {p.error && (
        <Banner tone="warning" title="Serial-numbered listings need a policy before you can publish." />
      )}
      <fieldset className="flex flex-col gap-3">
        <legend className="type-title text-text">Problems you accept</legend>
        <p className="type-body-sm text-text-muted">Pick the problems a buyer can report in the 24 hours.</p>
        <div className="flex flex-wrap gap-2">
          {problems.map((problem) => {
            const on = p.acceptedProblems.includes(problem)
            return (
              <button
                key={problem}
                type="button"
                aria-pressed={on}
                onClick={() => p.onToggleProblem(problem)}
                className={cn(
                  'type-body-sm inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 font-semibold transition-colors',
                  on
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-surface text-ink-600 hover:bg-sand-50',
                )}
              >
                {on && <Check aria-hidden="true" className="size-4" />}
                {problem}
              </button>
            )
          })}
          {adding ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                p.onAddProblem(custom)
                setCustom('')
                setAdding(false)
              }}
            >
              <label className="sr-only" htmlFor="custom-problem">
                Problem to add
              </label>
              <input
                id="custom-problem"
                ref={(el) => el?.focus()}
                value={custom}
                maxLength={60}
                onChange={(e) => setCustom(e.target.value)}
                className="type-body-sm h-10 rounded-full border border-emerald-500 px-4 focus:outline-none"
              />
              <button type="submit" className="type-body-sm font-semibold text-primary">
                Add
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="type-body-sm inline-flex min-h-10 items-center gap-1 rounded-full border border-dashed border-sand-300 px-4 font-semibold text-ink-600"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add
            </button>
          )}
        </div>
      </fieldset>
      <RadioCardGroup
        legend="If a problem is confirmed, you will:"
        name="resolution"
        value={p.resolution}
        onChange={p.onResolution}
        options={p.resolutions.map((r) => ({ value: r.value, title: r.label, description: r.description }))}
      />
    </div>
  )
}
