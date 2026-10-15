import { useMutation } from '@tanstack/react-query'
import { saveSellerProfile, type SellerProfileInput } from '@/models/api/adapters/sellerProfile'

export const useSaveSellerProfile = () =>
  useMutation({ mutationFn: (input: SellerProfileInput) => saveSellerProfile(input) })
