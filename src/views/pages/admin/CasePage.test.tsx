import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { adminCaseDetailResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { CasePage } from './CasePage'

// jsdom can't run exit animations, so the confirm dialog would never unmount.
vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const ID = adminCaseDetailResponse().dispute_id
const REASON = 'Photos are not needed: the seller confirmed the crack on receipt.'

function serve(detail = adminCaseDetailResponse(), decide = () => HttpResponse.json({})) {
  const bodies: unknown[] = []
  server.use(
    http.get(`/api/admin/cases/${ID}`, () => HttpResponse.json(detail)),
    http.post(`/api/admin/disputes/${ID}/force-resolve`, async ({ request }) => {
      bodies.push(await request.json())
      return decide()
    }),
  )
  return bodies
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={[`/admin/cases/${ID}`]}>
      <Routes>
        <Route path="/admin/cases/:id" element={<CasePage />} />
      </Routes>
    </MemoryRouter>,
  )

async function decide(user: ReturnType<typeof renderPage>['user'], option: RegExp) {
  await user.click(await screen.findByRole('radio', { name: option }))
  await user.type(screen.getByLabelText('Reason for the decision'), REASON)
  await user.click(screen.getByRole('button', { name: 'Review decision' }))
}

beforeEach(() => {
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('A3 case detail and decision', () => {
  it('shows both parties with full phones, both accounts and the timeline', async () => {
    serve()
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'D-7A3F' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /\+254712345678.*call the buyer/ })).toHaveAttribute(
      'href',
      'tel:+254712345678',
    )
    expect(screen.getByText('Serial 352098114371234')).toBeInTheDocument()
    expect(screen.getByText('Repair then release')).toBeInTheDocument()
    expect(screen.getByText(/The seller escalated:/)).toBeInTheDocument()
    expect(screen.getByText('No response yet')).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: 'Case timeline' })).getByText('Problem reported'),
    ).toBeInTheDocument()
  })

  it('needs a decision and a real reason before review', async () => {
    serve()
    const { user } = renderPage()
    await user.click(await screen.findByRole('button', { name: 'Review decision' }))
    expect(screen.getByText('Choose a decision.')).toBeInTheDocument()
    expect(screen.getByText(/Write at least 20 characters/)).toBeInTheDocument()
  })

  it('refunds only after the case id is typed', async () => {
    const bodies = serve()
    const { user } = renderPage()
    await decide(user, /Refund buyer/)
    const dialog = await screen.findByRole('alertdialog', { name: 'Confirm this decision' })
    expect(
      within(dialog).getByText('Refund KES 52,000 to Brian Otieno. Amina Gadgets receives nothing.'),
    ).toBeInTheDocument()
    const confirm = within(dialog).getByRole('button', { name: 'Confirm and execute' })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Type D-7A3F to confirm'), 'd-7a3f')
    await user.click(confirm)
    await waitFor(() => expect(bodies).toEqual([{ decision: 'refund', reason: REASON }]))
    expect(toast.current().map((t) => t.message)).toContain('Decision recorded. Payouts are on their way.')
  })

  it('sends a chosen split as the seller share', async () => {
    const bodies = serve()
    const { user } = renderPage()
    await user.click(await screen.findByRole('radio', { name: /Split/ }))
    const seller = screen.getByLabelText('To the seller (KES)')
    await user.clear(seller)
    await user.type(seller, '31200')
    expect(screen.getByLabelText('To the buyer (KES)')).toHaveValue(20800)
    await user.type(screen.getByLabelText('Reason for the decision'), REASON)
    await user.click(screen.getByRole('button', { name: 'Review decision' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.type(within(dialog).getByLabelText(/Type .* to confirm/), 'D-7A3F')
    await user.click(within(dialog).getByRole('button', { name: 'Confirm and execute' }))
    await waitFor(() =>
      expect(bodies).toEqual([{ decision: 'split', reason: REASON, seller_share: '0.6000' }]),
    )
  })

  it('disables Split when the payment provider refuses it', async () => {
    serve(adminCaseDetailResponse(), () =>
      HttpResponse.json({ detail: 'Split unsupported.' }, { status: 409 }),
    )
    const { user } = renderPage()
    await decide(user, /Split/)
    const dialog = await screen.findByRole('alertdialog')
    await user.type(within(dialog).getByLabelText(/Type .* to confirm/), 'D-7A3F')
    await user.click(within(dialog).getByRole('button', { name: 'Confirm and execute' }))
    expect(await screen.findByText(/Split payouts aren't available/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Split/ })).toBeDisabled()
  })

  it('reports a failed execution with Retry', async () => {
    serve(adminCaseDetailResponse(), () => HttpResponse.json({ detail: 'Rail down.' }, { status: 500 }))
    const { user } = renderPage()
    await decide(user, /Release to seller/)
    const dialog = await screen.findByRole('alertdialog')
    await user.type(within(dialog).getByLabelText(/Type .* to confirm/), 'D-7A3F')
    await user.click(within(dialog).getByRole('button', { name: 'Confirm and execute' }))
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('shows a decided case read only', async () => {
    serve(
      adminCaseDetailResponse({
        admin_decision: 'refund',
        decision: {
          decision: 'refund',
          reason: 'Seller never confirmed receipt.',
          seller_share: null,
          decided_by: 'Wanjiru Support',
          decided_at: '2026-10-24T11:36:00Z',
        },
      }),
    )
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Decided' })).toBeInTheDocument()
    expect(screen.getByText(/By Wanjiru Support · 24 Oct 2026, 14:36/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review decision' })).not.toBeInTheDocument()
  })

  it("says when the case doesn't exist", async () => {
    server.use(http.get(`/api/admin/cases/${ID}`, () => HttpResponse.json({ detail: 'x' }, { status: 404 })))
    renderPage()
    expect(await screen.findByRole('heading', { name: "This case doesn't exist" })).toBeInTheDocument()
  })
})
