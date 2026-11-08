import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js'

/** keccak256 as Ethereum uses it (not SHA3-256). */
export const keccak256 = (...parts: Uint8Array[]): Uint8Array => keccak_256(concatBytes(...parts))

export const ZERO_HASH = new Uint8Array(32)
const LEAF = Uint8Array.of(0)
const NODE = Uint8Array.of(1)

/** keccak256(0x00 || salt || prev_event_hash || utf8(payload)) */
export const leafHash = (salt: Uint8Array, prev: Uint8Array, payload: string) =>
  keccak256(LEAF, salt, prev, utf8ToBytes(payload))

/** keccak256(0x01 || left || right) */
export const nodeHash = (left: Uint8Array, right: Uint8Array) => keccak256(NODE, left, right)

/** 0x-prefixed lowercase hex; null for anything that is not 0x + an even number of hex digits. */
export function fromHex(value: string | null | undefined): Uint8Array | null {
  if (!value || !/^0x([0-9a-fA-F]{2})*$/.test(value)) return null
  return hexToBytes(value.slice(2))
}

export const toHex = (bytes: Uint8Array) => `0x${bytesToHex(bytes)}`

export function sameBytes(a: Uint8Array | null, b: Uint8Array | null): boolean {
  if (!a || !b || a.length !== b.length) return false
  return a.every((byte, i) => byte === b[i])
}
