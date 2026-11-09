import type { Schemas } from '@/models/api/client'
import { parseCanonical, type Json } from './canonical'
import { fromHex, leafHash, sameBytes, ZERO_HASH } from './hash'
import { verifyInclusion, type ProofStep } from './merkle'

/**
 * Check an order's tamper-evident record (backend docs/frontend-verification-contract.md section 5;
 * the same rules as app/services/anchoring/verify.py). Every root comes from the registry through
 * `rootOf`, never from the bundle: the server provides data, the verdict is ours.
 */
export type Verdict = 'VERIFIED' | 'PARTIALLY_PENDING' | 'TAMPERED' | 'UNAVAILABLE'
export type VerificationBundle = Schemas['TransactionVerificationResponse']
type BundleEvent = Schemas['VerificationEventResponse']
type BundleAnchor = Schemas['EventAnchorResponse']

export interface Finding {
  code:
    | 'non_canonical_payload'
    | 'wrong_transaction'
    | 'chain_broken'
    | 'leaf_mismatch'
    | 'proof_invalid'
    | 'root_mismatch'
    | 'linked_missing'
    | 'status_mismatch'
    | 'amount_mismatch'
    | 'no_events'
    | 'chain_unavailable'
  eventIndex?: number
}

export interface VerificationReport {
  verdict: Verdict
  findings: Finding[]
  anchored: number
  pending: number
  total: number
}

/** Reads a batch root from the registry: 32 zero bytes when the batch is not anchored yet. */
export type RootOf = (batchId: number) => Promise<Uint8Array>

export class RegistryUnavailableError extends Error {}

const TAMPER = new Set<Finding['code']>([
  'non_canonical_payload',
  'wrong_transaction',
  'chain_broken',
  'leaf_mismatch',
  'proof_invalid',
  'root_mismatch',
  'linked_missing',
  'status_mismatch',
  'amount_mismatch',
])

type Body = { [key: string]: Json }

export async function verifyBundle(bundle: VerificationBundle, rootOf: RootOf): Promise<VerificationReport> {
  const report: VerificationReport = {
    verdict: 'VERIFIED',
    findings: [],
    anchored: 0,
    pending: 0,
    total: bundle.events.length,
  }
  if (bundle.events.length === 0) {
    return { ...report, verdict: 'UNAVAILABLE', findings: [{ code: 'no_events' }] }
  }
  const roots = new Map<number, Promise<Uint8Array>>()
  const chainRoot = (batchId: number) => {
    if (!roots.has(batchId)) roots.set(batchId, rootOf(batchId))
    return roots.get(batchId) as Promise<Uint8Array>
  }

  try {
    let prev = ZERO_HASH
    const bodies: Body[] = []
    for (const [index, event] of bundle.events.entries()) {
      const body = parseCanonical(event.payload)
      if (!body) report.findings.push({ code: 'non_canonical_payload', eventIndex: index })
      const owner = body?.transaction_id
      if (owner !== undefined && owner !== null && owner !== bundle.transaction_id)
        report.findings.push({ code: 'wrong_transaction', eventIndex: index })
      const stated = fromHex(event.prev_event_hash)
      if (!sameBytes(stated, prev)) report.findings.push({ code: 'chain_broken', eventIndex: index })
      const leaf = recomputeLeaf(event)
      if (!leaf || !sameBytes(leaf, fromHex(event.leaf_hash)))
        report.findings.push({ code: 'leaf_mismatch', eventIndex: index })
      else {
        const state = await anchorState(event.anchor ?? null, leaf, chainRoot)
        if (state === 'anchored') report.anchored += 1
        else if (state === 'pending') report.pending += 1
        else report.findings.push({ code: state, eventIndex: index })
      }
      bodies.push(body ?? {})
      prev = fromHex(event.leaf_hash) ?? ZERO_HASH
    }
    await checkLinked(report, bundle, bodies, chainRoot)
    checkCurrent(report, bundle.current, bodies)
  } catch (error) {
    if (!(error instanceof RegistryUnavailableError)) throw error
    return { ...report, verdict: 'UNAVAILABLE', findings: [{ code: 'chain_unavailable' }] }
  }

  if (report.findings.some((finding) => TAMPER.has(finding.code))) report.verdict = 'TAMPERED'
  else if (report.pending > 0) report.verdict = 'PARTIALLY_PENDING'
  return report
}

function recomputeLeaf(event: Pick<BundleEvent, 'salt' | 'prev_event_hash' | 'payload'>): Uint8Array | null {
  const salt = fromHex(event.salt)
  const prev = fromHex(event.prev_event_hash)
  if (!salt || !prev || salt.length !== 32 || prev.length !== 32) return null
  return leafHash(salt, prev, event.payload)
}

async function anchorState(
  anchor: BundleAnchor | null,
  leaf: Uint8Array,
  chainRoot: RootOf,
): Promise<'anchored' | 'pending' | 'root_mismatch' | 'proof_invalid'> {
  if (!anchor) return 'pending'
  const onChain = await chainRoot(anchor.batch_id)
  if (sameBytes(onChain, ZERO_HASH)) return 'pending'
  const proof: ProofStep[] = []
  for (const step of anchor.proof) {
    const sibling = fromHex(step.sibling)
    if (!sibling) return 'proof_invalid'
    proof.push({ sibling, side: step.side })
  }
  if (verifyInclusion(leaf, proof, onChain, anchor.leaf_index, anchor.leaf_count)) return 'anchored'
  return sameBytes(fromHex(anchor.batch_root), onChain) ? 'proof_invalid' : 'root_mismatch'
}

/** Provider events from the global chain that this order links to: checked, not counted. */
async function checkLinked(
  report: VerificationReport,
  bundle: VerificationBundle,
  bodies: Body[],
  chainRoot: RootOf,
) {
  const linked = new Map(bundle.linked_events.map((event) => [event.leaf_hash, event]))
  for (const [index, body] of bodies.entries()) {
    if (body.type !== 'global_event_linked') continue
    const target = linked.get(String(body.global_leaf_hash))
    if (!target) {
      report.findings.push({ code: 'linked_missing', eventIndex: index })
      continue
    }
    const leaf = recomputeLeaf(target)
    if (!leaf || !sameBytes(leaf, fromHex(target.leaf_hash))) {
      report.findings.push({ code: 'leaf_mismatch', eventIndex: index })
      continue
    }
    const state = await anchorState(target.anchor ?? null, leaf, chainRoot)
    if (state === 'root_mismatch' || state === 'proof_invalid')
      report.findings.push({ code: state, eventIndex: index })
  }
}

function checkCurrent(report: VerificationReport, current: VerificationBundle['current'], bodies: Body[]) {
  let status: Json | undefined
  let amount: Json | undefined
  for (const body of bodies) {
    if (body.type === 'transaction_transition') status = body.to
    else if (body.type === 'backfill_snapshot') {
      status = body.status
      amount = body.amount
    } else if (body.type === 'transaction_created') amount = body.amount
  }
  if (status !== undefined && status !== current.status) report.findings.push({ code: 'status_mismatch' })
  if (amount !== undefined && amount !== current.amount) report.findings.push({ code: 'amount_mismatch' })
}
