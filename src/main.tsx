import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerServiceWorker } from './app/registerServiceWorker'
import { mockedGaps } from './models/api/adapters/gaps'
import './styles/fonts'
import './index.css'

async function enableGapMocks() {
  if (!import.meta.env.DEV) return
  const enabled = mockedGaps()
  if (enabled.size === 0) return
  const { startGapMocks } = await import('./mocks/browser')
  await startGapMocks(enabled)
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

void registerServiceWorker()
void enableGapMocks().then(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
