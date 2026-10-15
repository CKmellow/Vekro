import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { payoutBreakdown } from '@/lib/fees'
import { toast } from '@/lib/toast'
import {
  CATEGORIES,
  DOOR_REJECT_REASONS,
  policySummary,
  problemPresets,
  RESOLUTIONS,
  type DoorRejectReason,
  type Resolution,
} from '@/models/domain/listing'
import { clearDraft, loadDraft, saveDraft } from '@/models/domain/listingDraftStore'
import { ApiError } from '@/models/api/errors'
import { draftFromListing } from '@/models/api/adapters/listings'
import { useCreateListing, useListing } from '@/models/queries/listings'
import { listingDraft, policyStep, type ListingDraft } from '@/models/schemas/listing'
import { usePhotoPicker } from './usePhotoPicker'
import { useSession } from './useSession'

export const WIZARD_STEPS = ['Item', 'Item type', 'Dispute policy', 'Review'] as const

const STEP_FIELDS: FieldPath<ListingDraft>[][] = [
  ['item.title', 'item.category', 'item.description', 'item.price', 'item.buyerName'],
  ['type.isSerialized', 'type.uniqueId'],
  [],
  [],
]

const EMPTY: ListingDraft = {
  item: { title: '', category: 'Phones and tablets', description: '', price: Number.NaN, buyerName: '' },
  type: { isSerialized: false, uniqueId: '' },
  policy: {
    isSerialized: false,
    doorRejectReasons: ['damaged', 'wrong_item', 'not_as_described'],
    acceptedProblems: [],
    resolution: undefined,
  },
}

/** S7: the four-step create-listing wizard with a live buyer preview and a draft kept on this device. */
export function useListingWizard() {
  const session = useSession()
  const navigate = useNavigate()
  const create = useCreateListing()
  const [publishError, setPublishError] = useState<string | null>(null)
  const photos = usePhotoPicker()
  const [step, setStep] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [touchedPolicy, setTouchedPolicy] = useState(false)
  const restored = useRef(false)
  const form = useForm<ListingDraft>({
    resolver: zodResolver(listingDraft),
    defaultValues: EMPTY,
    mode: 'onTouched',
  })

  // Duplicate: ?from=<listing id> pre-fills the wizard (the serial number is left blank on purpose).
  const [params] = useSearchParams()
  const fromId = params.get('from')
  const source = useListing(fromId ?? '', { enabled: Boolean(fromId) })
  useEffect(() => {
    if (!source.data) return
    const copy = draftFromListing(source.data)
    form.reset({ ...EMPTY, ...copy, item: { ...EMPTY.item, ...copy.item } })
    toast.show('Copied from your listing. Add the new serial number if it has one.', 'info')
  }, [source.data, form])

  // Restore an unfinished draft once, with a toast.
  useEffect(() => {
    if (restored.current || fromId) return
    restored.current = true
    const stored = loadDraft()
    if (stored) {
      form.reset(stored.draft)
      toast.show('Draft restored', 'info')
    }
  }, [form, fromId])

  // Keep the policy's item type in step with step 2.
  const isSerialized = form.watch('type.isSerialized')
  useEffect(() => form.setValue('policy.isSerialized', isSerialized), [isSerialized, form])

  const next = async () => {
    if (step === 2) {
      // The policy is set through buttons, not registered inputs, so it is checked with its own schema.
      setTouchedPolicy(true)
      if (!policyStep.safeParse(form.getValues('policy')).success) return
    }
    const fields = STEP_FIELDS[step] ?? []
    if (fields.length && !(await form.trigger(fields))) return
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const publish = form.handleSubmit(
    async (draft) => {
      setPublishError(null)
      try {
        const { listing, contentSaved } = await create.mutateAsync({ draft, photos: photos.readyBlobs() })
        clearDraft()
        if (!contentSaved)
          toast.show('Published. Photos and description will be added once Vekro can store them.', 'info')
        navigate(`/seller/listings/${listing.id}?published=1`, { replace: true })
      } catch (error) {
        setPublishError(
          error instanceof ApiError && error.kind === 'network'
            ? "You're offline. Your listing is still here; publish again when you're connected."
            : error instanceof ApiError && error.kind === 'validation'
              ? error.message
              : "We couldn't publish your listing. Try again.",
        )
      }
    },
    () => setPublishError('Some details need fixing. Check each step.'),
  )

  const values = form.watch()
  const price = Number.isFinite(values.item.price) ? values.item.price : 0
  const shop = session.status === 'authenticated' ? session.user.name : 'Your shop'

  return {
    form,
    step,
    steps: WIZARD_STEPS,
    next,
    back: () => setStep((s) => Math.max(0, s - 1)),
    goTo: (index: number) => setStep(index),
    selectType: (serial: boolean) => form.setValue('type.isSerialized', serial, { shouldDirty: true }),
    policy: {
      reasons: DOOR_REJECT_REASONS,
      resolutions: RESOLUTIONS,
      toggleReason: (reason: DoorRejectReason) => {
        const current = form.getValues('policy.doorRejectReasons')
        const next = current.includes(reason) ? current.filter((r) => r !== reason) : [...current, reason]
        form.setValue('policy.doorRejectReasons', next)
      },
      toggleProblem: (problem: string) => {
        const current = form.getValues('policy.acceptedProblems')
        const next = current.includes(problem) ? current.filter((p) => p !== problem) : [...current, problem]
        form.setValue('policy.acceptedProblems', next)
      },
      addProblem: (problem: string) => {
        const label = problem.trim().slice(0, 60)
        const current = form.getValues('policy.acceptedProblems')
        if (label && !current.includes(label)) form.setValue('policy.acceptedProblems', [...current, label])
      },
      setResolution: (resolution: Resolution) => form.setValue('policy.resolution', resolution),
      error: touchedPolicy ? policyStep.safeParse(values.policy).error?.issues[0]?.message : undefined,
    },
    photos,
    saveDraft: () => {
      if (saveDraft(form.getValues())) toast.show('Draft saved on this device')
      else toast.show("Couldn't save the draft on this device", 'danger')
    },
    clearDraft,
    previewOpen,
    setPreviewOpen,
    preview: {
      title: values.item.title || 'Your item title',
      price,
      photoUrl: photos.photos[0]?.previewUrl ?? null,
      sellerName: shop,
      description: values.item.description,
      isSerialized: values.type.isSerialized,
      uniqueIdTail: values.type.uniqueId ? values.type.uniqueId.replace(/\s+/g, '').slice(-4) : null,
      policyLine: policySummary(values.policy),
    },
    payout: payoutBreakdown(price),
    policyValues: values.policy,
    publish,
    publishing: create.isPending,
    publishError,
    review: {
      item: values.item,
      categoryLabel: values.item.category,
      photoCount: photos.photos.length,
      linkHost: typeof window === 'undefined' ? 'vekro.co.ke' : window.location.host,
    },
    problemPresets: problemPresets(values.item.category),
    categories: CATEGORIES,
  }
}
