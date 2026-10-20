import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { recordUnhandled, server, takeUnhandled } from './server'

// jsdom has no canvas. Views that draw (the S9 QR card) treat a null context as "cannot draw".
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext

// jsdom's Blob has no arrayBuffer() (browsers do); the API client reads uploads with it.
if (!('arrayBuffer' in Blob.prototype)) {
  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    value(this: Blob) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(reader.error ?? new Error('read failed'))
        reader.readAsArrayBuffer(this)
      })
    },
  })
}

beforeAll(() =>
  server.listen({
    // Block the request (never reach the network) and record it: a query often swallows the failed
    // fetch, so the test would still pass. afterEach turns the record into a failure.
    onUnhandledRequest: (request) => {
      recordUnhandled(request)
      throw new Error(`Unhandled ${request.method} ${request.url}`)
    },
  }),
)
afterEach(() => {
  server.resetHandlers()
  cleanup()
  const missed = takeUnhandled()
  if (missed.length > 0) throw new Error(`Unhandled requests (add MSW handlers): ${missed.join(', ')}`)
})
afterAll(() => server.close())
