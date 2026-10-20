import { setupServer } from 'msw/node'

// Shared MSW server for tests. Tests add handlers with server.use(...).
export const server = setupServer()

const unhandled: string[] = []

/** Records a request no handler matched; the setup fails the test that made it. */
export function recordUnhandled(request: Request) {
  unhandled.push(`${request.method} ${new URL(request.url).pathname}`)
}

/** Returns and clears the unhandled requests seen since the last call. */
export function takeUnhandled(): string[] {
  return unhandled.splice(0)
}
