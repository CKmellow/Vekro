import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { payoutBreakdown } from '@/lib/fees'
import { toast } from '@/lib/toast'
import { CATEGORIES, policySummary, problemPresets } from '@/models/domain/listing'
import { clearDraft, loadDraft, saveDraft } from '@/models/domain/listingDraftStore'
import { listingDraft, type ListingDraft } from '@/models/schemas/listing'
import { usePhotoPicker } from './usePhotoPicker'
import { useSession } from './useSession'

export const WIZARD_STEPS = ['Item', 'Item type', 'Dispute policy', 'Review'] as const

const STEP_FIELDS: FieldPath<ListingDraft>[][] = [
  ['item.title', 'item.category', 'item.description', 'item.price', 'item.buyerName'],
  ['type.isSerialized', 'type.uniqueId'],
  ['policy'],
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
  const photos = usePhotoPicker()
  const [step, setStep] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const restored = useRef(false)
  const form = useForm<ListingDraft>({
    resolver: zodResolver(listingDraft),
    defaultValues: EMPTY,
    mode: 'onTouched',
  })

  // Restore an unfinished draft once, with a toast.
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const stored = loadDraft()
    if (stored) {
      form.reset(stored.draft)
      toast.show('Draft restored', 'info')
    }
  }, [form])

  // Keep the policy's item type in step with step 2.
  const isSerialized = form.watch('type.isSerialized')
  useEffect(() => form.setValue('policy.isSerialized', isSerialized), [isSerialized, form])

  const next = async () => {
    const fields = STEP_FIELDS[step] ?? []
    if (fields.length && !(await form.trigger(fields))) return
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

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
    problemPresets: problemPresets(values.item.category),
    categories: CATEGORIES,
  }
}
