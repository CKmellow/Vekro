import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changePayout,
  getSellerProfile,
  removeLogo,
  requestPayoutCode,
  updateShopDetails,
  uploadLogo,
  type SellerProfile,
} from '@/models/api/sellerProfile'

export const profileKeys = { me: ['seller', 'profile'] as const }

export const useSellerProfile = (enabled = true) =>
  useQuery({ queryKey: profileKeys.me, queryFn: ({ signal }) => getSellerProfile(signal), enabled })

/** Mutations answer with the whole profile, so the cache is replaced rather than refetched. */
function useProfileMutation<V>(run: (variables: V) => Promise<SellerProfile>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (profile) => client.setQueryData(profileKeys.me, profile),
  })
}

export const useUpdateShopDetails = () => useProfileMutation(updateShopDetails)
export const useUploadLogo = () => useProfileMutation(uploadLogo)
export const useRemoveLogo = () => useProfileMutation(() => removeLogo())
export const useChangePayout = () => useProfileMutation(changePayout)
export const useRequestPayoutCode = () => useMutation({ mutationFn: requestPayoutCode })
