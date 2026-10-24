import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { toast } from '@/lib/toast'
import { disputeResponse, sellerOrderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ReturnCasePage } from './ReturnCasePage'

const ID = sellerOrderResponse().id
type Overrides = Parameters<typeof sellerOrderResponse>[0]

function serve(overrides: Overrides) {
  const posted: [string, unknown][] = []
  let current = sellerOrderResponse({ dispute: disputeResponse(), ...overrides })
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
    http.get(`/api/transactions/${ID}/timeline`, () => HttpResponse.json([])),
    http.post(`/api/transactions/${ID}/seller-received`, step('received', { status: 'return_received' })),
    http.post(
      `/api/transactions/${ID}/seller-resolution-action`,
      step('resolution', { status: 'awaiting_buyer_reconfirmation' }),
    ),
    http.post(`/api/transactions/${ID}/escalate`, step('escalate', { status: 'escalated_admin_review' })),
    http.post(
      `/api/transactions/${ID}/confirm-resolved-seller`,
      step('resolved', {
        dispute: disputeResponse({ seller_confirmed_resolved: true, buyer_confirmed_resolved: true }),
      }),
    ),
  )
  return posted
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={[`/seller/returns/${ID}`]}>
      <Routes>
        <Route path="/seller/returns/:id" element={<ReturnCasePage />} />
        <Route path="/seller/orders/:id" element={<h1>Order detail</h1>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S11 return case', () => {
  it("shows the buyer's account and confirms receipt", async () => {
    const posted = serve({ status: 'return_in_transit' })
    const { user } = renderPage()
    expect(await screen.findByRole('heading', { name: 'Waiting for the item to arrive' })).toBeInTheDocument()
    expect(screen.getByText("Doesn't work properly")).toBeInTheDocument()
    expect(screen.getByText(/The screen flickers and goes black/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'I received the item' })[0] as HTMLElement)
    await user.click(await screen.findByRole('button', { name: 'Yes, I have it' }))
    expect(await screen.findByRole('heading', { name: 'Choose your resolution' })).toBeInTheDocument()
    expect(posted).toEqual([['received', null]])
  })

  it('offers only the declared options and sends a repair with a note', async () => {
    const posted = serve({ status: 'return_received' })
    const { user } = renderPage()
    await screen.findByRole('heading', { name: 'Choose your resolution' })
    expect(screen.getByRole('radio', { name: /Refund buyer/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Repair and send back/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Send a replacement/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Confirm action' })[0]).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /Repair and send back/ }))
    await user.type(screen.getByLabelText('Note for the buyer (optional)'), 'New screen, G4S ref 8812.')
    await user.click(screen.getAllByRole('button', { name: 'Confirm action' })[0] as HTMLElement)
    await waitFor(() =>
      expect(posted).toEqual([
        ['resolution', { action: 'repair_shipped', notes: 'New screen, G4S ref 8812.' }],
      ]),
    )
  })

  it('confirms a refund in a coral dialog first', async () => {
    const posted = serve({ status: 'return_received' })
    const { user } = renderPage()
    await user.click(await screen.findByRole('radio', { name: /Refund buyer/ }))
    await user.click(screen.getAllByRole('button', { name: 'Confirm action' })[0] as HTMLElement)
    const dialog = await screen.findByRole('alertdialog', { name: 'Refund KES 52,000 to the buyer?' })
    expect(within(dialog).getByRole('button', { name: 'Go back' })).toHaveFocus()
    await user.click(within(dialog).getByRole('button', { name: 'Refund buyer' }))
    await waitFor(() => expect(posted).toEqual([['resolution', { action: 'refund_issued', notes: null }]]))
  })

  it('sends a disagreement to Vekro support with a reason', async () => {
    const posted = serve({ status: 'return_received' })
    const { user } = renderPage()
    await user.click(await screen.findByRole('button', { name: 'I disagree with this account' }))
    const sheet = await screen.findByRole('dialog', { name: 'Tell Vekro support what happened' })
    await user.click(within(sheet).getByRole('button', { name: 'Send to Vekro support' }))
    expect(
      within(sheet).getByText('Tell support what happened in at least 20 characters.'),
    ).toBeInTheDocument()
    await user.type(
      within(sheet).getByLabelText("What's wrong with the buyer's account?"),
      "The corner crack wasn't there when I sent it.",
    )
    await user.click(within(sheet).getByRole('button', { name: 'Send to Vekro support' }))
    expect(
      await screen.findByRole('heading', { name: 'Vekro support is reviewing this case' }),
    ).toBeInTheDocument()
    expect(posted).toEqual([['escalate', { reason: "The corner crack wasn't there when I sent it." }]])
    expect(screen.queryByRole('button', { name: 'I disagree with this account' })).not.toBeInTheDocument()
  })

  it('closes a resolved case from the seller side', async () => {
    serve({ status: 'resolved_release', dispute: disputeResponse({ buyer_confirmed_resolved: true }) })
    const { user } = renderPage()
    expect(await screen.findByText('Buyer: confirmed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mark as resolved' }))
    expect(await screen.findByText('Case closed.')).toBeInTheDocument()
  })

  it('sends an order without a return to its order page', async () => {
    serve({ status: 'locked', dispute: null })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Order detail' })).toBeInTheDocument()
  })

  it("says the case isn't in this shop", async () => {
    server.use(http.get(`/api/transactions/${ID}`, () => HttpResponse.json({ detail: 'x' }, { status: 404 })))
    renderPage()
    expect(await screen.findByRole('heading', { name: "This order isn't in your shop" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Return case' })).toBeInTheDocument()
  })
})
