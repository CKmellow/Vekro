import { describe, expect, it } from 'vitest'
import { parseTrackInput } from './useMyOrders'

describe('parseTrackInput', () => {
  it('reads an order link or a reference, and nothing else', () => {
    expect(parseTrackInput('https://vekro.app/order/3FA85F64-5717-4562-B3FC-2C963F66AFA6')).toEqual({
      orderId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    expect(parseTrackInput(' vk-7k3p9q ')).toEqual({ reference: 'VK-7K3P9Q' })
    expect(parseTrackInput('0712345678')).toBeNull()
    expect(parseTrackInput('')).toBeNull()
  })
})
