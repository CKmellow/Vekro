import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImageUploader, type UploaderPhoto } from './ImageUploader'

const photos: UploaderPhoto[] = [
  {
    id: '1',
    name: 'front.jpg',
    previewUrl: 'blob:1',
    originalBytes: 3_000_000,
    compressedBytes: 245_760,
    status: 'ready',
  },
  {
    id: '2',
    name: 'back.jpg',
    previewUrl: 'blob:2',
    originalBytes: 2_000_000,
    status: 'failed',
    error: "This photo couldn't be prepared.",
  },
]

const setup = (list = photos) => {
  const handlers = { onAdd: vi.fn(), onRemove: vi.fn(), onMove: vi.fn(), onRetry: vi.fn() }
  render(<ImageUploader label="Photos" photos={list} max={4} {...handlers} />)
  return handlers
}

describe('ImageUploader', () => {
  it('marks the cover, shows the compressed size and retries a failed photo', async () => {
    const { onRetry, onMove } = setup()
    expect(screen.getByText('Cover')).toBeInTheDocument()
    expect(screen.getByText('240 KB')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent("This photo couldn't be prepared.")
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledWith('2')
    expect(screen.getByRole('button', { name: 'Move front.jpg earlier' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Move front.jpg later' }))
    expect(onMove).toHaveBeenCalledWith('1', 1)
  })

  it('passes picked files to onAdd', async () => {
    const { onAdd } = setup([])
    const file = new File(['x'], 'sofa.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText(/add photo/i), file)
    expect(onAdd).toHaveBeenCalledWith([file])
  })
})
