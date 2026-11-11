import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

/**
 * Handlers every test gets unless it overrides them: Continue with Google is off (#312), as on a
 * backend without a Google client. Tests that need it on use server.use(googleOn()).
 */
const defaults = [http.get('/api/auth/google/status', () => HttpResponse.json({ enabled: false }))]

// Shared MSW server for tests. Tests add handlers with server.use(...); resetHandlers keeps the defaults.
export const server = setupServer(...defaults)

export const googleOn = () => http.get('/api/auth/google/status', () => HttpResponse.json({ enabled: true }))

const unhandled: string[] = []

/** Records a request no handler matched; the setup fails the test that made it. */
export function recordUnhandled(request: Request) {
  unhandled.push(`${request.method} ${new URL(request.url).pathname}`)
}

/** Returns and clears the unhandled requests seen since the last call. */
export function takeUnhandled(): string[] {
  return unhandled.splice(0)
}
