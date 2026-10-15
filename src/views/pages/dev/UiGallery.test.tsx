import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { UiGallery } from './UiGallery'

describe('UiGallery', () => {
  it('renders every section of the Design System Sheet', () => {
    renderWithProviders(
      <MemoryRouter>
        <UiGallery />
      </MemoryRouter>,
    )
    for (const name of [
      'Buttons',
      'Fields and choices',
      'Status pills (buyer · seller)',
      'Vault, lock ring and money path',
      'Time and progress',
      'Feedback',
      'Display',
      'Image uploader (live)',
    ]) {
      expect(screen.getByRole('heading', { name, level: 2 })).toBeInTheDocument()
    }
    expect(screen.getAllByText('Settled by Vekro support', { selector: 'span' })).toHaveLength(2)
  })
})
