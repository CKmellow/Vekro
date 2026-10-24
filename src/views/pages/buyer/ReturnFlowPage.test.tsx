import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { toast } from '@/lib/toast'
import { disputeResponse, orderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ReturnFlowPage } from './ReturnFlowPage'

const ID = orderResponse().id
type Overrides = Parameters<typeof orderResponse>[0]

function serve(overrides: Overrides) {
  const posted: [string, unknown][] = []
  let current = orderResponse({ payment: null, dispute: disputeResponse(), ...overrides })
  const step =
    (name: string, next: Overrides) =>
    async ({ request }: { request: Request }) => {
      const text = await request.text()
      posted.push([name, text ? JSON.parse(text) : null])
      current = { ...current, ...next }
      return HttpResponse.json({})
    }
  server.use(
    http.get(`/api/transactions/${ID}`, () => HttpResponse.json(current)),
    http.post(`/api/transactions/${ID}/buyer-sent-back`, step('sent', { status: 'return_in_transit' })),
    http.post(
      `/api/transactions/${ID}/buyer-reconfirmation`,
      step('reconfirm', { status: 'return_received' }),
    ),
    http.post(
      `/api/transactions/${ID}/confirm-resolved-buyer`,
      step('resolved', {
        dispute: disputeResponse({ buyer_confirmed_resolved: true, seller_confirmed_resolved: true }),
      }),
    ),
  )
  return posted
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={[`/order/${ID}/return`]}>
      <Routes>
        <Route path="/order/:orderId/return" element={<ReturnFlowPage />} />
        <Route path="/order/:orderId" element={<h1>Tracker</h1>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('B6 return flow', () => {
  it('shows the report and marks the item as sent back', async () => {
    const posted = serve({ status: 'disputed_functional' })
    const { user } = renderPage()
    expect(await screen.findByRole('heading', { name: 'Send the item back' })).toBeInTheDocument()
    expect(screen.getByText("Doesn't work properly")).toBeInTheDocument()
    expect(screen.getByText(/The screen flickers and goes black/)).toBeInTheDocument()
    expect(screen.getByText('Repair then release')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: "I've sent it back" }))
    await user.click(await screen.findByRole('button', { name: "Yes, it's on its way" }))
    expect(await screen.findByRole('heading', { name: 'On its way back' })).toBeInTheDocument()
    expect(posted).toEqual([['sent', null]])
  })

  it('confirms a repair works', async () => {
    const posted = serve({
      status: 'awaiting_buyer_reconfirmation',
      dispute: disputeResponse({ seller_action: 'repair_shipped', seller_notes: 'Replaced the screen.' }),
    })
    const { user } = renderPage()
    expect(await screen.findByRole('heading', { name: 'Is it fixed?' })).toBeInTheDocument()
    expect(screen.getByText('"Replaced the screen."')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: "Yes, it's fixed" }))
    await user.click(await screen.findByRole('button', { name: 'Yes, it works' }))
    await waitFor(() => expect(posted).toEqual([['reconfirm', { accepted: true, notes: null }]]))
  })

  it('gives the seller one more chance, then warns that the next "No" goes to support', async () => {
    const posted = serve({ status: 'awaiting_buyer_reconfirmation' })
    const { user, unmount } = renderPage()
    await user.click(await screen.findByRole('button', { name: 'No, still a problem' }))
    const sheet = await screen.findByRole('dialog', { name: 'Still not working?' })
    await user.type(within(sheet).getByLabelText("What's still wrong? (optional)"), 'Still flickers.')
    await user.click(within(sheet).getByRole('button', { name: 'Send it back to the seller' }))
    await waitFor(() =>
      expect(posted).toEqual([['reconfirm', { accepted: false, notes: 'Still flickers.' }]]),
    )
    unmount()

    serve({ status: 'awaiting_buyer_reconfirmation', dispute: disputeResponse({ reconfirm_rejections: 1 }) })
    const second = renderPage()
    await second.user.click(await screen.findByRole('button', { name: 'No, still a problem' }))
    expect(await screen.findByRole('dialog', { name: 'This will go to Vekro support' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send to Vekro support' })).toBeInTheDocument()
  })

  it('closes a resolved case once both sides confirm', async () => {
    serve({ status: 'resolved_refund', dispute: disputeResponse({ seller_confirmed_resolved: true }) })
    const { user } = renderPage()
    expect(await screen.findByRole('heading', { name: 'Refund issued: KES 52,000' })).toBeInTheDocument()
    expect(screen.getByText('You: not yet')).toBeInTheDocument()
    expect(screen.getByText('Seller: confirmed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark as resolved' }))
    expect(await screen.findByText('Case closed.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as resolved' })).not.toBeInTheDocument()
  })

  it('is read-only while Vekro support reviews it', async () => {
    serve({ status: 'escalated_admin_review' })
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'Vekro support is reviewing this' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /sent it back|fixed|still a problem/ }),
    ).not.toBeInTheDocument()
  })

  it('sends an order with no return to its tracker', async () => {
    serve({ status: 'locked', dispute: null })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Tracker' })).toBeInTheDocument()
  })
})
