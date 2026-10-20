import { z } from 'zod'
import { PASSWORD_RULES } from '@/lib/password'
import { isValidNational, PHONE_ERROR } from '@/lib/phone'

const password = z
  .string()
  .max(128, 'Use 128 characters or fewer')
  .refine(
    (p) => PASSWORD_RULES.every((rule) => rule.test(p)),
    'Use 8 or more characters with a letter and a number',
  )

/** S1 sign up. The phone is the 9 national digits from PhoneField. */
export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(120, 'Keep your name under 120 characters'),
    phone: z.string().refine(isValidNational, PHONE_ERROR),
    shopName: z.string().trim().max(80, 'Keep the shop name under 80 characters'),
    password,
    confirmPassword: z.string(),
    terms: z.boolean().refine(Boolean, 'Agree to the terms to continue'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  })

/** S2 log in: only presence is checked here; the backend decides. */
export const logInSchema = z.object({
  phone: z.string().refine(isValidNational, PHONE_ERROR),
  password: z.string().min(1, 'Enter your password'),
})

export type SignUpValues = z.infer<typeof signUpSchema>
export type LogInValues = z.infer<typeof logInSchema>

/**
 * B1 pay card (FRONTEND_CONTRACT A): signed-out buyers save their details (register) or log in in the same
 * card; a signed-in buyer only ticks the terms. `mode` is set by the controller, never typed by the buyer.
 */
export const paySchema = z
  .object({
    mode: z.enum(['register', 'login', 'signed_in']),
    phone: z.string(),
    name: z.string(),
    password: z.string(),
    terms: z.boolean().refine(Boolean, 'Agree to the terms to pay'),
  })
  .superRefine((v, ctx) => {
    if (v.mode === 'signed_in') return
    if (!isValidNational(v.phone))
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Enter a Kenyan mobile number, like 712 345 678',
      })
    if (v.mode === 'register') {
      const name = v.name.trim()
      if (name.length < 2 || name.length > 120)
        ctx.addIssue({ code: 'custom', path: ['name'], message: 'Enter your name' })
      const check = password.safeParse(v.password)
      if (!check.success)
        ctx.addIssue({ code: 'custom', path: ['password'], message: check.error.issues[0]?.message ?? '' })
    } else if (!v.password) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Enter your password' })
    }
  })

export type PayValues = z.infer<typeof paySchema>
export type PayMode = PayValues['mode']
