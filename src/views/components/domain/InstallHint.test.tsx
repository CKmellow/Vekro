import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InstallHint } from './InstallHint'

describe('InstallHint (#304)', () => {
  it('offers Install and a way to dismiss it', async () => {
    const onInstall = vi.fn()
    const onDismiss = vi.fn()
    render(<InstallHint onInstall={onInstall} onDismiss={onDismiss} />)
    expect(screen.getByRole('region', { name: 'Install Vekro' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Install' }))
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onInstall).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
