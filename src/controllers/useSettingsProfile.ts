import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import type { ShopDetails } from '@/models/api/sellerProfile'
import {
  useRemoveLogo,
  useSellerProfile,
  useUpdateShopDetails,
  useUploadLogo,
} from '@/models/queries/sellerProfile'
import { useOnline } from './useOnline'

export const ABOUT_MAX = 280
const EMPTY: ShopDetails = { shopName: '', shopArea: '', shopAbout: '' }

export function shopErrors(v: ShopDetails): Partial<Record<keyof ShopDetails, string>> {
  const name = v.shopName.trim()
  return {
    shopName:
      name.length < 2
        ? 'Enter the name buyers will see'
        : name.length > 60
          ? 'Keep it under 60 characters'
          : undefined,
    shopArea: v.shopArea.length > 80 ? 'Keep it under 80 characters' : undefined,
    shopAbout: v.shopAbout.length > ABOUT_MAX ? `Keep it under ${ABOUT_MAX} characters` : undefined,
  }
}

/** S13 Profile tab: shop name, area, about and logo; saved together from the save bar. */
export function useSettingsProfile() {
  const online = useOnline()
  const query = useSellerProfile()
  const saveDetails = useUpdateShopDetails()
  const uploadLogo = useUploadLogo()
  const removeLogo = useRemoveLogo()
  const profile = query.data
  // Edits sit on top of the saved profile, so nothing reads as changed while it loads.
  const [edits, setEdits] = useState<Partial<ShopDetails> | null>(null)
  const [logo, setLogo] = useState<{ file: File; preview: string } | 'remove' | null>(null)
  const [tried, setTried] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saved: ShopDetails = profile
    ? { shopName: profile.shopName, shopArea: profile.shopArea, shopAbout: profile.shopAbout }
    : EMPTY
  const values: ShopDetails = { ...saved, ...edits }
  useEffect(() => () => void (logo && logo !== 'remove' && URL.revokeObjectURL(logo.preview)), [logo])

  const errors = shopErrors(values)
  const dirty =
    Boolean(profile) &&
    (logo !== null ||
      values.shopName !== saved.shopName ||
      values.shopArea !== saved.shopArea ||
      values.shopAbout !== saved.shopAbout)
  const saving = saveDetails.isPending || uploadLogo.isPending || removeLogo.isPending

  const discard = () => {
    setEdits(null)
    setLogo(null)
    setTried(false)
    setError(null)
  }

  const save = async () => {
    setTried(true)
    if (Object.values(errors).some(Boolean)) return
    setError(null)
    try {
      await saveDetails.mutateAsync({
        shopName: values.shopName.trim(),
        shopArea: values.shopArea.trim(),
        shopAbout: values.shopAbout.trim(),
      })
      if (logo === 'remove') await removeLogo.mutateAsync(undefined)
      else if (logo) await uploadLogo.mutateAsync(logo.file)
      setEdits(null)
      setLogo(null)
      setTried(false)
      toast.show('Settings saved', 'success')
    } catch (e) {
      setError(
        e instanceof ApiError && e.kind === 'network'
          ? "You're offline. Your edits are still here; save again when you're connected."
          : e instanceof ApiError && (e.status === 413 || e.status === 415)
            ? e.message
            : "We couldn't save your profile. Try again.",
      )
    }
  }

  return {
    state: profile ? ('ready' as const) : query.isError ? ('error' as const) : ('loading' as const),
    retry: () => void query.refetch(),
    values,
    set: (field: keyof ShopDetails, value: string) => setEdits((e) => ({ ...e, [field]: value })),
    errors: tried ? errors : ({} as typeof errors),
    initials: (values.shopName || profile?.name || 'V')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join(''),
    logoUrl: logo === 'remove' ? null : logo ? logo.preview : (profile?.logoUrl ?? null),
    pickLogo: (file: File | undefined) => file && setLogo({ file, preview: URL.createObjectURL(file) }),
    clearLogo: () => setLogo(profile?.logoUrl ? 'remove' : null),
    dirty,
    saving,
    save: () => void save(),
    discard,
    error,
    online,
  }
}
