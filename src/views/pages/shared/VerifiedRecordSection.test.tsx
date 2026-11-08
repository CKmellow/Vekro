import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { VERIFIED_ORDER, verificationBundle as bundle, verificationTree } from '@/test/verification'
import { VerifiedRecordSection } from './VerifiedRecordSection'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))
vi.mock('@/models/api/registry', async (original) => ({
  ...(await original<object>()),
  registryConfig: () => ({
    chainId: 84532,
    address: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
    rpcUrl: 'https://rpc.test/',
    explorer: 'https://sepolia.basescan.org',
  }),
}))

const ORDER = VERIFIED_ORDER
const tree = verificationTree

function serve(record: object, root: string | null) {
  server.use(
    http.get(`/api/transactions/${ORDER}/verification`, () => HttpResponse.json(record)),
    http.post('https://rpc.test/', async ({ request }) => {
      const { method } = (await request.json()) as { method: string }
      if (root === null) return HttpResponse.error()
      return HttpResponse.json({ jsonrpc: '2.0', id: 1, result: method === 'eth_chainId' ? '0x14a34' : root })
    }),
  )
}

describe('Verified record', () => {
  it('says the record checks out, with a receipt and the seal on the public record', async () => {
    serve(bundle(), tree.root)
    const { user } = renderWithProviders(<VerifiedRecordSection orderId={ORDER} version="Settled" />)
    expect(await screen.findByRole('heading', { name: 'Tamper-evident record' })).toBeInTheDocument()
    expect(screen.getByText(/Every step of this order is sealed on a public record/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'How this works' }))
    expect(screen.getByText('8 of 8')).toBeInTheDocument()
    expect(screen.getByText('Base Sepolia (test network)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View\s+seal 1 on the public record/ })).toHaveAttribute(
      'href',
      `https://sepolia.basescan.org/tx/0x${'cd'.repeat(32)}`,
    )
    expect(screen.getByRole('button', { name: 'Download receipt' })).toBeInTheDocument()
  })

  it("says so when the live order doesn't match its seal", async () => {
    serve(bundle('released'), tree.root)
    renderWithProviders(<VerifiedRecordSection orderId={ORDER} version="Complete" />)
    expect(
      await screen.findByRole('heading', { name: "This record doesn't match its seal" }),
    ).toBeInTheDocument()
  })

  it('shows sealing in progress while the registry has no root yet', async () => {
    serve(bundle(), `0x${'00'.repeat(32)}`)
    renderWithProviders(<VerifiedRecordSection orderId={ORDER} version="Settled" />)
    expect(await screen.findByRole('heading', { name: 'Sealing in progress' })).toBeInTheDocument()
  })

  it('never verifies against a registry the server picked', async () => {
    serve(
      bundle('resolved_split', {
        chain: { chain_id: 84532, network: 'base-sepolia', registry_address: `0x${'99'.repeat(20)}` },
      }),
      tree.root,
    )
    renderWithProviders(<VerifiedRecordSection orderId={ORDER} version="Settled" />)
    expect(await screen.findByRole('heading', { name: "Can't check the seal right now" })).toBeInTheDocument()
  })

  it('reassures when the public record cannot be reached, and retries', async () => {
    serve(bundle(), null)
    renderWithProviders(<VerifiedRecordSection orderId={ORDER} version="Settled" />)
    expect(await screen.findByText(/Your order and your money are not affected/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
