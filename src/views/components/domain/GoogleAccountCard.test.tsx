import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { noticeFor } from '@/controllers/useGoogleAccount'
import { GoogleAccountCard } from './GoogleAccountCard'

const props = { notice: null, linking: false, unlinking: false, onLink: vi.fn(), onUnlink: vi.fn() }

describe('GoogleAccountCard (#312)', () => {
  it('offers to link when nothing is linked', async () => {
    const onLink = vi.fn()
    render(<GoogleAccountCard {...props} linkedEmail={null} onLink={onLink} />)
    await userEvent.click(screen.getByRole('button', { name: 'Link Google' }))
    expect(onLink).toHaveBeenCalledOnce()
  })

  it('shows the linked account and unlinks it', async () => {
    const onUnlink = vi.fn()
    render(<GoogleAccountCard {...props} linkedEmail="b@example.com" onUnlink={onUnlink} />)
    expect(screen.getByText('b@example.com')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Unlink' }))
    expect(onUnlink).toHaveBeenCalledOnce()
  })

  it('explains each result from Google', () => {
    expect(noticeFor('linked')).toBe('linked')
    expect(noticeFor('taken')).toBe('taken')
    expect(noticeFor('denied')).toBe('denied')
    expect(noticeFor('id_token')).toBe('failed')
    expect(noticeFor(null)).toBeNull()
    render(<GoogleAccountCard {...props} linkedEmail={null} notice="taken" />)
    expect(screen.getByText(/already linked to another Vekro account/)).toBeInTheDocument()
  })
})
