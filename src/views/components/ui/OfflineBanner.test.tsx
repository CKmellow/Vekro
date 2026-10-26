import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

describe('OfflineBanner', () => {
  it('says how old the data is, and renders nothing while online', () => {
    const { rerender, container } = render(<OfflineBanner since={null} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<OfflineBanner since="14:36" note="Archiving needs a connection." />)
    expect(screen.getByRole('status')).toHaveTextContent(
      "You're offline.Showing the last update at 14:36. Archiving needs a connection.",
    )
  })
})
