import { describe, expect, it } from 'vitest'
import { toHex } from './hash'
import { MAX_SUM, orderCommit, parseCents, sumLeaf, sumNode, verifySumProof } from './sumTree'
import vectors from './sumTreeVectors.json'

describe('liabilities sum tree (golden vectors shared with the backend)', () => {
  for (const tree of vectors.trees) {
    it(`proves every leaf of a ${tree.size}-leaf tree into its root and total`, () => {
      tree.leaves.forEach((leaf, index) => {
        expect(verifySumProof(leaf, tree.proofs[index] as never, tree.root)).toBe(true)
      })
      const total = tree.leaves.reduce((sum, leaf) => sum + BigInt(leaf.amount_cents), 0n)
      expect(String(total)).toBe(tree.root.sum)
    })
  }

  for (const failing of vectors.must_fail) {
    it(`refuses: ${failing.name}`, () => {
      expect(verifySumProof(failing.leaf, failing.proof as never, failing.root)).toBe(false)
    })
  }

  it('recomputes the order commitment from the order id', () => {
    for (const item of vectors.order_commit) {
      expect(toHex(orderCommit(item.transaction_id))).toBe(item.order_commit)
      expect(toHex(orderCommit(item.transaction_id.toUpperCase()))).toBe(item.order_commit)
    }
  })

  it('range-checks every amount and sum', () => {
    expect(parseCents('650000')).toBe(650000n)
    expect(parseCents('-1')).toBeNull()
    expect(parseCents('1.5')).toBeNull()
    expect(parseCents(String(MAX_SUM + 1n))).toBeNull()
    const salt = new Uint8Array(32)
    expect(sumNode(sumLeaf(salt, salt, MAX_SUM), sumLeaf(salt, salt, 1n))).toBeNull()
  })
})
