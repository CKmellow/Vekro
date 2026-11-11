import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { captureInstallPrompt } from './app/installPrompt'
import { registerServiceWorker } from './app/registerServiceWorker'
import './styles/fonts'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

captureInstallPrompt()
void registerServiceWorker()
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
