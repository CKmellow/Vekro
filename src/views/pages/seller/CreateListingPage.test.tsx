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

  it('step 2 needs the serial number for serial-numbered items', async () => {
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
    expect(await screen.findByRole('heading', { name: 'Dispute policy' })).toBeInTheDocument()
  })
})
