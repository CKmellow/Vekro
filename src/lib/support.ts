/** Support contact details come from configuration (VITE_SUPPORT_*); nothing is invented or hard-coded. */
export interface SupportContact {
  kind: 'call' | 'whatsapp' | 'email'
  label: string
  href: string
}

export interface SupportConfig {
  VITE_SUPPORT_PHONE?: string
  VITE_SUPPORT_WHATSAPP?: string
  VITE_SUPPORT_EMAIL?: string
  VITE_SUPPORT_HOURS?: string
}

const digits = (value: string) => value.replace(/[^\d+]/g, '')

/** The configured ways to reach support, in the order the help page shows them. Unset ones are left out. */
export function supportContacts(env: SupportConfig = import.meta.env): SupportContact[] {
  const phone = env.VITE_SUPPORT_PHONE?.trim()
  const whatsapp = env.VITE_SUPPORT_WHATSAPP?.trim()
  const email = env.VITE_SUPPORT_EMAIL?.trim()
  return [
    phone && { kind: 'call' as const, label: 'Call support', href: `tel:${digits(phone)}` },
    whatsapp && {
      kind: 'whatsapp' as const,
      label: 'WhatsApp support',
      href: `https://wa.me/${digits(whatsapp).replace(/^\+/, '')}`,
    },
    email && { kind: 'email' as const, label: 'Email support', href: `mailto:${email}` },
  ].filter((c): c is SupportContact => Boolean(c))
}

export function supportHours(env: SupportConfig = import.meta.env): string | undefined {
  return env.VITE_SUPPORT_HOURS?.trim() || undefined
}

/** A mailto link for reporting a broken page, carrying its address. Undefined without a support email. */
export function reportPageHref(pageUrl: string, env: SupportConfig = import.meta.env): string | undefined {
  const email = env.VITE_SUPPORT_EMAIL?.trim()
  if (!email) return undefined
  const params = new URLSearchParams({ subject: 'Problem with a Vekro page', body: `Page: ${pageUrl}\n\n` })
  return `mailto:${email}?${params.toString().replace(/\+/g, '%20')}`
}
