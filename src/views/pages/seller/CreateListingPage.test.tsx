import { act, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { toast } from '@/lib/toast'
import { renderWithProviders } from '@/test/render'
import { CreateListingPage } from './CreateListingPage'

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <CreateListingPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S7 step 1', () => {
  it('validates the item before moving on', async () => {
    const { user } = renderPage()
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByText('Give your item a title')).toBeInTheDocument()
    expect(screen.getByText('Enter a price in KES')).toBeInTheDocument()
  })

  it('formats the price and updates the live preview', async () => {
    const { user } = renderPage()
    await user.type(screen.getByLabelText('Title'), 'iPhone 13, 128GB, Midnight')
    await user.type(screen.getByLabelText('Price'), '52000')
    expect(screen.getByLabelText('Price')).toHaveValue('52,000')
    const preview = screen.getByRole('complementary', { name: 'Live buyer preview' })
    expect(preview).toHaveTextContent('iPhone 13, 128GB, Midnight')
    expect(preview).toHaveTextContent('KES 52,000')
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByRole('radio', { name: /^Standard item/ })).toBeChecked()
  })

  it('saves the draft on this device and restores it with a toast', async () => {
    const { user, unmount } = renderPage()
    await user.type(screen.getByLabelText('Title'), 'Kitenge wrap dress')
    await user.click(screen.getAllByRole('button', { name: 'Save draft' })[0] as HTMLElement)
    expect(toast.current().at(-1)?.message).toBe('Draft saved on this device')
    unmount()
    renderPage()
    expect(await screen.findByLabelText('Title')).toHaveValue('Kitenge wrap dress')
    expect(toast.current().at(-1)?.message).toBe('Draft restored')
  })

  it('step 2 needs the serial number for serial-numbered items', { timeout: 15_000 }, async () => {
    const { user } = renderPage()
    await user.type(screen.getByLabelText('Title'), 'iPhone 13, 128GB, Midnight')
    await user.type(screen.getByLabelText('Price'), '52000')
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    await user.click(await screen.findByRole('radio', { name: /^Serial-numbered item/ }))
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByText('Enter the IMEI or serial number')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Unique ID (IMEI or serial)'), '35 209 811 437 1234')
    expect(screen.getByRole('complementary', { name: 'Live buyer preview' })).toHaveTextContent(
      'Serial ends 1234',
    )
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByText('Problems you accept')).toBeInTheDocument()
  })

  async function toPolicy(user: ReturnType<typeof renderPage>['user'], serial: boolean) {
    await user.type(screen.getByLabelText('Title'), 'iPhone 13, 128GB, Midnight')
    await user.type(screen.getByLabelText('Price'), '52000')
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    if (serial) {
      await user.click(await screen.findByRole('radio', { name: /^Serial-numbered item/ }))
      await user.type(screen.getByLabelText('Unique ID (IMEI or serial)'), '352098114371234')
    }
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
  }

  it('step 3 standard: needs at least one door reason', async () => {
    const { user } = renderPage()
    await toPolicy(user, false)
    for (const name of ['Damaged', 'Wrong item', 'Not as described']) {
      await user.click(await screen.findByRole('checkbox', { name }))
    }
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByText('Pick at least one reason')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Damaged' }))
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument()
  })

  it(
    'step 3 serial-numbered: blocks publishing without a policy, then accepts chips and a resolution',
    { timeout: 15_000 },
    async () => {
      const { user } = renderPage()
      await toPolicy(user, true)
      await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
      expect(
        await screen.findByText('Serial-numbered listings need a policy before you can publish.'),
      ).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: "Won't power on" }))
      await user.click(screen.getByRole('button', { name: 'Add' }))
      await user.type(screen.getByLabelText('Problem to add'), 'Face ID not working{Enter}')
      expect(screen.getByRole('button', { name: 'Face ID not working' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await user.click(screen.getByRole('radio', { name: /Repair then release/ }))
      expect(screen.getByRole('complementary', { name: 'Live buyer preview' })).toHaveTextContent(
        "Report a problem within 24 hours of delivery for Won't power on, Face ID not working. The seller's fix: Repair then release.",
      )
      await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
      expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument()
    },
  )

  it('step 4 publishes and goes to the listing with the success flag', { timeout: 20_000 }, async () => {
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/server')
    let posted: Record<string, unknown> | undefined
    server.use(
      http.post('/api/listings', async ({ request }) => {
        posted = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
          { id: 'l-new', seller_id: 's1', created_at: '', updated_at: '', ...posted, price: '52000.00' },
          { status: 201 },
        )
      }),
    )
    const { createMemoryRouter, RouterProvider } = await import('react-router')
    const router = createMemoryRouter(
      [
        { path: '/seller/listings/new', element: <CreateListingPage /> },
        { path: '/seller/listings/:id', element: <h1>Listing detail</h1> },
      ],
      { initialEntries: ['/seller/listings/new'] },
    )
    const { user } = renderWithProviders(<RouterProvider router={router} />)
    await user.type(screen.getByLabelText('Title'), 'Nike Air Force 1, size 42')
    await user.type(screen.getByLabelText('Price'), '6500')
    for (let i = 0; i < 3; i++)
      await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your payout' })).toHaveTextContent('KES 6,440')
    await user.click(screen.getByRole('button', { name: 'Publish and get link' }))
    await screen.findByRole('heading', { name: 'Listing detail' })
    expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(
      '/seller/listings/l-new?published=1',
    )
    expect(posted).toMatchObject({
      title: 'Nike Air Force 1, size 42',
      price: '6500',
      is_serialized: false,
      dispute_policy: { door_reject_reasons: ['damaged', 'wrong_item', 'not_as_described'] },
    })
    expect(localStorage.length).toBe(0)
  })
})
