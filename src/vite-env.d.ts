/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  // Backend-gap mock flags (src/models/api/adapters/gaps.ts), "true" to enable.
  readonly [key: `VITE_MOCK_${string}`]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
