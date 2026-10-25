import { describe, expect, it } from 'vitest'
import { reportPageHref, supportContacts, supportHours } from './support'

describe('supportContacts', () => {
  it('shows nothing when no contact is configured', () => {
    expect(supportContacts({})).toEqual([])
    expect(supportHours({ VITE_SUPPORT_HOURS: '  ' })).toBeUndefined()
    expect(reportPageHref('https://vekro.test/help', {})).toBeUndefined()
  })

  it('builds call, WhatsApp and email links from the configured values', () => {
    expect(
      supportContacts({
        VITE_SUPPORT_PHONE: '+254 700 000 001',
        VITE_SUPPORT_WHATSAPP: '+254 700 000 002',
        VITE_SUPPORT_EMAIL: 'help@vekro.test',
      }),
    ).toEqual([
      { kind: 'call', label: 'Call support', href: 'tel:+254700000001' },
      { kind: 'whatsapp', label: 'WhatsApp support', href: 'https://wa.me/254700000002' },
      { kind: 'email', label: 'Email support', href: 'mailto:help@vekro.test' },
    ])
  })

  it('leaves out the ones that are unset', () => {
    expect(supportContacts({ VITE_SUPPORT_EMAIL: 'help@vekro.test' }).map((c) => c.kind)).toEqual([
      'email',
    ])
  })

  it('carries the page address in the report link', () => {
    const href = reportPageHref('https://vekro.test/help', { VITE_SUPPORT_EMAIL: 'help@vekro.test' })
    expect(href).toMatch(/^mailto:help@vekro\.test\?subject=Problem%20with%20a%20Vekro%20page/)
    expect(decodeURIComponent(href ?? '')).toContain('Page: https://vekro.test/help')
  })
})
