import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { adminCaseListResponse, adminCaseSummaryResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { QueuePage } from './QueuePage'

const other = adminCaseSummaryResponse({
  dispute_id: '9b8c7d6e-0000-4000-8000-000000000002',
  reference: 'VK-3M8D2L',
  trigger: 'receipt_timeout',
  escalated_by: null,
  amount: '6500.00',
  escalated_at: new Date(Date.now() - 30 * 3_600_000).toISOString(),
})

const requests: URL[] = []
function serve(
  body = adminCaseListResponse([adminCaseSummaryResponse(), other], {
    counters: { open: 2, older_than_24h: 1, decided_today: 3, average_decision_seconds: 19_200 },
  }),
) {
  server.use(
    http.get('/api/admin/cases', ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json(body)
    }),
  )
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<QueuePage />} />
        <Route path="/admin/cases/:id" element={<h1>Case</h1>} />
      </Routes>
    </MemoryRouter>,
  )

describe('A2 escalation queue', () => {
  it('shows counters and cases, oldest first, with triggers and age', async () => {
    serve()
    renderPage()
    const table = await screen.findByRole('table', { name: 'Escalated cases' })
    const rows = table.querySelectorAll('tbody tr')
    expect(rows[0]?.textContent).toContain('VK-3M8D2L')
    expect(rows[0]?.textContent).toContain("Seller didn't confirm receipt")
    expect(rows[1]?.textContent).toContain('Seller disagrees')
    expect(screen.getByText('5h 20m')).toBeInTheDocument()
    expect(screen.getByText('30h')).toBeInTheDocument()
    expect(requests[0]?.searchParams.get('status')).toBe('open')
  })

  it('filters by status and trigger', async () => {
    serve()
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'Escalated cases' })
    await user.click(screen.getByRole('button', { name: 'Parties disagree' }))
    expect(screen.queryByText('VK-3M8D2L')).not.toBeInTheDocument()
    expect(screen.getByText('VK-7K3P9Q')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Decided' }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe('decided'))
  })

  it('moves with J and K and opens with Enter', async () => {
    serve()
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'Escalated cases' })
    await user.keyboard('j')
    expect(screen.getByRole('link', { name: /Open case .* for VK-7K3P9Q/ })).toHaveFocus()
    await user.keyboard('k')
    expect(screen.getByRole('link', { name: /Open case .* for VK-3M8D2L/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Case' })).toBeInTheDocument()
  })

  it('says when nothing is waiting', async () => {
    serve(adminCaseListResponse([]))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Nothing waiting. Nice.' })).toBeInTheDocument()
  })

  it('offers a retry when the queue fails to load', async () => {
    server.use(http.get('/api/admin/cases', () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("We couldn't load the queue.")).toBeInTheDocument()
  })
})
