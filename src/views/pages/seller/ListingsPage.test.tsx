import { act, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { gapHandlers } from '@/mocks/registry'
import '@/mocks/gaps'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ListingsPage } from './ListingsPage'

const mocked = new Set<string>()
vi.mock('@/models/api/adapters/gaps', async (original) => ({
  ...(await original<object>()),
  isMocked: (gap: string) => mocked.has(gap),
}))

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <ListingsPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  mocked.clear()
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S8 listings', () => {
  it('says the list is not available when the gap mock is off', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Your listings will show here' })).toBeInTheDocument()
  })

  describe('with the gap mocks on', () => {
    beforeEach(() => {
      mocked.add('SELLER_LISTS').add('LISTING_UPDATE').add('LISTING_CONTENT')
      server.use(
        ...(gapHandlers.SELLER_LISTS ?? []),
        ...(gapHandlers.LISTING_UPDATE ?? []),
        ...(gapHandlers.LISTING_CONTENT ?? []),
      )
    })

    it('shows active listings with counts, filters and search', async () => {
      const { user } = renderPage()
      const list = await screen.findByRole('list', { name: 'Listings' })
      expect(within(list).getByText('Nike Air Force 1, size 42')).toBeInTheDocument()
      expect(within(list).queryByText('Leather sandals')).not.toBeInTheDocument()
      await user.click(screen.getByRole('radio', { name: /draft/i }))
      expect(await screen.findByText('Leather sandals')).toBeInTheDocument()
      await user.click(screen.getByRole('radio', { name: /active/i }))
      await user.type(screen.getByRole('searchbox', { name: 'Search listings' }), 'sofa')
      expect(await screen.findByText('No listings match "sofa"')).toBeInTheDocument()
    })

    it('copies a link with a toast', async () => {
      const { user } = renderPage()
      // userEvent installs its own clipboard on setup; replace it after rendering.
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      const list = await screen.findByRole('list', { name: 'Listings' })
      await user.click(within(list).getAllByRole('button', { name: 'Copy link' })[0] as HTMLElement)
      expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/pay\/7f3c2a10-/))
      expect(toast.current().at(-1)?.message).toBe('Link copied')
    })

    it('archives after confirming', async () => {
      const { user } = renderPage()
      await screen.findByRole('list', { name: 'Listings' })
      await user.click(screen.getByRole('button', { name: 'More actions for Kitenge wrap dress' }))
      await user.click(screen.getByRole('button', { name: 'Archive' }))
      await user.click(await screen.findByRole('button', { name: 'Archive listing' }))
      expect(toast.current().at(-1)?.message).toBe('Archived. The link no longer takes payments.')
    })
  })
})
