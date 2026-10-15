import { setupWorker } from 'msw/browser'
import type { Gap } from '@/models/api/adapters/gaps'
import { handlersFor } from './registry'

/** Starts the MSW service worker for the enabled gap flags (dev only). */
export async function startGapMocks(enabled: Set<Gap>) {
  const worker = setupWorker(...handlersFor(enabled))
  await worker.start({ onUnhandledRequest: 'bypass', quiet: false })
  console.info(`[vekro] backend-gap mocks on: ${[...enabled].join(', ')}`)
}
