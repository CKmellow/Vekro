import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { listingResponse, orderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ReportIssuePage } from './ReportIssuePage'

const ID = orderResponse().id
const held = (overrides: Parameters<typeof orderResponse>[0] = {}) =>
  orderResponse({
    status: 'hold_24h',
    payment: null,
    deadlines: {
      ...orderResponse().deadlines,
      hold_until: new Date(Date.now() + 20 * 3_600_000).toISOString(),
    },
    ...overrides,
  })

function serve(order = held()) {
  let body: unknown
  let current = order
  server.use(
    http.get(`/api/transactions/${ID}`, () => HttpResponse.json(current)),
    http.get(`/api/listings/${listingResponse().id}`, () => HttpResponse.json(listingResponse())),
    http.post(`/api/transactions/${ID}/report-functional-issue`, async ({ request }) => {
      body = await request.json()
      current = { ...current, status: 'disputed_functional' }
      return HttpResponse.json({})
    }),
  )
  return { sent: () => body }
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={[`/order/${ID}/report`]}>
      <Routes>
        <Route path="/order/:orderId/report" element={<ReportIssuePage />} />
        <Route path="/order/:orderId/return" element={<h1>Return flow</h1>} />
        <Route path="/order/:orderId" element={<h1>Tracker</h1>} />
      </Routes>
    </MemoryRouter>,
  )

describe('B5 report an issue', () => {
  it('reports a problem and shows what happens next', async () => {
    const api = serve()
    const { user } = renderPage()
    expect(await screen.findByRole('heading', { name: "What's wrong with your item?" })).toBeInTheDocument()
    expect(await screen.findByText('Serial ••••1234')).toBeInTheDocument()
    expect(
      screen.getByText(/Amina Gadgets covers: Won't power on, Screen or touch problem/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Submit report' }))
    expect(screen.getByText('Choose the problem.')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: "It doesn't work properly" }))
    expect(screen.getByText('The seller repairs it')).toBeInTheDocument()
    await user.type(screen.getByLabelText("What's happening?"), 'The screen flickers and goes black.')
    await user.click(screen.getByRole('checkbox', { name: 'I understand I need to send the item back.' }))
    await user.click(screen.getByRole('button', { name: 'Submit report' }))

    expect(await screen.findByRole('heading', { name: "We've told the seller" })).toBeInTheDocument()
    expect(api.sent()).toEqual({
      category: 'not_working',
      description: 'The screen flickers and goes black.',
      evidence: {},
    })
    await user.click(screen.getByRole('button', { name: 'Next: send the item back' }))
    expect(await screen.findByRole('heading', { name: 'Return flow' })).toBeInTheDocument()
  })

  it('sends "Something else" to Vekro support without the return checkbox', async () => {
    serve()
    const { user } = renderPage()
    await user.click(await screen.findByRole('radio', { name: /Something else/ }))
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByText('Vekro support reviews your report')).toBeInTheDocument()
    await user.type(screen.getByLabelText("What's happening?"), 'It came with someone else’s account on it.')
    await user.click(screen.getByRole('button', { name: 'Submit report' }))
    expect(await screen.findByRole('heading', { name: 'Vekro support has your report' })).toBeInTheDocument()
  })

  it('closes the form once the window has passed', async () => {
    serve(held({ status: 'released' }))
    renderPage()
    expect(await screen.findByText('The reporting window has closed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit report' })).toBeDisabled()
  })

  it('explains that standard items are final', async () => {
    serve(held({ listing: { ...orderResponse().listing, is_serialized: false } }))
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'Sales of this type are final once you give your code.' }),
    ).toBeInTheDocument()
  })

  it('sends an order that is already in a return to the return flow', async () => {
    serve(held({ status: 'return_in_transit' }))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Return flow' })).toBeInTheDocument()
  })

  it('keeps the report when sending fails', async () => {
    serve()
    server.use(
      http.post(`/api/transactions/${ID}/report-functional-issue`, () =>
        HttpResponse.json({ detail: 'x' }, { status: 500 }),
      ),
    )
    const { user } = renderPage()
    await user.click(await screen.findByRole('radio', { name: 'Parts are missing' }))
    await user.type(screen.getByLabelText("What's happening?"), 'The charger was not in the box.')
    await user.click(screen.getByRole('checkbox', { name: 'I understand I need to send the item back.' }))
    await user.click(screen.getByRole('button', { name: 'Submit report' }))
    expect(await screen.findByText("We couldn't send your report. Try again.")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByLabelText("What's happening?")).toHaveValue('The charger was not in the box.'),
    )
  })
})
